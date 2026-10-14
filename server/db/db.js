// server/db/db.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { seed } = require('./seed');

const dbPath = path.join(__dirname, 'civic_sense.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Run Migration 002 if exists
const mig002 = path.join(__dirname, 'migrations/002_radar_alerts.sql');
if (fs.existsSync(mig002)) {
  db.exec(fs.readFileSync(mig002, 'utf8'));
}

// Run Migration 003 if exists
const mig003 = path.join(__dirname, 'migrations/003_proof_of_resolution.sql');
if (fs.existsSync(mig003)) {
  db.exec(fs.readFileSync(mig003, 'utf8'));
}

// Ensure complaints table has resolution and endorsement columns
try {
  const existingCols = db.prepare('PRAGMA table_info(complaints)').all().map((c) => c.name);
  if (!existingCols.includes('resolution_photo_path')) {
    db.exec('ALTER TABLE complaints ADD COLUMN resolution_photo_path TEXT');
  }
  if (!existingCols.includes('resolution_note')) {
    db.exec('ALTER TABLE complaints ADD COLUMN resolution_note TEXT');
  }
  if (!existingCols.includes('resolved_at')) {
    db.exec('ALTER TABLE complaints ADD COLUMN resolved_at DATETIME');
  }
  if (!existingCols.includes('confirm_count')) {
    db.exec('ALTER TABLE complaints ADD COLUMN confirm_count INTEGER NOT NULL DEFAULT 0');
  }
  if (!existingCols.includes('dispute_count')) {
    db.exec('ALTER TABLE complaints ADD COLUMN dispute_count INTEGER NOT NULL DEFAULT 0');
  }
  if (!existingCols.includes('dispute_reopened')) {
    db.exec('ALTER TABLE complaints ADD COLUMN dispute_reopened INTEGER NOT NULL DEFAULT 0');
  }
  if (!existingCols.includes('endorsement_count')) {
    db.exec('ALTER TABLE complaints ADD COLUMN endorsement_count INTEGER NOT NULL DEFAULT 0');
  }
} catch (migrErr) {
  console.warn('[DB Migration Column Check]', migrErr.message);
}

// Run seeds
seed(db);

module.exports = db;
