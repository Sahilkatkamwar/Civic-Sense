// server/routes/alerts.js
const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { requireOfficial } = require('../middleware/auth');
const { translateAlertText } = require('../services/grok');

const VALID_TYPES = ['water_cut', 'power_cut', 'road_closure', 'waste_schedule', 'maintenance', 'safety'];
const VALID_SEVERITIES = ['info', 'warning', 'critical'];

/**
 * Helper to fetch updates and targeted wards for an alert.
 */
function attachAlertDetails(alert) {
  if (!alert) return null;
  const updates = db.prepare('SELECT id, note, created_at FROM alert_updates WHERE alert_id = ? ORDER BY created_at ASC').all(alert.id);
  const wards = db.prepare(`
    SELECT w.id, w.name
    FROM alert_wards aw
    JOIN wards w ON aw.ward_id = w.id
    WHERE aw.alert_id = ?
  `).all(alert.id);

  const readsCount = db.prepare('SELECT COUNT(DISTINCT client_id) as count FROM alert_reads WHERE alert_id = ?').get(alert.id).count;

  return {
    ...alert,
    updates,
    wards,
    readsCount
  };
}

// ==========================================
// 1. SPECIFIC / ROOT ROUTES FIRST
// ==========================================

/**
 * GET /api/alerts
 * Public citizen feed.
 * Active alerts for ward + citywide, plus recently resolved/cancelled within 24 hours.
 */
router.get('/', (req, res) => {
  try {
    const { ward } = req.query;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();

    let query = '';
    let params = [];

    if (ward) {
      query = `
        SELECT DISTINCT a.*
        FROM alerts a
        LEFT JOIN alert_wards aw ON a.id = aw.alert_id
        WHERE (a.all_wards = 1 OR aw.ward_id = ?)
          AND (
            a.status = 'active'
            OR (a.status IN ('resolved', 'cancelled') AND a.updated_at >= ?)
          )
        ORDER BY a.starts_at DESC
      `;
      params = [ward, twentyFourHoursAgo];
    } else {
      query = `
        SELECT DISTINCT a.*
        FROM alerts a
        WHERE a.all_wards = 1
          AND (
            a.status = 'active'
            OR (a.status IN ('resolved', 'cancelled') AND a.updated_at >= ?)
          )
        ORDER BY a.starts_at DESC
      `;
      params = [twentyFourHoursAgo];
    }

    const alerts = db.prepare(query).all(...params);
    const enriched = alerts.map((a) => attachAlertDetails(a));
    res.json(enriched);
  } catch (err) {
    console.error('Error fetching citizen alerts:', err);
    res.status(500).json({ error: 'Failed to retrieve alerts' });
  }
});

/**
 * GET /api/alerts/manage/all
 * Official management overview (Placed BEFORE /:id)
 */
