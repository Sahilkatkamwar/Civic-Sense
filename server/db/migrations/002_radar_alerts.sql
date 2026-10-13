-- Wards (used for alert targeting)
CREATE TABLE IF NOT EXISTS wards (
  id TEXT PRIMARY KEY,            -- e.g. ward_01
  name TEXT NOT NULL,
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL
);

-- Municipal officials (role-based access)
CREATE TABLE IF NOT EXISTS officials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'official',   -- 'official' | 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Announcements
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,              -- water_cut | power_cut | road_closure | waste_schedule | maintenance | safety
  severity TEXT NOT NULL DEFAULT 'info',   -- info | warning | critical
  title_en TEXT NOT NULL,
  title_hi TEXT,
  title_mr TEXT,
  body_en TEXT NOT NULL,
  body_hi TEXT,
  body_mr TEXT,
  all_wards INTEGER NOT NULL DEFAULT 0,    -- 1 = city-wide
  status TEXT NOT NULL DEFAULT 'scheduled',-- draft | scheduled | active | cancelled | resolved | expired
  starts_at DATETIME NOT NULL,             -- when it becomes visible
  ends_at DATETIME,                        -- when it expires (optional)
  created_by INTEGER REFERENCES officials(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Which wards an alert targets
CREATE TABLE IF NOT EXISTS alert_wards (
  alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  ward_id TEXT NOT NULL REFERENCES wards(id),
  PRIMARY KEY (alert_id, ward_id)
);

-- Change log shown to citizens ("Extended until ...", "Cancelled")
CREATE TABLE IF NOT EXISTS alert_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Anonymous read tracking (no citizen accounts exist)
CREATE TABLE IF NOT EXISTS alert_reads (
  alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,                 -- random UUID stored in the browser
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (alert_id, client_id)
);
