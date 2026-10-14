// scratch/test_video_upload.js
const fs = require('fs');
const path = require('path');

async function testVideoSubmission() {
  const fetch = globalThis.fetch;
  const dummyWebmBuffer = Buffer.from('RIFF....WEBM....dummyvideocontent');
  const tempFile = path.join(__dirname, 'test-hazard-clip.webm');
  fs.writeFileSync(tempFile, dummyWebmBuffer);

  const formData = new FormData();
  formData.append('category_id', 'pothole');
  formData.append('description', 'Live video demonstration of road crater hazard during monsoon surge');
  formData.append('latitude', '19.0760');
  formData.append('longitude', '72.8777');
  formData.append('address_text', 'Live Video Test Road');

  const fileBlob = new Blob([dummyWebmBuffer], { type: 'video/webm' });
  formData.append('photo', fileBlob, 'live-video-12345.webm');

  // Find server port from env or default 5000 / 5001
  const port = process.env.PORT || 5000;
  console.log(`Sending video complaint to http://localhost:${port}/api/complaints...`);

  try {
    const res = await fetch(`http://localhost:${port}/api/complaints`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body:', data);

    if (res.ok && data.id) {
      console.log('SUCCESS! Complaint with video uploaded. ID:', data.id);
      // Fetch complaint to verify photo_path
      const detailRes = await fetch(`http://localhost:${port}/api/complaints/${data.id}`);
      const detail = await detailRes.json();
      console.log('Verified photo_path in database:', detail.photo_path);
    } else {
      console.error('FAILED with:', data);
    }
  } catch (err) {
    console.error('Error in request:', err.message);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

testVideoSubmission();
