// server/services/duplicate.js
const sharp = require('sharp');

/**
 * Computes perceptual difference hash (dHash) for an image.
 * Resizes to 9x8 grayscale and compares adjacent horizontal pixels (64 bits).
 */
async function computeHash(filePathOrBuffer) {
  try {
    const { data } = await sharp(filePathOrBuffer)
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let hashBinary = '';
    // 8 rows, each row has 9 pixels -> 8 comparisons per row = 64 bits total
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const leftPixel = data[row * 9 + col];
        const rightPixel = data[row * 9 + col + 1];
        hashBinary += leftPixel > rightPixel ? '1' : '0';
      }
    }
    return hashBinary;
  } catch (err) {
    console.error('Error computing dHash:', err);
    // Fallback pseudo-hash if file cannot be parsed as image
    return '0'.repeat(64);
  }
}

/**
 * Calculates the Hamming distance between two binary hash strings.
 */
function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2) return 64;
  let distance = 0;
  const len = Math.min(hash1.length, hash2.length);
  for (let i = 0; i < len; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  distance += Math.abs(hash1.length - hash2.length);
  return distance;
}

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
function distanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  computeHash,
  hammingDistance,
  distanceMeters
};
