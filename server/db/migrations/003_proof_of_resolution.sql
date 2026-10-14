-- Migration 003: Proof of Resolution, Citizen Verification & Community Endorsements

CREATE TABLE IF NOT EXISTS complaint_verifications (
  complaint_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'confirm' | 'dispute'
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (complaint_id, client_id),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS complaint_endorsements (
  complaint_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (complaint_id, client_id),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);
