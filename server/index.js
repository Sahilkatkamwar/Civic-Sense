// server/index.js
// Owner: Sahil (Team Lead) - Server entry point and API route configuration
require('dotenv').config();
const fs = require('fs');
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

// Serve frontend static build if it exists
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Civic Sense API</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .box { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 520px; text-align: center; border: 1px solid #e2e8f0; }
          h2 { color: #1e40af; margin-top: 0; }
          .pill { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 999px; font-weight: 600; font-size: 0.85rem; margin-bottom: 1rem; }
          .cmd { background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 0.95rem; display: inline-block; margin: 0.5rem 0; border: 1px solid #cbd5e1; }
          .btn { display: inline-block; background: #1e40af; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="box">
          <span class="pill">⚡ Backend Online</span>
          <h2>🏛️ Civic Sense API Server</h2>
          <p>The backend Express server is running on port <strong>${PORT}</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;" />
          <p>To view the full React web application, open a terminal in <code>D:\\Civic-Sense</code> and run:</p>
          <div class="cmd">npm run dev</div>
          <p>Then open the React app in your browser:</p>
          <a href="http://localhost:5173" class="btn">Open Frontend (http://localhost:5173) &rarr;</a>
        </div>
      </body>
      </html>
    `);
  });
}

// Start listening
const server = app.listen(PORT, () => {
  console.log(`[Civic Sense API] Server running on http://localhost:${PORT}`);
  console.log(`[Civic Sense UI] Web App accessible on http://localhost:${PORT} or Vite dev server at http://localhost:5173`);
});

module.exports = { app, server };