router.get('/manage/all', requireOfficial, (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT a.*, o.name as creator_name
      FROM alerts a
      LEFT JOIN officials o ON a.created_by = o.id
      ORDER BY a.created_at DESC
    `).all();

    const enriched = alerts.map((a) => {
      const details = attachAlertDetails(a);
      return {
        ...details,
        stats: {
          reads: details.readsCount,
          wardsTargeted: a.all_wards ? 'City-wide' : details.wards.length
        }
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Error listing alerts for management:', err);
    res.status(500).json({ error: 'Failed to retrieve official alerts' });
  }
});

/**
 * POST /api/alerts/translate
 * Helper to draft Hindi and Marathi titles and bodies (Placed BEFORE /:id)
 */
router.post('/translate', requireOfficial, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required for translation' });
    }

    const translations = await translateAlertText({ title, body });
    if (!translations) {
      return res.status(503).json({
        error: 'Translation unavailable (GROK_API_KEY missing or not configured)',
        fallback: false
      });
    }

    res.json({ success: true, translations });
  } catch (err) {
    console.error('Error translating alert:', err);
    res.status(500).json({ error: 'Translation service encountered an error' });
  }
});

/**
 * POST /api/alerts
 * Official: create new alert
 */
router.post('/', requireOfficial, (req, res) => {
  try {
    const {
      type,
      severity = 'info',
      title_en,
      title_hi,
      title_mr,
      body_en,
      body_hi,
      body_mr,
      allWards = false,
      wardIds = [],
      startsAt,
      endsAt,
      publishNow = false
    } = req.body;

    // Validation
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid alert type. Allowed: ${VALID_TYPES.join(', ')}` });
    }
    if (!VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ error: `Invalid severity. Allowed: ${VALID_SEVERITIES.join(', ')}` });
    }
    if (!title_en || !title_en.trim()) {
      return res.status(400).json({ error: 'English title is required' });
    }
    if (!body_en || !body_en.trim()) {
      return res.status(400).json({ error: 'English body text is required' });
    }
    const isAllWards = allWards === true || allWards === 1 || allWards === '1';
    if (!isAllWards && (!Array.isArray(wardIds) || wardIds.length === 0)) {
      return res.status(400).json({ error: 'At least one target ward or whole city must be selected' });
    }

    const now = new Date();
    const startTime = publishNow ? now.toISOString() : (startsAt || now.toISOString());
    const endTime = endsAt ? new Date(endsAt).toISOString() : null;

    if (endTime && new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const status = publishNow ? 'active' : (new Date(startTime) <= now ? 'active' : 'scheduled');

    const result = db.prepare(`
      INSERT INTO alerts (
        type, severity, title_en, title_hi, title_mr,
        body_en, body_hi, body_mr, all_wards, status,
        starts_at, ends_at, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      type,
      severity,
      title_en.trim(),
      title_hi ? title_hi.trim() : null,
      title_mr ? title_mr.trim() : null,
      body_en.trim(),
      body_hi ? body_hi.trim() : null,
      body_mr ? body_mr.trim() : null,
      isAllWards ? 1 : 0,
      status,
      startTime,
      endTime,
      req.official.id,
      now.toISOString(),
      now.toISOString()
    );

    const alertId = result.lastInsertRowid;

    if (!isAllWards && Array.isArray(wardIds)) {
      const insertWard = db.prepare('INSERT OR IGNORE INTO alert_wards (alert_id, ward_id) VALUES (?, ?)');
      for (const wid of wardIds) {
        insertWard.run(alertId, wid);
      }
    }

    const created = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
    res.status(201).json(attachAlertDetails(created));
  } catch (err) {
    console.error('Error creating alert:', err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// ==========================================
// 2. PARAMETERIZED ROUTES (:id)
// ==========================================

/**
 * GET /api/alerts/:id
 * Public: view single alert details
 */
router.get('/:id', (req, res, next) => {
  const alertId = parseInt(req.params.id, 10);
  if (isNaN(alertId)) return next();

  try {
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(attachAlertDetails(alert));
  } catch (err) {
    console.error('Error fetching alert:', err);
    res.status(500).json({ error: 'Failed to retrieve alert' });
  }
});

/**
 * POST /api/alerts/:id/read
 * Public: record anonymous citizen view
 */
router.post('/:id/read', (req, res, next) => {
  const alertId = parseInt(req.params.id, 10);
  if (isNaN(alertId)) return next();

  try {
    const { clientId } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' });
    }

    db.prepare(`
      INSERT OR IGNORE INTO alert_reads (alert_id, client_id)
      VALUES (?, ?)
    `).run(alertId, clientId);

    res.json({ success: true });
  } catch (err) {
    console.error('Error recording alert read:', err);
    res.status(500).json({ error: 'Failed to record read status' });
  }
});

/**
 * PUT /api/alerts/:id
 * Official: update alert
 */
router.put('/:id', requireOfficial, (req, res, next) => {
  const alertId = parseInt(req.params.id, 10);
  if (isNaN(alertId)) return next();

  try {
    const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
    if (!existing) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const {
      type = existing.type,
      severity = existing.severity,
      title_en = existing.title_en,
      title_hi = existing.title_hi,
      title_mr = existing.title_mr,
      body_en = existing.body_en,
      body_hi = existing.body_hi,
      body_mr = existing.body_mr,
      allWards = existing.all_wards,
      wardIds,
      startsAt = existing.starts_at,
      endsAt = existing.ends_at
    } = req.body;

    const isAllWards = allWards === true || allWards === 1 || allWards === '1';

    db.prepare(`
      UPDATE alerts
      SET type = ?, severity = ?, title_en = ?, title_hi = ?, title_mr = ?,
          body_en = ?, body_hi = ?, body_mr = ?, all_wards = ?,
          starts_at = ?, ends_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      type,
      severity,
      title_en,
      title_hi,
      title_mr,
      body_en,
      body_hi,
      body_mr,
      isAllWards ? 1 : 0,
      startsAt,
      endsAt,
      alertId
    );

    if (Array.isArray(wardIds)) {
      db.prepare('DELETE FROM alert_wards WHERE alert_id = ?').run(alertId);
      if (!isAllWards) {
        const insertWard = db.prepare('INSERT OR IGNORE INTO alert_wards (alert_id, ward_id) VALUES (?, ?)');
        for (const wid of wardIds) {
          insertWard.run(alertId, wid);
        }
      }
    }

    db.prepare(`
      INSERT INTO alert_updates (alert_id, note)
      VALUES (?, ?)
    `).run(alertId, 'Details updated');

    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
    res.json(attachAlertDetails(updated));
  } catch (err) {
    console.error('Error updating alert:', err);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

/**
 * POST /api/alerts/:id/extend
 */
router.post('/:id/extend', requireOfficial, (req, res, next) => {
  const alertId = parseInt(req.params.id, 10);
  if (isNaN(alertId)) return next();

  try {
    const { endsAt, note } = req.body;
    if (!endsAt) {
      return res.status(400).json({ error: 'endsAt timestamp is required' });
    }

    db.prepare(`
      UPDATE alerts
      SET ends_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(new Date(endsAt).toISOString(), alertId);

    const updateNote = note ? `Extended until ${new Date(endsAt).toLocaleString()}: ${note}` : `Extended until ${new Date(endsAt).toLocaleString()}`;
    db.prepare(`
      INSERT INTO alert_updates (alert_id, note)
      VALUES (?, ?)
    `).run(alertId, updateNote);

    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
    res.json(attachAlertDetails(updated));
  } catch (err) {
    console.error('Error extending alert:', err);
    res.status(500).json({ error: 'Failed to extend alert duration' });
  }
});

/**
 * POST /api/alerts/:id/cancel
 */
router.post('/:id/cancel', requireOfficial, (req, res, next) => {
  const alertId = parseInt(req.params.id, 10);
  if (isNaN(alertId)) return next();

  try {
    const { reason = 'Cancelled by municipal authority' } = req.body;

    db.prepare(`
      UPDATE alerts
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(alertId);

    db.prepare(`
      INSERT INTO alert_updates (alert_id, note)
      VALUES (?, ?)
    `).run(alertId, `Cancelled: ${reason}`);

    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
    res.json(attachAlertDetails(updated));
  } catch (err) {
    console.error('Error cancelling alert:', err);
    res.status(500).json({ error: 'Failed to cancel alert' });
  }
});

/**
 * POST /api/alerts/:id/resolve
 */
router.post('/:id/resolve', requireOfficial, (req, res, next) => {
  const alertId = parseInt(req.params.id, 10);
  if (isNaN(alertId)) return next();

  try {
    db.prepare(`
      UPDATE alerts
      SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(alertId);

    db.prepare(`
      INSERT INTO alert_updates (alert_id, note)
      VALUES (?, ?)
    `).run(alertId, 'Resolved');

    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
    res.json(attachAlertDetails(updated));
  } catch (err) {
    console.error('Error resolving alert:', err);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

/**
 * GET /api/alerts/:id/stats
 */
router.get('/:id/stats', requireOfficial, (req, res, next) => {
  const alertId = parseInt(req.params.id, 10);
  if (isNaN(alertId)) return next();

  try {
    const alert = db.prepare('SELECT all_wards FROM alerts WHERE id = ?').get(alertId);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const reads = db.prepare('SELECT COUNT(DISTINCT client_id) as count FROM alert_reads WHERE alert_id = ?').get(alertId).count;
    const wardsTargeted = alert.all_wards ? 'City-wide' : db.prepare('SELECT COUNT(*) as count FROM alert_wards WHERE alert_id = ?').get(alertId).count;

    res.json({ reads, wardsTargeted });
  } catch (err) {
    console.error('Error fetching alert stats:', err);
    res.status(500).json({ error: 'Failed to fetch alert stats' });
  }
});

module.exports = router;
