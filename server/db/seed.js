// server/db/seed.js
// Gagare fills final text and demo complaints. Sahil provides the initial structure and base rows.

function seed(db) {
  // 1. Seed Authorities
  const insertAuthority = db.prepare(`
    INSERT OR IGNORE INTO authorities (id, name, department)
    VALUES (?, ?, ?)
  `);

  const authorities = [
    { id: 'roads', name: 'Roads & Infrastructure', department: 'Road Maintenance Dept' },
    { id: 'sanitation', name: 'Solid Waste Management', department: 'Sanitation Dept' },
    { id: 'garden', name: 'Horticulture & Parks', department: 'Garden & Tree Authority' },
    { id: 'electrical', name: 'Electrical & Lighting', department: 'Power Supply & Streetlights' },
    { id: 'animal_control', name: 'Animal Welfare & Control', department: 'Public Health Dept' },
    { id: 'general', name: 'General Municipal Cell', department: 'Civic Administration' }
  ];

  for (const auth of authorities) {
    insertAuthority.run(auth.id, auth.name, auth.department);
  }

  // 2. Seed Base Categories
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, icon, description, guidance, severity_weight, authority_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const categories = [
    {
      id: 'pothole',
      name: 'Potholes',
      icon: '🕳️',
      description: 'Potholes, cracks, and road surface damage causing traffic disruption or accidents.',
      guidance: 'DO: Note exact street name or landmark. Take clear photos in daylight. DONT: Never stand in the middle of active traffic to take photos.',
      severity_weight: 4,
      authority_id: 'roads'
    },
    {
      id: 'garbage',
      name: 'Garbage Dump',
      icon: '🗑️',
      description: 'Uncollected waste, overflowing community bins, or illegal open dumping spots.',
      guidance: 'DO: Include nearby landmarks in photo. Mention if waste is blocking drains. DONT: Do not touch hazardous chemical or medical waste.',
      severity_weight: 3,
      authority_id: 'sanitation'
    },
    {
      id: 'tree',
      name: 'Overgrown Trees',
      icon: '🌳',
      description: 'Fallen trees, low hanging branches blocking roads, or trees threatening utility wires.',
      guidance: 'DO: Report branches touching power lines immediately. DONT: Do not attempt to prune or cut branches near wires yourself.',
      severity_weight: 3,
      authority_id: 'garden'
    },
    {
      id: 'cable',
      name: 'Hanging Cables',
      icon: '⚡',
      description: 'Loose, dangling, snapped or sparking wires, electrical cables, or broken utility poles.',
      guidance: 'DO: Maintain at least 10 meters distance. Warn pedestrians nearby. DONT: NEVER touch any dangling wire or puddle near it.',
      severity_weight: 5,
      authority_id: 'electrical'
    },
    {
      id: 'animal',
      name: 'Dead Animals',
      icon: '🐕',
      description: 'Carcasses of stray or wild animals requiring urgent and hygienic municipal removal.',
      guidance: 'DO: Provide precise location details for sanitary team. DONT: Do not handle or attempt to move the animal.',
      severity_weight: 4,
      authority_id: 'animal_control'
    },
    {
      id: 'other',
      name: 'Other Issues',
      icon: '📌',
      description: 'Broken footpaths, missing manhole covers, malfunctioning street lights, and other civic concerns.',
      guidance: 'DO: Clearly explain the exact issue and severity in the description.',
      severity_weight: 2,
      authority_id: 'general'
    }
  ];

  for (const cat of categories) {
    insertCategory.run(
      cat.id,
      cat.name,
      cat.icon,
      cat.description,
      cat.guidance,
      cat.severity_weight,
      cat.authority_id
    );
  }

  // 3. Seed some initial demo complaints if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM complaints').get().c;
  if (count === 0) {
    const insertComplaint = db.prepare(`
      INSERT INTO complaints (
        id, category_id, description, photo_path, photo_hash,
        latitude, longitude, address_text, status, report_count,
        duplicate_of, authenticity, priority_score, priority_level, authority_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertHistory = db.prepare(`
      INSERT INTO status_history (complaint_id, status, note, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const demoComplaints = [
      {
        id: 'CS-2026-00001',
        category_id: 'cable',
        description: 'Dangerous live cable snapped and dangling across pedestrian walkway near Metro Pillar 42.',
        photo_path: '/uploads/sample-cable.jpg',
        photo_hash: '1010101010101010',
        latitude: 19.0760,
        longitude: 72.8777,
        address_text: 'Near Metro Pillar 42, Western Express Highway',
        status: 'in_progress',
        report_count: 4,
        duplicate_of: null,
        authenticity: 'verified',
        priority_score: 75,
        priority_level: 'critical',
        authority_id: 'electrical',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'CS-2026-00002',
        category_id: 'pothole',
        description: 'Deep trench-like pothole causing vehicle damage right after railway crossing.',
        photo_path: '/uploads/sample-pothole.jpg',
        photo_hash: '1100110011001100',
        latitude: 19.0825,
        longitude: 72.8856,
        address_text: 'Station Road, East Gate crossing',
        status: 'under_review',
        report_count: 2,
        duplicate_of: null,
        authenticity: 'verified',
        priority_score: 45,
        priority_level: 'high',
        authority_id: 'roads',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'CS-2026-00003',
        category_id: 'garbage',
        description: 'Large municipal dumpster overflowing onto main road for 4 days.',
        photo_path: '/uploads/sample-garbage.jpg',
        photo_hash: '1111000011110000',
        latitude: 19.0712,
        longitude: 72.8690,
        address_text: 'Sector 5 Market Square',
        status: 'submitted',
        report_count: 1,
        duplicate_of: null,
        authenticity: 'verified',
        priority_score: 25,
        priority_level: 'medium',
        authority_id: 'sanitation',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'CS-2026-00004',
        category_id: 'tree',
        description: 'Heavy bough fell on footpath after storm, partially blocking lane.',
        photo_path: '/uploads/sample-tree.jpg',
        photo_hash: '1001100110011001',
        latitude: 19.0890,
        longitude: 72.8710,
        address_text: 'Park Avenue, Near Central Garden Gate 2',
        status: 'resolved',
        report_count: 1,
        duplicate_of: null,
        authenticity: 'verified',
        priority_score: 25,
        priority_level: 'medium',
        authority_id: 'garden',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const c of demoComplaints) {
      insertComplaint.run(
        c.id, c.category_id, c.description, c.photo_path, c.photo_hash,
        c.latitude, c.longitude, c.address_text, c.status, c.report_count,
        c.duplicate_of, c.authenticity, c.priority_score, c.priority_level, c.authority_id,
        c.created_at, c.updated_at
      );

      insertHistory.run(c.id, 'submitted', 'Complaint registered via Civic Sense', c.created_at);
      if (c.status !== 'submitted') {
        insertHistory.run(c.id, c.status, `Status changed to ${c.status} by authority`, c.updated_at);
      }
    }
  }
}

module.exports = { seed };
