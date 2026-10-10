const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function createSample(name, color, label) {
  const svg = Buffer.from(`
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="400" fill="${color}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff">
        ${label}
      </text>
    </svg>
  `);
  await sharp(svg).jpeg().toFile(path.join(uploadsDir, name));
}

async function run() {
  await createSample('sample-cable.jpg', '#b91c1c', '⚡ Snapped Cable Hazard');
  await createSample('sample-pothole.jpg', '#c2410c', '🕳️ Hazardous Road Pothole');
  await createSample('sample-garbage.jpg', '#334155', '🗑️ Community Waste Pile');
  await createSample('sample-tree.jpg', '#15803d', '🌳 Fallen Tree Limb');
  console.log('Sample demo photos created in uploads/');
}

run();
