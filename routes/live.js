/**
 * Live Stream Routes
 * Author: Param Panchal (Searchr)
 */

const router = require('express').Router();
const liveController = require('../controllers/liveController');

// GET  /live         — Render live stream downloader page
router.get('/', liveController.showPage);

// POST /live/info    — Detect live stream & fetch info
router.post('/info', liveController.getInfo);

// GET  /live/download — Download / record live stream
router.get('/download', liveController.download);

module.exports = router;
