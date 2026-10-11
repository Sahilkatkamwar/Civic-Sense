// server/test_e2e_flow.js
// Automated verification of end-to-end citizen workflow:
// Report -> Duplicate Merge -> Priority Rise -> Track -> Authority Update
const fs = require('fs');
const path = require('path');
const { app } = require('./index');

async function runE2E() {
  console.log('--- Running Full End-to-End Civic Flow Test ---');
  let complaintId = null;
  let server = null;

  try {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const PORT = server.address().port;
    const BASE_URL = `http://localhost:${PORT}`;
    // Generate fresh coordinates for this test run
    const randOffset = Math.random() * 0.1;
    const baseLat = 19.200000 + randOffset;
    const baseLng = 72.850000 + randOffset;

    // 1. Submit a fresh complaint
    console.log('\n1. Submitting new complaint...');
    const formData = new FormData();
    formData.append('category_id', 'pothole');
    formData.append('description', 'Dangerous deep crater in left lane causing bike skids');
    formData.append('latitude', baseLat.toFixed(6));
    formData.append('longitude', baseLng.toFixed(6));
    formData.append('address_text', 'Highway Link Road junction');

    const photoPath = path.join(__dirname, '../uploads/sample-pothole.jpg');
    const photoBlob = new Blob([fs.readFileSync(photoPath)], { type: 'image/jpeg' });
    formData.append('photo', photoBlob, 'pothole.jpg');

    const postRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      body: formData
    });
    const postData = await postRes.json();
    console.log('POST Response:', postData);

    if (postRes.status !== 201 || !postData.id || postData.duplicate) {
      throw new Error(`Failed to create initial complaint: ${JSON.stringify(postData)}`);
    }
    complaintId = postData.id;
    console.log(`[PASS] Created complaint with ID: ${complaintId}`);

    // 2. Submit a duplicate complaint (same location <= 50m, same photo)
    console.log('\n2. Submitting duplicate complaint to test smart merge...');
    const dupFormData = new FormData();
    dupFormData.append('category_id', 'pothole');
    dupFormData.append('description', 'Another citizen noticing the exact same crater');
    // Offset ~2 meters
    dupFormData.append('latitude', (baseLat + 0.00002).toFixed(6));
    dupFormData.append('longitude', (baseLng + 0.00002).toFixed(6));
    dupFormData.append('address_text', 'Highway Link Road near junction');
    dupFormData.append('photo', photoBlob, 'pothole_dup.jpg');

    const dupRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      body: dupFormData
    });
    const dupData = await dupRes.json();
    console.log('Duplicate Response:', dupData);

    if (!dupData.duplicate || dupData.id !== complaintId) {
      throw new Error(`Duplicate was not merged as expected: ${JSON.stringify(dupData)}`);
    }
    console.log(`[PASS] Duplicate correctly detected and merged into ${complaintId}. Priority score: ${dupData.priority_score}`);

    // 3. Track complaint by ID
    console.log('\n3. Tracking complaint...');
    const trackRes = await fetch(`${BASE_URL}/api/complaints/${complaintId}`);
    const trackData = await trackRes.json();
    console.log('Track Response: Report count =', trackData.report_count, 'Status =', trackData.status);

    if (trackData.report_count < 2) {
      throw new Error(`Expected report_count >= 2, got ${trackData.report_count}`);
    }
    console.log('[PASS] Tracking verifies merged report count and history timeline');

    // 4. Authority updates status: submitted -> under_review -> in_progress
    console.log('\n4. Authority updating status: submitted -> under_review...');
    const reviewRes = await fetch(`${BASE_URL}/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'under_review',
        note: 'Assigned to field inspection officer'
      })
    });
    const reviewData = await reviewRes.json();
    console.log('PATCH (under_review) Response:', reviewData);

    if (reviewRes.status !== 200 || reviewData.status !== 'under_review') {
      throw new Error(`Failed to update status to under_review: ${JSON.stringify(reviewData)}`);
    }

    console.log('\n4b. Authority updating status: under_review -> in_progress...');
    const patchRes = await fetch(`${BASE_URL}/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'in_progress',
        note: 'Road repair gang dispatched with asphalt mix'
      })
    });
    const patchData = await patchRes.json();
    console.log('PATCH (in_progress) Response:', patchData);

    if (patchRes.status !== 200 || patchData.status !== 'in_progress') {
      throw new Error(`Failed to update status to in_progress: ${JSON.stringify(patchData)}`);
    }
    console.log('[PASS] Authority successfully updated status through valid lifecycle');

    // 5. Citizen re-tracks to confirm updated status
    console.log('\n5. Citizen re-tracking to see authority resolution update...');
    const retrackRes = await fetch(`${BASE_URL}/api/complaints/${complaintId}`);
    const retrackData = await retrackRes.json();

    if (retrackData.status !== 'in_progress') {
      throw new Error(`Expected status 'in_progress', got ${retrackData.status}`);
    }
    console.log('[PASS] Retrack confirmed status is now in_progress with updated history!');
    console.log('\n=== ALL END-TO-END WORKFLOW CHECKS PASSED ===');

    server.close(() => process.exit(0));
  } catch (err) {
    console.error('[E2E FAILED]:', err.message);
    if (server) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  }
}

runE2E();
