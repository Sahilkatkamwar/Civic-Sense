// server/db/seed-features.js
const bcrypt = require('bcryptjs');

function seedFeatures(db) {
  // 1. Seed 6 realistic wards in the Mumbai metropolitan area
  const insertWard = db.prepare(`
    INSERT INTO wards (id, name, center_lat, center_lng)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      center_lat = excluded.center_lat,
      center_lng = excluded.center_lng
  `);

  const wards = [
    { id: 'ward_01', name: 'Ward H/East (Santacruz - Bandra East)', center_lat: 19.0760, center_lng: 72.8777 },
    { id: 'ward_02', name: 'Ward L (Kurla - Chunabhatti)', center_lat: 19.0720, center_lng: 72.8850 },
    { id: 'ward_03', name: 'Ward K/East (Andheri East - Marol)', center_lat: 19.1130, center_lng: 72.8690 },
    { id: 'ward_04', name: 'Ward G/North (Dharavi - Mahim East)', center_lat: 19.0400, center_lng: 72.8520 },
    { id: 'ward_05', name: 'Ward H/West (Bandra West - Khar)', center_lat: 19.0600, center_lng: 72.8360 },
    { id: 'ward_06', name: 'Ward F/North (Matunga - Sion West)', center_lat: 19.0320, center_lng: 72.8610 }
  ];

  for (const w of wards) {
    insertWard.run(w.id, w.name, w.center_lat, w.center_lng);
  }

  // 2. Seed municipal official if not present
  const officialEmail = process.env.OFFICIAL_EMAIL || 'officer@civicsense.local';
  const officialPassword = process.env.OFFICIAL_PASSWORD || 'change_me_before_demo';
  const existingOfficial = db.prepare('SELECT id FROM officials WHERE email = ?').get(officialEmail);

  let officialId = null;
  if (!existingOfficial) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(officialPassword, salt);
    const result = db.prepare(`
      INSERT INTO officials (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('Ward Executive Officer', officialEmail, hash, 'official');
    officialId = result.lastInsertRowid;
  } else {
    officialId = existingOfficial.id;
  }

  // 3. Seed 4 sample alerts (idempotent)
  const existingAlertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
  if (existingAlertCount === 0) {
    const insertAlert = db.prepare(`
      INSERT INTO alerts (
        type, severity, title_en, title_hi, title_mr,
        body_en, body_hi, body_mr, all_wards, status,
        starts_at, ends_at, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAlertWard = db.prepare(`
      INSERT OR IGNORE INTO alert_wards (alert_id, ward_id)
      VALUES (?, ?)
    `);

    const insertAlertUpdate = db.prepare(`
      INSERT INTO alert_updates (alert_id, note, created_at)
      VALUES (?, ?, ?)
    `);

    const now = Date.now();
    const iso = (ms) => new Date(ms).toISOString();

    const sampleAlerts = [
      {
        type: 'water_cut',
        severity: 'warning',
        title_en: 'Emergency Water Supply Pipeline Maintenance',
        title_hi: 'आपातकालीन जल आपूर्ति पाइपलाइन मरम्मत',
        title_mr: 'तातडीची पाणीपुरवठा पाईपलाईन दुरुस्ती',
        body_en: 'Due to urgent maintenance on the 1200mm header pipeline, water supply will remain suspended in Santacruz East and Kurla West from 10:00 AM to 8:00 PM today. Low pressure may be experienced afterwards.',
        body_hi: '1200 मिमी मुख्य पाइपलाइन की आपातकालीन मरम्मत के कारण, आज सुबह 10:00 बजे से रात 8:00 बजे तक सांताक्रूज पूर्व और कुर्ला पश्चिम में जल आपूर्ति बंद रहेगी।',
        body_mr: '१२०० मिमी मुख्य जलवाहिनीच्या तातडीच्या दुरुस्तीमुळे आज सकाळी १० ते रात्री ८ वाजेपर्यंत सांताक्रूझ पूर्व व कुर्ला पश्चिम परिसरात पाणीपुरवठा बंद राहील.',
        all_wards: 0,
        status: 'active',
        starts_at: iso(now - 2 * 3600000),
        ends_at: iso(now + 6 * 3600000),
        wards: ['ward_01', 'ward_02'],
        updates: ['Water tankers have been mobilized at Station Road and Market Square.']
      },
      {
        type: 'road_closure',
        severity: 'info',
        title_en: 'Scheduled Asphalting & Road Closure on Station Flyover',
        title_hi: 'स्टेशन फ्लाईओवर पर डामरीकरण एवं मार्ग बंद',
        title_mr: 'स्टेशन उड्डाणपुलावर डांबरीकरण व रस्ता बंद',
        body_en: 'Station Flyover will be closed for nocturnal bituminous overlay and joint re-surfacing starting tomorrow at 11:00 PM until 6:00 AM. Traffic diverted via Western Express Highway service lane.',
        body_hi: 'स्टेशन फ्लाईओवर कल रात 11:00 बजे से सुबह 6:00 बजे तक डामरीकरण के लिए बंद रहेगा। यातायात को सर्विस लेन से डायवर्ट किया जाएगा।',
        body_mr: 'स्टेशन उड्डाणपुलावर डांबरीकरण कामासाठी उद्या रात्री ११ ते सकाळी ६ या वेळेत वाहतूक पूर्ण बंद राहील. पर्यायी मार्गाने वाहतूक वळवण्यात आली आहे.',
        all_wards: 0,
        status: 'scheduled',
        starts_at: iso(now + 24 * 3600000),
        ends_at: iso(now + 31 * 3600000),
        wards: ['ward_01'],
        updates: []
      },
      {
        type: 'waste_schedule',
        severity: 'info',
        title_en: 'Monsoon Segregated Dry & Wet Waste Collection Timings',
        title_hi: 'मानसून गीला एवं सूखा कचरा संग्रहण समय सारणी',
        title_mr: 'पावसाळी ओला व सुका कचरा संकलन वेळापत्रक',
        body_en: 'Municipal waste compactor vans will now begin daily ward routes at 6:30 AM instead of 7:30 AM across all municipal wards to prevent waterlogging around transfer stations.',
        body_hi: 'जलभराव की रोकथाम हेतु सभी वार्डों में कचरा संग्रहण गाड़ियां अब सुबह 7:30 के स्थान पर 6:30 बजे से शुरू होंगी।',
        body_mr: 'पावसाळ्यात कचरा साचू नये म्हणून सर्व प्रभागांमध्ये कचरा संकलन गाड्या सकाळी ७:३० ऐवजी ६:३० वाजता सुरू होतील.',
        all_wards: 1,
        status: 'active',
        starts_at: iso(now - 24 * 3600000),
        ends_at: iso(now + 14 * 86400000),
        wards: [],
        updates: []
      },
      {
        type: 'power_cut',
        severity: 'warning',
        title_en: 'Feeder Line Tripping & Substation Restoration',
        title_hi: 'फीडर लाइन ट्रिपिंग एवं सबस्टेशन बहाली',
        title_mr: 'फीडर लाईन बिघाड व सबस्टेशन दुरुस्ती',
        body_en: '11kV feeder trip affecting Kurla and Chunabhatti has been fully isolated and restored. Grid voltage is normal.',
        body_hi: 'कुर्ला एवं चूनाभट्टी में 11kV फीडर की समस्या का समाधान कर दिया गया है। विद्युत आपूर्ति सामान्य है।',
        body_mr: 'कुर्ला व चुनाभट्टी परिसरातील ११ केव्ही वीज पुरवठा बिघाड दुरुस्त करण्यात आला असून वीज प्रवाह पूर्ववत सुरू झाला आहे.',
        all_wards: 0,
        status: 'resolved',
        starts_at: iso(now - 6 * 3600000),
        ends_at: iso(now - 1 * 3600000),
        wards: ['ward_02'],
        updates: [
          'Emergency crew arrived at site at 15:45.',
          'Substation feeder energized and power restored at 17:30.'
        ]
      }
    ];

    for (const alert of sampleAlerts) {
      const res = insertAlert.run(
        alert.type,
        alert.severity,
        alert.title_en,
        alert.title_hi,
        alert.title_mr,
        alert.body_en,
        alert.body_hi,
        alert.body_mr,
        alert.all_wards,
        alert.status,
        alert.starts_at,
        alert.ends_at,
        officialId,
        alert.starts_at,
        alert.starts_at
      );
      const alertId = res.lastInsertRowid;

      for (const wid of alert.wards) {
        insertAlertWard.run(alertId, wid);
      }

      for (const note of alert.updates) {
        insertAlertUpdate.run(alertId, note, iso(now - 1 * 3600000));
      }
    }
  }
}

module.exports = { seedFeatures };
