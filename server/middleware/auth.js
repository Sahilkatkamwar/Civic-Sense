// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../db/db');

const JWT_SECRET = process.env.JWT_SECRET || 'civic_sense_secure_jwt_secret_dev_2026';

function requireOfficial(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing or malformed token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const official = db.prepare('SELECT id, name, email, role FROM officials WHERE id = ?').get(decoded.id);

    if (!official) {
      return res.status(401).json({ error: 'Official account not found or access revoked.' });
    }

    req.official = official;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

module.exports = {
  requireOfficial,
  JWT_SECRET
};
