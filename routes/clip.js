/**
 * Clip Routes
 * Author: Param Panchal (Searchr)
 */

const router = require('express').Router();
const clipController = require('../controllers/clipController');

// GET  /clip         — Render timestamp downloader page
router.get('/', clipController.showPage);

// POST /clip/info    — Fetch video info for clipping
router.post('/info', clipController.getInfo);

// GET  /clip/download — Download trimmed clip
router.get('/download', clipController.download);

module.exports = router;
