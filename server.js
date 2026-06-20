/**
 * Searchr YouTube Downloader — Server Entry Point
 * 
 * Express.js server with EJS templating, modular routes,
 * and a premium glassmorphism dark-theme UI.
 * 
 * Author: Param Panchal (Searchr)
 */

require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

/* ─── Ensure required directories exist ─────────────────────────── */
const dirs = [
  path.join(__dirname, 'downloads'),
  path.join(__dirname, 'data')
];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Dynamically write cookies file if provided via environment variable
const cookiesPath = path.join(__dirname, 'data', 'cookies.txt');
if (process.env.COOKIES_CONTENT) {
  try {
    fs.writeFileSync(cookiesPath, process.env.COOKIES_CONTENT, 'utf8');
    console.log('🍪 Cookies file successfully written from environment variable.');
  } catch (err) {
    console.error('❌ Failed to write cookies file:', err.message);
  }
}

/* ─── View Engine Setup ─────────────────────────────────────────── */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

/* ─── Middleware ─────────────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Make the current path available to all views for active-nav highlighting
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

/* ─── Routes ────────────────────────────────────────────────────── */
const indexRoutes   = require('./routes/index');
const videoRoutes   = require('./routes/video');
const audioRoutes   = require('./routes/audio');
const clipRoutes    = require('./routes/clip');
const liveRoutes    = require('./routes/live');
const historyRoutes = require('./routes/history');
const thumbnailRoutes = require('./routes/thumbnail');

app.use('/',        indexRoutes);
app.use('/video',   videoRoutes);
app.use('/audio',   audioRoutes);
app.use('/clip',    clipRoutes);
app.use('/live',    liveRoutes);
app.use('/history', historyRoutes);
app.use('/thumbnail', thumbnailRoutes);

/* ─── About page (simple, no controller needed) ────────────────── */
app.get('/about', (req, res) => {
  res.render('about', { title: 'About — Searchr YouTube Downloader' });
});

/* ─── 404 Handler ───────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).render('index', {
    title: '404 — Searchr YouTube Downloader',
    error: 'Page not found'
  });
});

/* ─── Global Error Handler ──────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error. Please try again.'
  });
});

/* ─── Start Server ──────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║   🎬  Searchr YouTube Downloader               ║
  ║   🌐  http://localhost:${PORT}                   ║
  ║   👨‍💻  Developed by Param Panchal (Searchr)    ║  
  ╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
