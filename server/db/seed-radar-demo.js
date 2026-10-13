// server/db/seed-radar-demo.js
// Idempotent demo seed script for Civic Risk Radar pitch

const db = require('./db');
const { calculatePriority } = require('../services/priority');

function seedRadarDemo() {
  console.log('[Seed Radar Demo] Checking existing demo rows...');

  const existing = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE description LIKE '[demo]%'").get();
  if (existing.count > 0) {
    console.log(`[Seed Radar Demo] Skipped: ${existing.count} demo rows already present.`);
    return;
  }

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

  const now = Date.now();
  const day = 86400000;
  const iso = (ms) => new Date(ms).toISOString();

  // Load category severity weights
  const categories = db.prepare('SELECT id, severity_weight, authority_id FROM categories').all();
  const catMap = {};
  for (const c of categories) {
    catMap[c.id] = c;
  }

  const demoItems = [
    // --- 1. Five pothole complaints within ~120m of each other (Cluster 1) ---
    {
      id: 'CS-2026-00021',
      category_id: 'pothole',
      description: '[demo] Deep trench pothole near Metro Pillar 44 right in lane 2.',
      photo_path: '/uploads/sample-pothole.jpg',
      photo_hash: '1100110011000001',
      latitude: 19.0760,
      longitude: 72.8770,
      address_text: 'Opposite Metro Pillar 44, WEH, Santacruz East',
      status: 'under_review',
      report_count: 1,
      created_at: iso(now - 3 * day)
    },
    {
      id: 'CS-2026-00022',
      category_id: 'pothole',
      description: '[demo] Hazardous asphalt crater causing two-wheelers to slip during braking.',
      photo_path: '/uploads/photo-1791644374362-158356297.jpg',
      photo_hash: '1100110011000002',
      latitude: 19.0763,
      longitude: 72.8773,
      address_text: 'Service Road, Near Bus Shelter 44, Santacruz East',
      status: 'submitted',
      report_count: 1,
      created_at: iso(now - 2 * day)
    },
    {
      id: 'CS-2026-00023',
      category_id: 'pothole',
      description: '[demo] Large sunken road depression expanding towards the footpath curb.',
      photo_path: '/uploads/photo-1791644374403-785388445.jpg',
      photo_hash: '1100110011000003',
      latitude: 19.0758,
      longitude: 72.8768,
      address_text: 'Near Junction 44 Pedestrian Crossing',
      status: 'submitted',
      report_count: 1,
      created_at: iso(now - 2 * day)
    },
    {
      id: 'CS-2026-00024',
      category_id: 'pothole',
      description: '[demo] Edge crater breaking road shoulder, loose aggregate scattered on road.',
      photo_path: '/uploads/photo-1791644382462-212212274.jpg',
      photo_hash: '1100110011000004',
      latitude: 19.0765,
      longitude: 72.8772,
      address_text: 'Opposite Metro Gate 3, Santacruz East',
      status: 'under_review',
      report_count: 1,
      created_at: iso(now - 1 * day)
    },
    {
      id: 'CS-2026-00025',
      category_id: 'pothole',
      description: '[demo] Fresh crater formed after heavy water runoff from elevated highway.',
      photo_path: '/uploads/photo-1791644392665-247478598.jpg',
      photo_hash: '1100110011000005',
      latitude: 19.0762,
      longitude: 72.8776,
      address_text: 'Near Flyover Down-Ramp, Santacruz East',
      status: 'submitted',
      report_count: 1,
      created_at: iso(now - 6 * 3600000)
    },

    // --- 2. One resolved pothole nearby from 40 days ago (Recurrence factor driver) ---
    {
      id: 'CS-2026-00026',
      category_id: 'pothole',
      description: '[demo] Previously patched crater recurring at the same joint.',
      photo_path: '/uploads/sample-pothole.jpg',
      photo_hash: '1100110011000006',
      latitude: 19.0761,
      longitude: 72.8771,
      address_text: 'Service Road Junction 44, Santacruz East',
      status: 'resolved',
      report_count: 2,
      created_at: iso(now - 40 * day)
    },

    // --- 3. Second smaller cluster of 3 garbage complaints elsewhere (Cluster 2) ---
    {
      id: 'CS-2026-00027',
      category_id: 'garbage',
      description: '[demo] Commercial vegetable waste dumped on footpath corner.',
      photo_path: '/uploads/sample-garbage.jpg',
      photo_hash: '1111000011110007',
      latitude: 19.0850,
      longitude: 72.8820,
      address_text: 'East Gate Market Lane, Kurla',
      status: 'submitted',
      report_count: 1,
      created_at: iso(now - 1 * day)
    },
    {
      id: 'CS-2026-00028',
      category_id: 'garbage',
      description: '[demo] Overflowing community dumpster blocking half pedestrian walkway.',
      photo_path: '/uploads/photo-1791644392702-245242681.jpg',
      photo_hash: '1111000011110008',
      latitude: 19.0853,
      longitude: 72.8822,
      address_text: 'Behind Bus Stop 12, Kurla East',
      status: 'under_review',
      report_count: 1,
      created_at: iso(now - 2 * day)
    },
    {
      id: 'CS-2026-00029',
      category_id: 'garbage',
      description: '[demo] Plastic refuse and packaging dumped near storm drain entrance.',
      photo_path: '/uploads/photo-1791647089198-750709050.png',
      photo_hash: '1111000011110009',
      latitude: 19.0848,
      longitude: 72.8819,
      address_text: 'Drain Culvert 2, Station Road, Kurla',
      status: 'submitted',
      report_count: 1,
      created_at: iso(now - 1 * day)
    },

    // --- 4. Third cluster of 2 hanging cables (signals = 3, satisfies minSignals) ---
    {
      id: 'CS-2026-00030',
      category_id: 'cable',
      description: '[demo] Snapped electrical cable dangling at eye level from streetlight pole.',
      photo_path: '/uploads/sample-cable.jpg',
      photo_hash: '1010101010100010',
      latitude: 19.0680,
      longitude: 72.8650,
      address_text: 'Near Shastri Nagar Bus Stand, Bandra East',
      status: 'submitted',
      report_count: 2, // 2 citizen signals
      created_at: iso(now - 1 * day)
    },
    {
      id: 'CS-2026-00031',
      category_id: 'cable',
      description: '[demo] Tangled bundle of sagging optical & utility wires crossing roadway.',
      photo_path: '/uploads/sample-cable.jpg',
      photo_hash: '1010101010100011',
      latitude: 19.0683,
      longitude: 72.8653,
      address_text: 'Opposite Municipal Dispensary, Bandra East',
      status: 'under_review',
      report_count: 1,
      created_at: iso(now - 1 * day)
    },

    // --- 5. Isolated complaints that should NOT form clusters ---
    {
      id: 'CS-2026-00032',
      category_id: 'tree',
      description: '[demo] Isolated broken tree branch on residential cul-de-sac.',
      photo_path: '/uploads/sample-tree.jpg',
      photo_hash: '1001100110010012',
      latitude: 19.0990,
      longitude: 72.8900,
      address_text: 'Lane 7, Marol Green Colony',
      status: 'submitted',
      report_count: 1,
      created_at: iso(now - 1 * day)
    },
    {
      id: 'CS-2026-00033',
      category_id: 'animal',
      description: '[demo] Stray dog carcass on isolated bypass shoulder.',
      photo_path: '/uploads/sample-animal.jpg',
      photo_hash: '1010010110100013',
      latitude: 19.0500,
      longitude: 72.8500,
      address_text: 'Near Dharavi Transit Road',
      status: 'submitted',
      report_count: 1,
      created_at: iso(now - 1 * day)
    }
  ];

  for (const item of demoItems) {
    const cat = catMap[item.category_id] || { severity_weight: 2, authority_id: 'general' };
    const { score, level } = calculatePriority({
      report_count: item.report_count,
      severity_weight: cat.severity_weight,
      created_at: item.created_at,
      authenticity: 'verified'
    });

    insertComplaint.run(
      item.id,
      item.category_id,
      item.description,
      item.photo_path,
      item.photo_hash,
      item.latitude,
      item.longitude,
      item.address_text,
      item.status,
      item.report_count,
      null,
      'verified',
      score,
      level,
      cat.authority_id,
      item.created_at,
      item.created_at
    );

    insertHistory.run(
      item.id,
      item.status,
      `Complaint registered and queued for verification`,
      item.created_at
    );
  }

  console.log(`[Seed Radar Demo] Successfully seeded ${demoItems.length} demo complaints.`);
}

if (require.main === module) {
  seedRadarDemo();
}

module.exports = { seedRadarDemo };
