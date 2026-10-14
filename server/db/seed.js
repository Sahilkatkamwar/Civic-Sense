// server/db/seed.js
// Owner: Gagare (Fill categories, authorities, and 10 realistic demo complaints)

function seed(db) {
  // 1. Seed Authorities
  const insertAuthority = db.prepare(`
    INSERT INTO authorities (id, name, department)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      department = excluded.department
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

  // 2. Seed Base Categories (with guidance DO and DONT for UI parsing)
  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, icon, description, guidance, severity_weight, authority_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      icon = excluded.icon,
      description = excluded.description,
      guidance = excluded.guidance,
      severity_weight = excluded.severity_weight,
      authority_id = excluded.authority_id
  `);

  const categories = [
    {
      id: 'pothole',
      name: 'Potholes',
      icon: '🕳️',
      description: 'Road surface depressions, craters, and asphalt erosion that endanger commuters and damage vehicles.',
      guidance: 'DO: Take photos during daylight from a safe roadside vantage point. Note exact nearby landmarks or mile markers for repair crews. Stay completely off active traffic lanes. DONT: Never walk into active vehicular traffic to photograph damage. Don\'t attempt to measure or touch hazardous crater edges.',
      severity_weight: 4,
      authority_id: 'roads'
    },
    {
      id: 'garbage',
      name: 'Garbage Dump',
      icon: '🗑️',
      description: 'Overflowing community bins, illegal roadside dumping, and uncollected domestic or commercial waste.',
      guidance: 'DO: Include clear surrounding landmarks to help the sanitation van locate the dump. Mention if waste is obstructing drainage channels. Take photos from an upwind and hygienic distance. DONT: Never touch or rummage through hazardous waste. Don\'t attempt to burn garbage piles.',
      severity_weight: 3,
      authority_id: 'sanitation'
    },
    {
      id: 'tree',
      name: 'Overgrown Trees',
      icon: '🌳',
      description: 'Fallen tree trunks, dangerous broken boughs, and heavy branches obstructing roads or endangering utility lines.',
      guidance: 'DO: Alert nearby pedestrians if a branch is visibly cracking. Report immediately if branches contact electrical lines. Capture wide-angle photos showing tree proximity. DONT: Never climb or prune trees near utility lines yourself. Don\'t park or stand beneath fractured limbs.',
      severity_weight: 3,
      authority_id: 'garden'
    },
    {
      id: 'cable',
      name: 'Hanging Cables',
      icon: '⚡',
      description: 'Dangling, snapped, sparking, or low-hanging electric wires and damaged utility poles posing electrocution hazards.',
      guidance: 'DO: Stay at least 10 meters away and warn others nearby. Take photos from a safe distance using camera zoom if available. Notify emergency services immediately if sparking is observed. DONT: NEVER touch any dangling wire or nearby puddle. Don\'t stand under or walk near dangling cables during rain.',
      severity_weight: 5,
      authority_id: 'electrical'
    },
    {
      id: 'animal',
      name: 'Dead Animals',
      icon: '🐕',
      description: 'Carcasses of stray, domestic, or wild animals on public roads requiring urgent, hygienic removal.',
      guidance: 'DO: Provide precise location details and landmark references for the sanitary crew. Capture photo evidence from a safe hygienic distance. Keep children and pets safely away. DONT: Never touch, inspect, or attempt to move the animal carcass yourself. Don\'t dispose of carcasses into public drains.',
      severity_weight: 4,
      authority_id: 'animal_control'
    },
    {
      id: 'other',
      name: 'Other Issues',
      icon: '📌',
      description: 'Damaged footpaths, missing manhole covers, malfunctioning streetlights, and general civic infrastructure defects.',
      guidance: 'DO: Describe the issue clearly, mentioning any immediate public safety hazard. Place a visible temporary marker near open hazards if safe. Take clear photos showing surroundings. DONT: Never step near or look down into unbarricaded open manholes. Don\'t tamper with open electrical junction boxes.',
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

  // 3. Seed 10 sample complaints with varied categories, statuses, and locations
  const insertComplaint = db.prepare(`
    INSERT OR IGNORE INTO complaints (
      id, category_id, description, photo_path, photo_hash,
      latitude, longitude, address_text, status, report_count,
      duplicate_of, authenticity, priority_score, priority_level, authority_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const checkHistory = db.prepare(`
    SELECT COUNT(*) as count FROM status_history WHERE complaint_id = ? AND status = ?
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
      description: 'Large pothole near the bus stop causing heavy vehicle swerving and water splashing.',
      photo_path: '/uploads/sample-pothole.jpg',
      photo_hash: '1100110011001100',
      latitude: 19.0825,
      longitude: 72.8856,
      address_text: 'Station Road, East Gate Bus Stop',
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
      description: 'Overflowing community dumpster spilling trash across the street corner for 3 days.',
      photo_path: '/uploads/sample-garbage.jpg',
      photo_hash: '1111000011110000',
      latitude: 19.0712,
      longitude: 72.8690,
      address_text: 'Sector 5 Market Square, Main Corner',
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
      description: 'Fallen bough blocking half the road after heavy rain, obstructing school buses.',
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
    },
    {
      id: 'CS-2026-00005',
      category_id: 'animal',
      description: 'Deceased stray dog lying on sidewalk near the vegetable market entrance.',
      photo_path: '/uploads/sample-animal.jpg',
      photo_hash: '1010010110100101',
      latitude: 19.0680,
      longitude: 72.8812,
      address_text: 'Vegetable Market Road, Near Shop 14',
      status: 'submitted',
      report_count: 1,
      duplicate_of: null,
      authenticity: 'verified',
      priority_score: 30,
      priority_level: 'medium',
      authority_id: 'animal_control',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'CS-2026-00006',
      category_id: 'other',
      description: 'Missing manhole cover on pedestrian sidewalk creating an open hazard for walkers.',
      photo_path: '/uploads/sample-manhole.jpg',
      photo_hash: '1111111100000000',
      latitude: 19.0795,
      longitude: 72.8734,
      address_text: 'Shivaji Marg, Opposite City Bank ATM',
      status: 'in_progress',
      report_count: 3,
      duplicate_of: null,
      authenticity: 'verified',
      priority_score: 60,
      priority_level: 'high',
      authority_id: 'general',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'CS-2026-00007',
      category_id: 'pothole',
      description: 'Cluster of deep potholes on flyover descent causing sudden braking and near-accidents.',
      photo_path: '/uploads/sample-pothole2.jpg',
      photo_hash: '0011001100110011',
      latitude: 19.0850,
      longitude: 72.8790,
      address_text: 'North Flyover Descent, Southbound Lane',
      status: 'under_review',
      report_count: 2,
      duplicate_of: null,
      authenticity: 'verified',
      priority_score: 50,
      priority_level: 'high',
      authority_id: 'roads',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'CS-2026-00008',
      category_id: 'garbage',
      description: 'Illegal roadside construction waste and plastic debris dumped near residential complex.',
      photo_path: '/uploads/sample-garbage2.jpg',
      photo_hash: '0000111100001111',
      latitude: 19.0735,
      longitude: 72.8830,
      address_text: 'Greenwood Society Lane, Near Tower B',
      status: 'resolved',
      report_count: 1,
      duplicate_of: null,
      authenticity: 'verified',
      priority_score: 20,
      priority_level: 'low',
      authority_id: 'sanitation',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'CS-2026-00009',
      category_id: 'cable',
      description: 'Sparking low-hanging electrical wire touching metal fencing after heavy wind.',
      photo_path: '/uploads/sample-cable2.jpg',
      photo_hash: '0101010101010101',
      latitude: 19.0782,
      longitude: 72.8654,
      address_text: 'Industrial Estate Gate 3, Cross Road',
      status: 'submitted',
      report_count: 1,
      duplicate_of: null,
      authenticity: 'verified',
      priority_score: 65,
      priority_level: 'critical',
      authority_id: 'electrical',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'CS-2026-00010',
      category_id: 'tree',
      description: 'Overgrown tree branches completely obstructing streetlight and traffic junction mirror.',
      photo_path: '/uploads/sample-tree2.jpg',
      photo_hash: '1100001111000011',
      latitude: 19.0810,
      longitude: 72.8880,
      address_text: 'Model Town Junction, Near Circle Library',
      status: 'in_progress',
      report_count: 2,
      duplicate_of: null,
      authenticity: 'verified',
      priority_score: 40,
      priority_level: 'medium',
      authority_id: 'garden',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
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

    const histCount = checkHistory.get(c.id, 'submitted').count;
    if (histCount === 0) {
      insertHistory.run(c.id, 'submitted', 'Complaint registered via Civic Sense', c.created_at);
    }
    if (c.status !== 'submitted') {
      const statusHistCount = checkHistory.get(c.id, c.status).count;
      if (statusHistCount === 0) {
        insertHistory.run(c.id, c.status, `Status changed to ${c.status} by authority`, c.updated_at);
      }
    }
  }

  // Ensure resolved demo complaints have Proof of Resolution photos and audit notes
  try {
    db.prepare(`
      UPDATE complaints
      SET resolution_photo_path = '/uploads/sample-resolved-tree.jpg',
          resolution_note = 'Municipal garden squad pruned fractured bough, cleared road corridor, and sanitized roadway.',
          resolved_at = COALESCE(resolved_at, datetime('now', '-3 days')),
          confirm_count = 4,
          dispute_count = 0
      WHERE id = 'CS-2026-00004' AND (resolution_photo_path IS NULL OR resolution_photo_path = '')
    `).run();

    db.prepare(`
      UPDATE complaints
      SET resolution_photo_path = '/uploads/sample-resolved-garbage.jpg',
          resolution_note = 'Solid waste management crew cleared waste overflow and sanitized dumpster station.',
          resolved_at = COALESCE(resolved_at, datetime('now', '-2 days')),
          confirm_count = 7,
          dispute_count = 0
      WHERE id = 'CS-2026-00008' AND (resolution_photo_path IS NULL OR resolution_photo_path = '')
    `).run();
  } catch (seedResErr) {
    console.warn('[Seed Resolution Update]', seedResErr.message);
  }
}

module.exports = { seed };
