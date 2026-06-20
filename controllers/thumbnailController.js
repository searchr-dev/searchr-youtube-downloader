/**
 * Thumbnail Controller
 * 
 * Handles thumbnail extraction page, info fetching, and downloading.
 * 
 * Author: Param Panchal (Searchr)
 */

const ytdlp = require('../services/ytdlpService');
const historyService = require('../services/historyService');
const https = require('https');

/**
 * Renders the thumbnail downloader page.
 */
exports.showPage = (req, res) => {
  res.render('thumbnail', { title: 'Thumbnail Downloader — Searchr' });
};

/**
 * Fetches thumbnail info for a given URL.
 * POST /thumbnail/info  Body: { url }
 */
exports.getInfo = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !ytdlp.isValidYouTubeUrl(url)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid YouTube URL.' });
    }

    const info = await ytdlp.getFormattedInfo(url);
    res.json({ success: true, data: info });
  } catch (err) {
    console.error('Thumbnail info error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Proxies a thumbnail image download to bypass CORS restrictions.
 * GET /thumbnail/download?url=...&quality=...&title=...
 */
exports.downloadThumbnail = (req, res) => {
  const { url: imgUrl, quality, title } = req.query;

  if (!imgUrl) {
    return res.status(400).send('Missing image URL');
  }

  https.get(imgUrl, (response) => {
    if (response.statusCode !== 200) {
      return res.status(response.statusCode).send('Failed to fetch image');
    }

    // Set appropriate headers for downloading
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    
    // Sanitize title for filename
    const safeTitle = (title || 'thumbnail').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}_${quality || 'default'}.${ext}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);

    // Record in history if title exists (meaning it's a direct user download)
    if (title) {
      historyService.addEntry({
        url: 'https://youtube.com', // generic as we don't pass full url here easily, though we could
        title, 
        quality: quality || 'Thumbnail', 
        type: 'thumbnail', 
        format: ext, 
        thumbnail: imgUrl
      });
    }

    response.pipe(res);
  }).on('error', (err) => {
    console.error('Thumbnail proxy error:', err.message);
    res.status(500).send('Error proxying thumbnail: ' + err.message);
  });
};
