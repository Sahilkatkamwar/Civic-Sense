// server/services/riskRecommendations.js

const RECOMMENDATIONS = {
  pothole: {
    critical: 'Schedule emergency site inspection within 24 hours. Barricade crater section and deploy quick-setting asphalt cold-mix.',
    high: 'Schedule a site inspection within 48 hours and assess whether the stretch needs resurfacing rather than patching.',
    medium: 'Issue repair work order to road maintenance division for standard patching within 5 business days.',
    low: 'Queue for routine road surface maintenance and monitor during weekly ward patrol.'
  },
  cable: {
    critical: 'Dispatch the electrical emergency team immediately. Treat as life-safety hazard and isolate live junction.',
    high: 'Dispatch the electrical team for a safety inspection within 24 hours. Treat as urgent.',
    medium: 'Deploy junior lineman to elevate and bundle sagging cables along pedestrian corridor.',
    low: 'Inspect utility pole tensioning and overhead lines during routine electrical grid check.'
  },
  garbage: {
    critical: 'Dispatch heavy compactor van and sanitation squad within 12 hours. Sanitize ground with disinfectant powder.',
    high: 'Review the collection schedule and add a pickup point or extra round for this area.',
    medium: 'Notify ward sanitation supervisor to clear overflow and enforce bin clearance frequency.',
    low: 'Monitor secondary waste accumulation and review citizen disposal patterns.'
  },
  tree: {
    critical: 'Deploy hydraulic tree-trimming squad and crane immediately. Prune fractured heavy boughs threatening road/lines.',
    high: 'Dispatch horticulture team within 48 hours to assess root stability and trim hazardous overhead branches.',
    medium: 'Schedule pruning crew for overgrown foliage obstructing street lighting or traffic signage.',
    low: 'Include in seasonal garden and arboriculture maintenance itinerary.'
  },
  animal: {
    critical: 'Urgent sanitary dispatch: deploy veterinary sanitation vehicle within 4 hours for hygienic carcass removal.',
    high: 'Dispatch animal welfare and hygienic sanitation vehicle within 12 hours. Disinfect public pathway.',
    medium: 'Assign animal control team for carcass clearance and public health sanitization.',
    low: 'Follow standard carcass disposal procedure during day shift.'
  },
  other: {
    critical: 'Dispatch civic emergency response unit immediately to inspect and barricade municipal hazard.',
    high: 'Schedule engineering division site visit within 48 hours to evaluate infrastructure defect.',
    medium: 'Issue maintenance ticket to relevant sub-division for remedial action within 7 days.',
    low: 'Log for routine municipal infrastructure audit.'
  }
};

/**
 * Returns recommendation string for a given category and risk level.
 */
function getRecommendation(categoryId, level) {
  const catRecs = RECOMMENDATIONS[categoryId] || RECOMMENDATIONS.other;
  return catRecs[level] || catRecs.medium || catRecs.high;
}

/**
 * Determines which complaint to inspect first.
 * Rule: complaint id with highest report_count, ties broken by oldest (created_at).
 */
function getInspectFirstId(complaints) {
  if (!complaints || complaints.length === 0) return null;
  const sorted = [...complaints].sort((a, b) => {
    if (b.report_count !== a.report_count) {
      return b.report_count - a.report_count;
    }
    return new Date(a.created_at) - new Date(b.created_at);
  });
  return sorted[0].id;
}

module.exports = {
  getRecommendation,
  getInspectFirstId
};
