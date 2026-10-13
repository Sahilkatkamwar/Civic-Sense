// server/routes/riskRadar.js
// Civic Risk Radar Endpoints
// Note: Like the existing authority dashboard, these read endpoints are not login-protected.
// Role-based protection is planned for future scope.

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { computeRiskRadar } = require('../services/riskRadar');

/**
 * GET /api/risk-radar
 * Query parameters:
 *   - category: optional category_id filter
 *   - minLevel: optional minimum level filter ('low', 'medium', 'high', 'critical')
 */
router.get('/', (req, res) => {
  try {
    const { category, minLevel } = req.query;
    const radarData = computeRiskRadar(db, { category, minLevel });
    res.json(radarData);
  } catch (err) {
    console.error('Error computing risk radar:', err);
    res.status(500).json({ error: 'Failed to compute civic risk radar' });
  }
});

/**
 * GET /api/risk-radar/:clusterId
 * Returns a specific cluster by its deterministic ID with member complaints.
 */
router.get('/:clusterId', (req, res) => {
  try {
    const { clusterId } = req.params;
    const radarData = computeRiskRadar(db);
    const cluster = radarData.clusters.find((c) => c.id === clusterId);

    if (!cluster) {
      return res.status(404).json({ error: 'Risk cluster not found' });
    }

    res.json(cluster);
  } catch (err) {
    console.error('Error fetching risk cluster:', err);
    res.status(500).json({ error: 'Failed to retrieve cluster details' });
  }
});

module.exports = router;
