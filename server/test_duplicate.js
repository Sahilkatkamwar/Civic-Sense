// server/test_duplicate.js
// Verification suite for duplicate detection, hashing, and priority logic
const { computeHash, hammingDistance, distanceMeters } = require('./services/duplicate');
const { calculatePriority } = require('./services/priority');
const path = require('path');

async function runTests() {
  console.log('--- Running Duplicate Detection & Priority Suite ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  // 1. Distance Calculation Tests (Haversine)
  const distSame = distanceMeters(19.0760, 72.8777, 19.0760, 72.8777);
  assert(Math.round(distSame) === 0, 'Haversine distance between identical coordinates is 0 meters');

  // ~111 meters per degree latitude / 0.00045 deg is roughly 50m
  const distClose = distanceMeters(19.0760, 72.8777, 19.0763, 72.8777);
  assert(distClose > 0 && distClose < 60, `Haversine detects nearby point within ~50m (Calculated: ${Math.round(distClose)}m)`);

  const distFar = distanceMeters(19.0760, 72.8777, 19.1200, 72.8777);
  assert(distFar > 4000, `Haversine detects far point (>4km) (Calculated: ${Math.round(distFar)}m)`);

  // 2. Hamming Distance Tests
  const hashA = '1111000011110000111100001111000011110000111100001111000011110000';
  const hashIdentical = '1111000011110000111100001111000011110000111100001111000011110000';
  const hashClose = '1111000011110000111100001111000011110000111100001111000011110011'; // 2 bits diff
  const hashDiff = '0000111100001111000011110000111100001111000011110000111100001111'; // 64 bits diff

  assert(hammingDistance(hashA, hashIdentical) === 0, 'Hamming distance for identical hashes is 0');
  assert(hammingDistance(hashA, hashClose) === 2, 'Hamming distance accurately counts 2 bit variations');
  assert(hammingDistance(hashA, hashDiff) === 64, 'Hamming distance accurately counts complete inverse hash as 64');

  // 3. Image Perceptual Hashing (dHash)
  const sample1 = path.join(__dirname, '../uploads/sample-cable.jpg');
  const sample2 = path.join(__dirname, '../uploads/sample-pothole.jpg');
  const hash1 = await computeHash(sample1);
  const hash2 = await computeHash(sample2);

  assert(typeof hash1 === 'string' && hash1.length === 64, 'dHash generates 64-bit binary hash for sample 1');
  assert(typeof hash2 === 'string' && hash2.length === 64, 'dHash generates 64-bit binary hash for sample 2');

  const sampleDiff = hammingDistance(hash1, hash2);
  console.log(`Hamming distance between distinct sample photos: ${sampleDiff}`);
  assert(sampleDiff > 10, 'Distinct sample images yield hamming distance > 10');

  // 4. Priority Formula Tests
  // formula: (report_count * 10) + (severity_weight * 5) + (days_open * 2) + (suspicious ? -10 : 0)
  const prio1 = calculatePriority({ report_count: 1, severity_weight: 4 });
  // score = (1*10) + (4*5) + (0*2) + 0 = 30 -> medium
  assert(prio1.score === 30 && prio1.level === 'medium', `Priority single report severity 4: expected score 30, got ${prio1.score} (${prio1.level})`);

  // Multiple reports on high severity
  const prio2 = calculatePriority({ report_count: 5, severity_weight: 5 });
  // score = (5*10) + (5*5) = 75 -> critical
  assert(prio2.score === 75 && prio2.level === 'critical', `Priority 5 reports severity 5: expected score 75, got ${prio2.score} (${prio2.level})`);

  // Suspicious penalty
  const prio3 = calculatePriority({ report_count: 1, severity_weight: 2, authenticity: 'suspicious' });
  // score = (1*10) + (2*5) - 10 = 10 -> low
  assert(prio3.score === 10 && prio3.level === 'low', `Priority suspicious penalty: expected score 10, got ${prio3.score} (${prio3.level})`);

  console.log(`\nTests passed: ${passed}/${total}`);
  process.exit(passed === total ? 0 : 1);
}

runTests();
