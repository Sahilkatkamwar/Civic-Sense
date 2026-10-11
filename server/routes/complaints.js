// server/routes/complaints.js
// Owner: Tanush (Module: Complaint Submission, Smart Checks & Tracking)
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/db');
const { computeHash, hammingDistance, distanceMeters } = require('../services/duplicate');
const { calculatePriority, recalculateAllOpen } = require('../services/priority');
const { isValidTransition, getAllowedTransitions, getAuthorityForCategory } = require('../services/routing');

// Setup multer storage for complaint photos
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'photo-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Generate next complaint ID: CS-2026-XXXXX
 */
function getNextComplaintId() {
  const row = db.prepare(`
    SELECT id FROM complaints
    WHERE id LIKE 'CS-2026-%'
    ORDER BY id DESC LIMIT 1
  `).get();

  let nextNum = 1;
  if (row && row.id) {
    const parts = row.id.split('-');
    const currentNum = parseInt(parts[2], 10);
    if (!isNaN(currentNum)) {
      nextNum = currentNum + 1;
    }
  }
  return `CS-2026-${String(nextNum).padStart(5, '0')}`;
}

// GET /api/complaints/stats - Live stats strip for home page
router.get('/stats', (req, res) => {
  try {
    const totalReports = db.prepare('SELECT COUNT(*) as count FROM complaints').get().count;
    const resolvedReports = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'resolved'").get().count;
    const inProgressReports = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'in_progress'").get().count;
    const underReviewReports = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'under_review'").get().count;
    const activeCitizens = db.prepare('SELECT COALESCE(SUM(report_count), 0) as count FROM complaints').get().count;

    res.json({
      total: totalReports,
      resolved: resolvedReports,
      in_progress: inProgressReports,
      under_review: underReviewReports,
      citizen_reports: activeCitizens
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/complaints - List complaints with filters
router.get('/', (req, res) => {
  try {
    const { status, category, sort } = req.query;

    let query = `
      SELECT c.*, cat.name AS category_name, cat.icon AS category_icon, cat.severity_weight,
             a.name AS authority_name, a.department AS authority_department
      FROM complaints c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN authorities a ON c.authority_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    if (category) {
      query += ` AND c.category_id = ?`;
      params.push(category);
    }

    if (sort === 'priority') {
      query += ` ORDER BY c.priority_score DESC, c.created_at DESC`;
    } else {
      query += ` ORDER BY c.created_at DESC`;
    }

    const complaints = db.prepare(query).all(...params);
    res.json(complaints);
  } catch (err) {
    console.error('Error listing complaints:', err);
    res.status(500).json({ error: 'Failed to list complaints' });
  }
});

// GET /api/authority/complaints - Authority queue sorted by priority
router.get('/authority/queue', (req, res) => {
  try {
    // Recalculate priority for all open complaints first (keeps days_open current)
    recalculateAllOpen(db);

    const { status, category, priority } = req.query;

    let query = `
      SELECT c.*, cat.name AS category_name, cat.icon AS category_icon, cat.severity_weight,
             a.name AS authority_name, a.department AS authority_department
      FROM complaints c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN authorities a ON c.authority_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    if (category && category !== 'all') {
      query += ` AND c.category_id = ?`;
      params.push(category);
    }
    if (priority && priority !== 'all') {
      query += ` AND c.priority_level = ?`;
      params.push(priority);
    }

    query += ` ORDER BY c.priority_score DESC, c.created_at DESC`;

    const complaints = db.prepare(query).all(...params);
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching authority complaints:', err);
    res.status(500).json({ error: 'Failed to fetch authority queue' });
  }
});

// GET /api/complaints/:id - Track one complaint
router.get('/:id', (req, res) => {
  try {
    const complaint = db.prepare(`
      SELECT c.*, cat.name AS category_name, cat.icon AS category_icon, cat.severity_weight,
             a.name AS authority_name, a.department AS authority_department
      FROM complaints c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN authorities a ON c.authority_id = a.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: `Complaint '${req.params.id}' not found` });
    }

    const history = db.prepare(`
      SELECT * FROM status_history
      WHERE complaint_id = ?
      ORDER BY created_at ASC
    `).all(req.params.id);

    // Get allowed next statuses for the current state
    const allowedTransitions = getAllowedTransitions(complaint.status);

    res.json({
      ...complaint,
      status_history: history,
      allowed_transitions: allowedTransitions
    });
  } catch (err) {
    console.error('Error tracking complaint:', err);
    res.status(500).json({ error: 'Failed to retrieve complaint details' });
  }
});

// POST /api/complaints - Submit complaint (multipart)
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { category_id, description, latitude, longitude, address_text } = req.body;

    if (!category_id) {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters long' });
    }
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Valid location coordinates are required' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    let photoPath = null;
    let photoHash = null;

    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
      photoHash = await computeHash(req.file.path);
    }

    // Check category exists
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(category_id);
    if (!category) {
      return res.status(400).json({ error: `Category '${category_id}' does not exist` });
    }

    const authorityId = getAuthorityForCategory(db, category_id);
    const authority = db.prepare('SELECT name FROM authorities WHERE id = ?').get(authorityId);

    // SMART CHECKS: Find existing complaints in same category that are not closed
    const activeComplaints = db.prepare(`
      SELECT * FROM complaints
      WHERE category_id = ? AND status NOT IN ('resolved', 'rejected')
    `).all(category_id);

    let isDuplicate = false;
    let matchedComplaint = null;
    let duplicateCase = null;
    let authenticity = 'verified';

    for (const item of activeComplaints) {
      const dist = distanceMeters(lat, lon, item.latitude, item.longitude);
      const hashDist = (photoHash && item.photo_hash) ? hammingDistance(photoHash, item.photo_hash) : 64;

      // Case 1: Same area (<= 50m) + similar photo (<= 10)
      if (dist <= 50 && hashDist <= 10) {
        isDuplicate = true;
        matchedComplaint = item;
        duplicateCase = 'duplicate_photo_and_area';
        break;
      }
      // Case 2: Same area (<= 50m), same category, different photo
      if (dist <= 50) {
        isDuplicate = true;
        matchedComplaint = item;
        duplicateCase = 'area_confirmation';
        break;
      }
      // Case 3: Similar photo (<= 10) but far away (> 500m)
      if (hashDist <= 10 && dist > 500) {
        authenticity = 'suspicious';
      }
    }

    if (isDuplicate && matchedComplaint) {
      // Merge with existing complaint: increment report_count and update priority
      const newCount = matchedComplaint.report_count + 1;
      const { score, level } = calculatePriority({
        report_count: newCount,
        severity_weight: category.severity_weight,
        created_at: matchedComplaint.created_at,
        authenticity: matchedComplaint.authenticity
      });

      db.prepare(`
        UPDATE complaints
        SET report_count = ?, priority_score = ?, priority_level = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newCount, score, level, matchedComplaint.id);

      // Record this as a duplicate submission in the new complaint row too
      const dupeId = getNextComplaintId();
      db.prepare(`
        INSERT INTO complaints (
          id, category_id, description, photo_path, photo_hash,
          latitude, longitude, address_text, status, report_count,
          duplicate_of, authenticity, priority_score, priority_level,
          authority_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 1, ?, ?, 0, 'low', ?)
      `).run(
        dupeId, category_id, description.trim(), photoPath, photoHash,
        lat, lon, address_text || null, matchedComplaint.id, authenticity, authorityId
      );

      db.prepare(`
        INSERT INTO status_history (complaint_id, status, note)
        VALUES (?, ?, ?)
      `).run(
        matchedComplaint.id,
        matchedComplaint.status,
        `Duplicate report added by another citizen (Total reports: ${newCount}). Priority raised to ${level}.`
      );

      return res.json({
        id: matchedComplaint.id,
        status: matchedComplaint.status,
        priority_score: score,
        priority_level: level,
        authority_name: authority ? authority.name : 'Municipal Authority',
        duplicate: true,
        duplicate_of: matchedComplaint.id,
        duplicate_case: duplicateCase,
        message: `This issue is already reported under ID ${matchedComplaint.id}. We have added your report to raise its priority.`
      });
    }

    // New complaint creation
    const newId = getNextComplaintId();
    const { score, level } = calculatePriority({
      report_count: 1,
      severity_weight: category.severity_weight,
      created_at: new Date(),
      authenticity
    });

    db.prepare(`
      INSERT INTO complaints (
        id, category_id, description, photo_path, photo_hash,
        latitude, longitude, address_text, status, report_count,
        duplicate_of, authenticity, priority_score, priority_level,
        authority_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 1, NULL, ?, ?, ?, ?)
    `).run(
      newId, category_id, description.trim(), photoPath, photoHash,
      lat, lon, address_text || null, authenticity, score, level,
      authorityId
    );

    // Initial status history entry
    db.prepare(`
      INSERT INTO status_history (complaint_id, status, note)
      VALUES (?, 'submitted', ?)
    `).run(newId, `Complaint submitted. Forwarded to ${authority ? authority.name : 'Municipal Authority'}.`);

    res.status(201).json({
      id: newId,
      status: 'submitted',
      priority_score: score,
      priority_level: level,
      authority_name: authority ? authority.name : 'Municipal Authority',
      duplicate: false,
      authenticity,
      message: 'Complaint submitted successfully!'
    });
  } catch (err) {
    console.error('Error submitting complaint:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// PATCH /api/complaints/:id/status - Authority updates status
router.patch('/:id/status', (req, res) => {
  try {
    const { status: newStatus, note } = req.body;
    if (!newStatus) {
      return res.status(400).json({ error: 'New status is required' });
    }

    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: `Complaint '${req.params.id}' not found` });
    }

    if (!isValidTransition(complaint.status, newStatus)) {
      const allowed = getAllowedTransitions(complaint.status);
      return res.status(400).json({
        error: `Invalid status transition from '${complaint.status}' to '${newStatus}'. Allowed next statuses: ${allowed.join(', ') || 'none'}`,
        allowed_transitions: allowed
      });
    }

    db.prepare(`
      UPDATE complaints
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, req.params.id);

    const historyNote = note || `Status updated from ${complaint.status} to ${newStatus}`;
    db.prepare(`
      INSERT INTO status_history (complaint_id, status, note)
      VALUES (?, ?, ?)
    `).run(req.params.id, newStatus, historyNote);

    res.json({
      id: req.params.id,
      status: newStatus,
      previous_status: complaint.status,
      allowed_transitions: getAllowedTransitions(newStatus),
      message: `Status updated to ${newStatus}`
    });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

// POST /api/complaints/:id/support - "I face this too" button (Bonus feature)
router.post('/:id/support', (req, res) => {
  try {
    const complaint = db.prepare(`
      SELECT c.*, cat.severity_weight
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: `Complaint '${req.params.id}' not found` });
    }

    if (complaint.status === 'resolved' || complaint.status === 'rejected') {
      return res.status(400).json({ error: 'Cannot support a resolved or rejected complaint' });
    }

    const newCount = complaint.report_count + 1;
    const { score, level } = calculatePriority({
      report_count: newCount,
      severity_weight: complaint.severity_weight,
      created_at: complaint.created_at,
      authenticity: complaint.authenticity
    });

    db.prepare(`
      UPDATE complaints
      SET report_count = ?, priority_score = ?, priority_level = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newCount, score, level, req.params.id);

    db.prepare(`
      INSERT INTO status_history (complaint_id, status, note)
      VALUES (?, ?, ?)
    `).run(
      req.params.id,
      complaint.status,
      `A citizen confirmed this issue (Total supporters: ${newCount}). Priority updated to ${level}.`
    );

    res.json({
      id: req.params.id,
      report_count: newCount,
      priority_score: score,
      priority_level: level,
      message: `Thank you! ${newCount} citizens have now reported this issue.`
    });
  } catch (err) {
    console.error('Error supporting complaint:', err);
    res.status(500).json({ error: 'Failed to add support to complaint' });
  }
});

module.exports = router;
