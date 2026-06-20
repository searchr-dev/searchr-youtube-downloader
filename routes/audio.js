/**
 * Audio Routes
 * Author: Param Panchal (Searchr)
 */

const router = require('express').Router();
const audioController = require('../controllers/audioController');

// GET  /audio         — Render audio extractor page
router.get('/', audioController.showPage);

// POST /audio/info    — Fetch audio info & formats
router.post('/info', audioController.getInfo);

// GET  /audio/download — Download extracted audio
router.get('/download', audioController.download);

// GET  /audio/thumbnail — Proxy to download thumbnail images safely
router.get('/thumbnail', audioController.downloadThumbnail);

module.exports = router;
