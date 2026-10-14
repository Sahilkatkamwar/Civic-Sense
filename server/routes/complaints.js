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
    let ext = path.extname(file.originalname);
    if (!ext) {
      if (file.mimetype === 'video/mp4') ext = '.mp4';
      else if (file.mimetype === 'video/webm') ext = '.webm';
      else if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else if (file.mimetype.startsWith('video/')) ext = '.webm';
      else ext = '.jpg';
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const prefix = (file.mimetype && file.mimetype.startsWith('video/')) ? 'video-' : 'photo-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB limit to support photo & video clips
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

    let userVerification = null;
    let userEndorsed = false;
    if (req.query.clientId) {
      const v = db.prepare('SELECT action FROM complaint_verifications WHERE complaint_id = ? AND client_id = ?').get(req.params.id, req.query.clientId);
      if (v) userVerification = v.action;
      const e = db.prepare('SELECT 1 FROM complaint_endorsements WHERE complaint_id = ? AND client_id = ?').get(req.params.id, req.query.clientId);
      if (e) userEndorsed = true;
    }

    res.json({
      ...complaint,
      status_history: history,
      allowed_transitions: allowedTransitions,
      user_verification: userVerification,
      user_endorsed: userEndorsed
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
      const isImage = !req.file.mimetype || req.file.mimetype.startsWith('image/');
      if (isImage) {
        photoHash = await computeHash(req.file.path);
      } else {
        photoHash = null;
      }
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

// PATCH /api/complaints/:id/status - Authority updates status (supports resolution proof photo)
router.patch('/:id/status', upload.single('resolution_photo'), (req, res) => {
  try {
    const { status: newStatus, note, resolution_photo_path } = req.body;
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

    // MANDATORY PROOF OF RESOLUTION: If transitioning to 'resolved', an After Photo is required
    let finalResolutionPhoto = complaint.resolution_photo_path || null;
    if (req.file) {
      finalResolutionPhoto = `/uploads/${req.file.filename}`;
    } else if (resolution_photo_path) {
      finalResolutionPhoto = resolution_photo_path;
    }

    if (newStatus === 'resolved' && !finalResolutionPhoto) {
      return res.status(400).json({
        error: 'Proof of Resolution photo is required before marking a ticket as Resolved. Please upload photographic evidence of the completed repair.'
      });
    }

    const resolutionNote = note || (newStatus === 'resolved' ? 'Official field repair completed and verified by municipal unit.' : null);

    if (newStatus === 'resolved') {
      db.prepare(`
        UPDATE complaints
        SET status = ?, resolution_photo_path = ?, resolution_note = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, finalResolutionPhoto, resolutionNote, req.params.id);
    } else {
      db.prepare(`
        UPDATE complaints
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, req.params.id);
    }

    const historyNote = newStatus === 'resolved'
      ? `✅ RESOLVED: Proof of resolution uploaded. ${resolutionNote}. Citizen verification window is now open.`
      : (note || `Status updated from ${complaint.status} to ${newStatus}`);

    db.prepare(`
      INSERT INTO status_history (complaint_id, status, note)
      VALUES (?, ?, ?)
    `).run(req.params.id, newStatus, historyNote);

    res.json({
      id: req.params.id,
      status: newStatus,
      previous_status: complaint.status,
      resolution_photo_path: finalResolutionPhoto,
      resolution_note: resolutionNote,
      allowed_transitions: getAllowedTransitions(newStatus),
      message: newStatus === 'resolved'
        ? 'Ticket marked Resolved with verified Proof of Resolution photo.'
        : `Status updated to ${newStatus}`
    });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update complaint status: ' + err.message });
  }
});

// POST /api/complaints/:id/verify - Citizen Verification ("Confirm Fixed" or "Dispute / Still Broken")
router.post('/:id/verify', (req, res) => {
  try {
    const { action, note, clientId } = req.body;
    if (!action || !['confirm', 'dispute'].includes(action)) {
      return res.status(400).json({ error: "Action must be either 'confirm' or 'dispute'" });
    }

    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: `Complaint '${req.params.id}' not found` });
    }

    // Check if client has already verified this ticket
    if (clientId) {
      const existing = db.prepare(`
        SELECT action FROM complaint_verifications
        WHERE complaint_id = ? AND client_id = ?
      `).get(req.params.id, clientId);

      if (existing) {
        return res.status(400).json({
          error: `You have already recorded your verification (${existing.action === 'confirm' ? 'Confirmed Fixed' : 'Disputed'}) for this complaint.`
        });
      }
    }

    if (action === 'confirm') {
      const newConfirmCount = (complaint.confirm_count || 0) + 1;
      db.prepare(`
        UPDATE complaints
        SET confirm_count = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newConfirmCount, req.params.id);

      if (clientId) {
        db.prepare(`
          INSERT OR REPLACE INTO complaint_verifications (complaint_id, client_id, action, note)
          VALUES (?, ?, 'confirm', ?)
        `).run(req.params.id, clientId, note || 'Citizen confirmed fixed');
      }

      db.prepare(`
        INSERT INTO status_history (complaint_id, status, note)
        VALUES (?, ?, ?)
      `).run(
        req.params.id,
        complaint.status,
        `✅ Citizen Audit: Local resident verified and confirmed repair work (Total confirmations: ${newConfirmCount}).`
      );

      return res.json({
        success: true,
        action: 'confirm',
        confirm_count: newConfirmCount,
        dispute_count: complaint.dispute_count || 0,
        message: 'Thank you! Your confirmation has been officially recorded in the civic audit trail.'
      });
    }

    if (action === 'dispute') {
      const newDisputeCount = (complaint.dispute_count || 0) + 1;

      if (clientId) {
        db.prepare(`
          INSERT OR REPLACE INTO complaint_verifications (complaint_id, client_id, action, note)
          VALUES (?, ?, 'dispute', ?)
        `).run(req.params.id, clientId, note || 'Citizen disputed resolution');
      }

      // THE 3-DISPUTE AUTO-REOPEN TRIGGER:
      // If 3 citizens dispute the resolution, automatically re-open the ticket with higher priority!
      if (newDisputeCount >= 3 && complaint.status === 'resolved') {
        const boostedScore = Math.min(100, (complaint.priority_score || 40) + 25);
        let boostedLevel = 'critical';
        if (boostedScore < 40) boostedLevel = 'medium';
        else if (boostedScore < 70) boostedLevel = 'high';

        db.prepare(`
          UPDATE complaints
          SET status = 'under_review',
              dispute_count = ?,
              dispute_reopened = 1,
              priority_score = ?,
              priority_level = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newDisputeCount, boostedScore, boostedLevel, req.params.id);

        db.prepare(`
          INSERT INTO status_history (complaint_id, status, note)
          VALUES (?, 'under_review', ?)
        `).run(
          req.params.id,
          `⚠️ AUTO-REOPENED BY CITIZEN CONSENSUS: 3 residents reported this issue is STILL BROKEN despite resolution. Ticket automatically reopened and escalated to ${boostedLevel.toUpperCase()} priority (Score: ${boostedScore}).`
        );

        return res.json({
          success: true,
          action: 'dispute',
          reopened: true,
          new_status: 'under_review',
          confirm_count: complaint.confirm_count || 0,
          dispute_count: newDisputeCount,
          priority_score: boostedScore,
          priority_level: boostedLevel,
          message: `⚠️ 3 citizens disputed resolution! The complaint has been automatically reopened and escalated to ${boostedLevel.toUpperCase()} priority for emergency reinspection.`
        });
      } else {
        db.prepare(`
          UPDATE complaints
          SET dispute_count = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newDisputeCount, req.params.id);

        db.prepare(`
          INSERT INTO status_history (complaint_id, status, note)
          VALUES (?, ?, ?)
        `).run(
          req.params.id,
          complaint.status,
          `⚠️ Citizen Dispute: A resident reported this issue is still broken (${newDisputeCount}/3 disputes to auto-reopen).`
        );

        return res.json({
          success: true,
          action: 'dispute',
          reopened: false,
          confirm_count: complaint.confirm_count || 0,
          dispute_count: newDisputeCount,
          message: `Dispute logged (${newDisputeCount}/3 disputes required to automatically reopen this ticket).`
        });
      }
    }
  } catch (err) {
    console.error('Error verifying complaint:', err);
    res.status(500).json({ error: 'Failed to record verification: ' + err.message });
  }
});

// POST /api/complaints/:id/support - "Impacts Me Too (+1)" / Community Endorsement
router.post(['/:id/support', '/:id/endorse'], (req, res) => {
  try {
    const { clientId } = req.body || {};

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
      return res.status(400).json({ error: 'Cannot endorse an already resolved or rejected complaint' });
    }

    // Check if client already endorsed
    if (clientId) {
      const already = db.prepare(`
        SELECT 1 FROM complaint_endorsements
        WHERE complaint_id = ? AND client_id = ?
      `).get(req.params.id, clientId);

      if (already) {
        return res.json({
          already_endorsed: true,
          report_count: complaint.report_count,
          endorsement_count: complaint.endorsement_count || 0,
          priority_score: complaint.priority_score,
          priority_level: complaint.priority_level,
          message: 'You have already endorsed this issue (+1).'
        });
      }

      db.prepare(`
        INSERT OR IGNORE INTO complaint_endorsements (complaint_id, client_id)
        VALUES (?, ?)
      `).run(req.params.id, clientId);
    }

    const newEndorsementCount = (complaint.endorsement_count || 0) + 1;
    const newReportCount = (complaint.report_count || 1) + 1;

    const { score, level } = calculatePriority({
      report_count: newReportCount,
      severity_weight: complaint.severity_weight,
      created_at: complaint.created_at,
      authenticity: complaint.authenticity
    });

    db.prepare(`
      UPDATE complaints
      SET report_count = ?, endorsement_count = ?, priority_score = ?, priority_level = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newReportCount, newEndorsementCount, score, level, req.params.id);

    db.prepare(`
      INSERT INTO status_history (complaint_id, status, note)
      VALUES (?, ?, ?)
    `).run(
      req.params.id,
      complaint.status,
      `⚡ Community Endorsement: A local resident endorsed "Impacts Me Too" (Total affected: ${newReportCount}). Priority score updated to ${score} (${level}).`
    );

    res.json({
      id: req.params.id,
      report_count: newReportCount,
      endorsement_count: newEndorsementCount,
      priority_score: score,
      priority_level: level,
      already_endorsed: false,
      message: `Thank you! ${newReportCount} local residents are now confirmed affected by this hazard.`
    });
  } catch (err) {
    console.error('Error endorsing complaint:', err);
    res.status(500).json({ error: 'Failed to record endorsement: ' + err.message });
  }
});

module.exports = router;

