// server/routes/wards.js
const express = require('express');
const router = express.Router();
const db = require('../db/db');

/**
 * GET /api/wards
 * Returns list of all municipal wards
 */
router.get('/', (req, res) => {
  try {
    const wards = db.prepare('SELECT id, name, center_lat, center_lng FROM wards ORDER BY id ASC').all();
    res.json(wards);
  } catch (err) {
    console.error('Error fetching wards:', err);
    res.status(500).json({ error: 'Failed to retrieve wards' });
  }
});

module.exports = router;
