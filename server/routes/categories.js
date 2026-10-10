// server/routes/categories.js
// Owner: Sujal (Module: Issue Explorer)
const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/categories - List all categories
router.get('/', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.id, c.name, c.icon, c.description, c.severity_weight, c.authority_id, a.name AS authority_name
      FROM categories c
      LEFT JOIN authorities a ON c.authority_id = a.id
      ORDER BY c.severity_weight DESC
    `).all();

    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:id - Category details and guidance
router.get('/:id', (req, res) => {
  try {
    const category = db.prepare(`
      SELECT c.*, a.name AS authority_name, a.department AS authority_department
      FROM categories c
      LEFT JOIN authorities a ON c.authority_id = a.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!category) {
      return res.status(404).json({ error: `Category '${req.params.id}' not found` });
    }

    res.json(category);
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ error: 'Failed to fetch category details' });
  }
});

module.exports = router;
