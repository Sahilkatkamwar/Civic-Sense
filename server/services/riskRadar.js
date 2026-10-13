// server/services/riskRadar.js
const crypto = require('crypto');
const { distanceMeters } = require('./duplicate');
const { getRecommendation, getInspectFirstId } = require('./riskRecommendations');

/**
 * Pure clustering function: Groups complaints by category and performs BFS single-link clustering.
 * @param {Array} openComplaints - Complaints where status not in ('resolved', 'rejected') and duplicate_of is null
 * @param {number} radiusMeters - Cluster distance threshold
 * @param {number} minSignals - Minimum signals required for an emerging cluster
 * @returns {Array} List of raw clusters with their member complaints
 */
function buildRawClusters(openComplaints, radiusMeters = 150, minSignals = 3) {
  // 1. Group by category_id
  const byCategory = {};
  for (const c of openComplaints) {
    if (c.latitude == null || c.longitude == null) continue;
    if (!byCategory[c.category_id]) {
      byCategory[c.category_id] = [];
    }
    byCategory[c.category_id].push(c);
  }

  const qualifyingClusters = [];

  // 2. Perform DBSCAN-style single-link expansion (BFS) per category
  for (const [categoryId, categoryComplaints] of Object.entries(byCategory)) {
    const visited = new Set();

    for (let i = 0; i < categoryComplaints.length; i++) {
      if (visited.has(categoryComplaints[i].id)) continue;

      const clusterMembers = [];
      const queue = [categoryComplaints[i]];
      visited.add(categoryComplaints[i].id);

      while (queue.length > 0) {
        const current = queue.shift();
        clusterMembers.push(current);

        for (let j = 0; j < categoryComplaints.length; j++) {
          const candidate = categoryComplaints[j];
          if (!visited.has(candidate.id)) {
            const dist = distanceMeters(
              current.latitude,
              current.longitude,
              candidate.latitude,
              candidate.longitude
            );
            if (dist <= radiusMeters) {
              visited.add(candidate.id);
              queue.push(candidate);
            }
          }
        }
      }

      // 3. Check signals count: sum of report_count
      const signals = clusterMembers.reduce((sum, item) => sum + (item.report_count || 1), 0);
      if (signals >= minSignals) {
        qualifyingClusters.push({
          categoryId,
          members: clusterMembers,
          signals
        });
      }
    }
  }

  return qualifyingClusters;
}

/**
 * Calculates risk metrics, explainable score, and factor breakdown for a cluster.
 */
