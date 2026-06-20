/**
 * Index Route — Home Page
 * Author: Param Panchal (Searchr)
 */

const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Searchr YouTube Downloader' });
});

module.exports = router;
