-- Civic Sense Database Schema
-- Shared Data Model (Frozen)

CREATE TABLE IF NOT EXISTS authorities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  guidance TEXT,
  severity_weight INTEGER NOT NULL DEFAULT 1,
  authority_id TEXT,
  FOREIGN KEY (authority_id) REFERENCES authorities(id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  description TEXT,
  photo_path TEXT,
  photo_hash TEXT,
  latitude REAL,
  longitude REAL,
  address_text TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  report_count INTEGER NOT NULL DEFAULT 1,
  duplicate_of TEXT,
  authenticity TEXT NOT NULL DEFAULT 'verified',
  priority_score INTEGER NOT NULL DEFAULT 0,
  priority_level TEXT NOT NULL DEFAULT 'low',
  authority_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (authority_id) REFERENCES authorities(id),
  FOREIGN KEY (duplicate_of) REFERENCES complaints(id)
);

CREATE TABLE IF NOT EXISTS status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id)
);
