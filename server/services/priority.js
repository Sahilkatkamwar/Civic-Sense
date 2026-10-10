// server/services/priority.js

/**
 * Calculates priority score and level based on project formula:
 * score = (report_count * 10) + (severity_weight * 5) + (days_open * 2) + (suspicious ? -10 : 0)
 */
function calculatePriority({ report_count = 1, severity_weight = 1, created_at, authenticity = 'verified' }) {
  const now = new Date();
  const createdDate = created_at ? new Date(created_at) : now;
  const diffTime = Math.max(0, now - createdDate);
  const days_open = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const isSuspicious = authenticity === 'suspicious';
  const score = (report_count * 10) + (severity_weight * 5) + (days_open * 2) + (isSuspicious ? -10 : 0);

  let level = 'low';
  if (score >= 70) {
    level = 'critical';
  } else if (score >= 40) {
    level = 'high';
  } else if (score >= 20) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { score, level };
}

/**
 * Recalculate priority for all open complaints in the database
 */
function recalculateAllOpen(db) {
  const openComplaints = db.prepare(`
    SELECT c.id, c.report_count, c.created_at, c.authenticity, cat.severity_weight
    FROM complaints c
    JOIN categories cat ON c.category_id = cat.id
    WHERE c.status NOT IN ('resolved', 'rejected')
  `).all();

  const updateStmt = db.prepare(`
    UPDATE complaints
    SET priority_score = ?, priority_level = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  for (const c of openComplaints) {
    const { score, level } = calculatePriority({
      report_count: c.report_count,
      severity_weight: c.severity_weight,
      created_at: c.created_at,
      authenticity: c.authenticity
    });
    updateStmt.run(score, level, c.id);
  }
}

module.exports = {
  calculatePriority,
  recalculateAllOpen
};
