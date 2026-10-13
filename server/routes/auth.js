// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const { requireOfficial, JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const official = db.prepare('SELECT * FROM officials WHERE email = ?').get(email.trim().toLowerCase());
    if (!official) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = bcrypt.compareSync(password, official.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: official.id, email: official.email, role: official.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      official: {
        id: official.id,
        name: official.name,
        email: official.email,
        role: official.role
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Authentication service encountered an error' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated official
 */
router.get('/me', requireOfficial, (req, res) => {
  res.json({ official: req.official });
});

module.exports = router;