function evaluateCluster(rawCluster, categoriesMap, resolvedRecentComplaints, radiusMeters = 150) {
  const { categoryId, members, signals } = rawCluster;
  const category = categoriesMap[categoryId] || {
    id: categoryId,
    name: categoryId,
    icon: '📍',
    severity_weight: 2
  };

  const complaintCount = members.length;

  // Center: average lat/lng
  const avgLat = members.reduce((s, m) => s + m.latitude, 0) / complaintCount;
  const avgLng = members.reduce((s, m) => s + m.longitude, 0) / complaintCount;
  const center = {
    lat: Number(avgLat.toFixed(6)),
    lng: Number(avgLng.toFixed(6))
  };

  // Radius: max distance from center to any member, min 40m
  let maxDist = 0;
  for (const m of members) {
    const d = distanceMeters(center.lat, center.lng, m.latitude, m.longitude);
    if (d > maxDist) maxDist = d;
  }
  const radius = Math.max(40, Math.round(maxDist));

  // Oldest open complaint age in days
  const now = Date.now();
  let oldestTime = now;
  for (const m of members) {
    const t = new Date(m.created_at).getTime();
    if (t < oldestTime) oldestTime = t;
  }
  const oldestOpenDays = Math.max(0, Math.floor((now - oldestTime) / (1000 * 60 * 60 * 24)));

  // Recurrence: count of resolved complaints of same category within radiusMeters of center in last 90 days
  let recurrence = 0;
  if (Array.isArray(resolvedRecentComplaints)) {
    for (const r of resolvedRecentComplaints) {
      if (r.category_id === categoryId && r.latitude != null && r.longitude != null) {
        const d = distanceMeters(center.lat, center.lng, r.latitude, r.longitude);
        if (d <= radiusMeters) {
          recurrence++;
        }
      }
    }
  }

  // Factor scoring per specification
  const severityPoints = Math.min(25, (category.severity_weight || 1) * 5);
  const densityPoints = Math.min(30, signals * 6);
  const recurrencePoints = Math.min(20, recurrence * 7);
  const timePoints = Math.min(25, oldestOpenDays * 3);
  const totalScore = Math.min(100, severityPoints + densityPoints + recurrencePoints + timePoints);

  // Level thresholds: 0-29 low, 30-54 medium, 55-74 high, 75-100 critical
  let level = 'low';
  if (totalScore >= 75) {
    level = 'critical';
  } else if (totalScore >= 55) {
    level = 'high';
  } else if (totalScore >= 30) {
    level = 'medium';
  } else {
    level = 'low';
  }

  const factors = [
    {
      name: 'Severity',
      points: severityPoints,
      max: 25,
      explanation: `${category.name} ${category.name.toLowerCase().endsWith('s') ? 'carry' : 'carries'} a severity weight of ${category.severity_weight} out of 5.`
    },
    {
      name: 'Report density',
      points: densityPoints,
      max: 30,
      explanation: `${signals} citizen report${signals === 1 ? '' : 's'} within ${radiusMeters} m.`
    },
    {
      name: 'Recurrence',
      points: recurrencePoints,
      max: 20,
      explanation: recurrence === 0
        ? 'No similar issue was resolved here in the last 90 days.'
        : `${recurrence} similar issue${recurrence === 1 ? ' was' : 's were'} resolved here in the last 90 days.`
    },
    {
      name: 'Time unresolved',
      points: timePoints,
      max: 25,
      explanation: `Oldest open report is ${oldestOpenDays} day${oldestOpenDays === 1 ? '' : 's'} old.`
    }
  ];

  // Recommendations and inspect-first complaint
  const recommendation = getRecommendation(categoryId, level);
  const inspectFirst = getInspectFirstId(members);

  // Deterministic cluster ID
  const sortedIds = members.map(m => m.id).sort().join(',');
  const hash = crypto.createHash('md5').update(`${categoryId}-${sortedIds}`).digest('hex').slice(0, 10);
  const clusterId = `${categoryId}-${hash}`;

  return {
    id: clusterId,
    category_id: categoryId,
    categoryName: category.name,
    categoryIcon: category.icon,
    severity_weight: category.severity_weight,
    signals,
    complaintCount,
    center,
    radius,
    oldestOpenDays,
    recurrence,
    score: totalScore,
    level,
    factors,
    recommendation,
    inspectFirst,
    complaints: members
  };
}

/**
 * Computes all risk radar clusters from database.
 */
function computeRiskRadar(db, options = {}) {
  const radiusMeters = Number(options.radiusMeters || process.env.RISK_RADIUS_METERS || 150);
  const minSignals = Number(options.minSignals || process.env.RISK_MIN_SIGNALS || 3);

  // Load categories
  const categories = db.prepare('SELECT id, name, icon, severity_weight FROM categories').all();
  const categoriesMap = {};
  for (const cat of categories) {
    categoriesMap[cat.id] = cat;
  }

  // Query open, primary complaints with coordinates
  const openComplaints = db.prepare(`
    SELECT c.*, cat.name as category_name, cat.icon as category_icon, cat.severity_weight
    FROM complaints c
    JOIN categories cat ON c.category_id = cat.id
    WHERE c.status NOT IN ('resolved', 'rejected')
      AND c.duplicate_of IS NULL
      AND c.latitude IS NOT NULL
      AND c.longitude IS NOT NULL
  `).all();

  // Query resolved complaints in the last 90 days for recurrence
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const resolvedRecent = db.prepare(`
    SELECT id, category_id, latitude, longitude, created_at
    FROM complaints
    WHERE status = 'resolved'
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND created_at >= ?
  `).all(ninetyDaysAgo);

  const rawClusters = buildRawClusters(openComplaints, radiusMeters, minSignals);

  let evaluated = rawClusters.map(raw => evaluateCluster(raw, categoriesMap, resolvedRecent, radiusMeters));

  // Optional category filter
  if (options.category && options.category !== 'all') {
    evaluated = evaluated.filter(c => c.category_id === options.category);
  }

  // Optional minLevel filter: low (>=0), medium (>=30), high (>=55), critical (>=75)
  if (options.minLevel && options.minLevel !== 'all') {
    const levelRanks = { low: 0, medium: 1, high: 2, critical: 3 };
    const targetRank = levelRanks[options.minLevel] ?? 0;
    evaluated = evaluated.filter(c => (levelRanks[c.level] ?? 0) >= targetRank);
  }

  // Sort by score desc
  evaluated.sort((a, b) => b.score - a.score);

  return {
    generatedAt: new Date().toISOString(),
    radiusMeters,
    minSignals,
    clusters: evaluated
  };
}

module.exports = {
  buildRawClusters,
  evaluateCluster,
  computeRiskRadar
};
