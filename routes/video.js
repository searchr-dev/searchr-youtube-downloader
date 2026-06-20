/**
 * Video Routes
 * Author: Param Panchal (Searchr)
 */

const router = require('express').Router();
const videoController = require('../controllers/videoController');

// GET  /video         — Render video downloader page
router.get('/', videoController.showPage);

// POST /video/info    — Fetch video info & formats
router.post('/info', videoController.getInfo);

// GET  /video/download — Download video file
router.get('/download', videoController.download);

module.exports = router;
