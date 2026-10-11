// server/test_api.js
// Automated verification for Part 1 API contract
const { app } = require('./index');

async function testEndpoints() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const PORT = server.address().port;
  const BASE_URL = `http://localhost:${PORT}`;

  console.log(`Running API contract checks against ${BASE_URL}...`);

  const checks = [
    { method: 'GET', path: '/api/health', expectedStatus: 200 },
    { method: 'GET', path: '/api/categories', expectedStatus: 200 },
    { method: 'GET', path: '/api/categories/pothole', expectedStatus: 200 },
    { method: 'GET', path: '/api/categories/nonexistent_id', expectedStatus: 404 },
    { method: 'GET', path: '/api/complaints', expectedStatus: 200 },
    { method: 'GET', path: '/api/complaints?sort=priority', expectedStatus: 200 },
    { method: 'GET', path: '/api/complaints/CS-2026-00001', expectedStatus: 200 },
    { method: 'GET', path: '/api/complaints/CS-9999-99999', expectedStatus: 404 },
    { method: 'GET', path: '/api/complaints/stats', expectedStatus: 200 },
    { method: 'GET', path: '/api/authority/complaints', expectedStatus: 200 }
  ];

  let passed = 0;
  for (const check of checks) {
    try {
      const res = await fetch(`${BASE_URL}${check.path}`, { method: check.method });
      if (res.status === check.expectedStatus) {
        console.log(`[PASS] ${check.method} ${check.path} -> ${res.status}`);
        passed++;
      } else {
        console.error(`[FAIL] ${check.method} ${check.path} -> Expected ${check.expectedStatus}, got ${res.status}`);
      }
    } catch (e) {
      console.error(`[ERROR] ${check.method} ${check.path}:`, e.message);
    }
  }

  console.log(`\nResults: ${passed}/${checks.length} tests passed.`);
  server.close(() => {
    console.log('Server shut down cleanly.');
    process.exit(passed === checks.length ? 0 : 1);
  });
}

testEndpoints();
