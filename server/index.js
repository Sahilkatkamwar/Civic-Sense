// server/index.js
// Owner: Sahil (Team Lead) - Server entry point and API route configuration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const categoriesRouter = require('./routes/categories');
const complaintsRouter = require('./routes/complaints');
const db = require('./db/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded photos statically
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Civic Sense API',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/categories', categoriesRouter);
app.use('/api/complaints', complaintsRouter);

// API Contract specific route: GET /api/authority/complaints
app.get('/api/authority/complaints', (req, res, next) => {
  req.url = '/authority/queue';
  complaintsRouter(req, res, next);
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route '${req.originalUrl}' not found` });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`[Civic Sense API] Server running on http://localhost:${PORT}`);
});

module.exports = { app, server };
