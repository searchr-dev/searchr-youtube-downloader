/**
 * Thumbnail Routes
 * Author: Param Panchal (Searchr)
 */

const router = require('express').Router();
const thumbnailController = require('../controllers/thumbnailController');

// GET  /thumbnail         — Render thumbnail extractor page
router.get('/', thumbnailController.showPage);

// POST /thumbnail/info    — Fetch thumbnail info
router.post('/info', thumbnailController.getInfo);

// GET  /thumbnail/download — Proxy to download thumbnail images safely
router.get('/download', thumbnailController.downloadThumbnail);

module.exports = router;
