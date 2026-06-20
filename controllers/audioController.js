/**
 * Audio Controller
 * 
 * Handles audio extraction page, info fetching, and MP3/M4A download.
 * 
 * Author: Param Panchal (Searchr)
 */

const ytdlp = require('../services/ytdlpService');
const downloadService = require('../services/downloadService');
const historyService = require('../services/historyService');
const path = require('path');
const fs = require('fs');

/**
 * Renders the audio downloader page.
 */
exports.showPage = (req, res) => {
  res.render('audio', { title: 'Audio Extractor — Searchr' });
};

/**
 * Fetches audio format info for a given URL.
 * POST /audio/info  Body: { url }
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
    console.error('Audio info error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Downloads audio in specified format (mp3 or m4a).
 * GET /audio/download?url=...&format=mp3&title=...
 */
exports.download = async (req, res) => {
  try {
    const { url, format, title, thumbnail } = req.query;
    const audioFormat = format === 'm4a' ? 'm4a' : 'mp3';

    if (!url) {
      return res.status(400).json({ success: false, error: 'Missing URL.' });
    }

    const outputPath = downloadService.generateOutputPath(
      title || 'audio', audioFormat, audioFormat
    );

    const proc = ytdlp.downloadAudio(url, audioFormat, outputPath);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('Audio download failed:', stderr.slice(-500));
        downloadService.cleanupFile(outputPath);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, error: 'Audio extraction failed.' });
        }
        return;
      }

      // Record in history
      historyService.addEntry({
        url, title, quality: 'Best Audio', type: 'audio', format: audioFormat, thumbnail
      });

      // Find the actual output file
      const dir = path.dirname(outputPath);
      const baseName = path.basename(outputPath, path.extname(outputPath));
      const files = fs.readdirSync(dir).filter(f => f.startsWith(baseName));
      const actualFile = files.length > 0 ? path.join(dir, files[0]) : outputPath;

      if (!fs.existsSync(actualFile)) {
        return res.status(500).json({ success: false, error: 'Audio extracted but file not found.' });
      }

      const stat = fs.statSync(actualFile);

      if (req.query.cookieToken) {
        res.cookie('downloadToken', req.query.cookieToken, { maxAge: 60000, httpOnly: false });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(actualFile))}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);

      const readStream = fs.createReadStream(actualFile);
      readStream.pipe(res);
      readStream.on('end', () => {
        downloadService.cleanupFile(actualFile);
      });
    });

    proc.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: `Failed to start: ${err.message}` });
      }
    });

  } catch (err) {
    console.error('Audio download error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

/**
 * Proxies a thumbnail image download to bypass CORS restrictions.
 * GET /audio/thumbnail?url=...&quality=...
 */
exports.downloadThumbnail = (req, res) => {
  const { url: imgUrl, quality } = req.query;

  if (!imgUrl) {
    return res.status(400).send('Missing image URL');
  }

  const https = require('https');
  
  https.get(imgUrl, (response) => {
    if (response.statusCode !== 200) {
      return res.status(response.statusCode).send('Failed to fetch image');
    }

    // Set appropriate headers for downloading
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    const filename = `thumbnail_${quality || 'default'}.${ext}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);

    response.pipe(res);
  }).on('error', (err) => {
    console.error('Thumbnail proxy error:', err.message);
    res.status(500).send('Error proxying thumbnail: ' + err.message);
  });
};
