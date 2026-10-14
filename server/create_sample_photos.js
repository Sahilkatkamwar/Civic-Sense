const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function createSample(name, color, label, shape = '') {
  const svg = Buffer.from(`
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="400" fill="${color}"/>
      ${shape}
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff">
        ${label}
      </text>
    </svg>
  `);
  await sharp(svg).jpeg().toFile(path.join(uploadsDir, name));
}

async function run() {
  await createSample(
    'sample-cable.jpg',
    '#991b1b',
    '⚡ Snapped Cable Hazard (Before)',
    '<line x1="0" y1="50" x2="600" y2="350" stroke="#facc15" stroke-width="24"/>'
  );
  await createSample(
    'sample-pothole.jpg',
    '#78350f',
    '🕳️ Hazardous Road Pothole (Before)',
    '<ellipse cx="300" cy="200" rx="220" ry="110" fill="#18181b"/>'
  );
  await createSample(
    'sample-garbage.jpg',
    '#334155',
    '🗑️ Community Waste Pile (Before)',
    '<rect x="40" y="220" width="520" height="140" fill="#451a03"/>'
  );
  await createSample(
    'sample-tree.jpg',
    '#15803d',
    '🌳 Fallen Tree Limb (Before)',
    '<polygon points="300,40 100,360 500,360" fill="#052e16"/>'
  );

  // Proof of Resolution Photos ("After")
  await createSample(
    'sample-resolved-pothole.jpg',
    '#0f766e',
    '✅ Bituminous Asphalt Patch Applied (After)',
    '<rect x="80" y="120" width="440" height="160" fill="#374151" rx="20"/>'
  );
  await createSample(
    'sample-resolved-cable.jpg',
    '#1d4ed8',
    '✅ Insulated Overhead Cable Restrung (After)',
    '<line x1="0" y1="80" x2="600" y2="80" stroke="#60a5fa" stroke-width="16"/>'
  );
  await createSample(
    'sample-resolved-tree.jpg',
    '#15803d',
    '✅ Roadway Cleared and Debris Removed (After)',
    '<rect x="0" y="300" width="600" height="100" fill="#22c55e"/>'
  );
  await createSample(
    'sample-resolved-garbage.jpg',
    '#047857',
    '✅ Compactor Cleared and Bin Sanitized (After)',
    '<rect x="150" y="150" width="300" height="200" fill="#10b981" rx="12"/>'
  );

  console.log('Sample demo photos created in uploads/');
}

run();
