/**
 * Video Controller
 * 
 * Handles video page rendering, info fetching, and download initiation.
 * 
 * Author: Param Panchal (Searchr)
 */

const ytdlp = require('../services/ytdlpService');
const downloadService = require('../services/downloadService');
const historyService = require('../services/historyService');
const path = require('path');
const fs = require('fs');

/**
 * Renders the video downloader page.
 */
exports.showPage = (req, res) => {
  res.render('video', { title: 'Video Downloader — Searchr' });
};

/**
 * Fetches video info and available formats for a given URL.
 * POST /video/info  Body: { url }
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
    console.error('Video info error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Downloads a video in the specified format.
 * GET /video/download?url=...&formatId=...&title=...&quality=...
 */
exports.download = async (req, res) => {
  try {
    const { url, formatId, title, quality, thumbnail } = req.query;

    if (!url || !formatId) {
      return res.status(400).json({ success: false, error: 'Missing URL or format ID.' });
    }

    const outputPath = downloadService.generateOutputPath(title || 'video', 'mp4', quality || 'best');

    // Spawn yt-dlp download with best audio merged
    const proc = ytdlp.downloadBestVideo(url, formatId, outputPath);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('Download failed:', stderr.slice(-500));
        downloadService.cleanupFile(outputPath);
        // Check if headers already sent
        if (!res.headersSent) {
          return res.status(500).json({ success: false, error: 'Download failed. Please try again.' });
        }
        return;
      }

      // Record in history
      historyService.addEntry({
        url, title, quality: quality || 'Best', type: 'video', format: 'mp4', thumbnail
      });

      // Stream file to client
      const finalPath = fs.existsSync(outputPath) ? outputPath : outputPath.replace('.mp4', '.mkv');
      
      // Find the actual output file (yt-dlp may change extension)
      const dir = path.dirname(outputPath);
      const baseName = path.basename(outputPath, path.extname(outputPath));
      const files = fs.readdirSync(dir).filter(f => f.startsWith(baseName));
      const actualFile = files.length > 0 ? path.join(dir, files[0]) : outputPath;

      if (!fs.existsSync(actualFile)) {
        return res.status(500).json({ success: false, error: 'Download completed but file not found.' });
      }

      const stat = fs.statSync(actualFile);
      const ext = path.extname(actualFile);

      if (req.query.cookieToken) {
        res.cookie('downloadToken', req.query.cookieToken, { maxAge: 60000, httpOnly: false });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(actualFile))}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);

      const readStream = fs.createReadStream(actualFile);
      readStream.pipe(res);
      readStream.on('end', () => {
        // Cleanup downloaded file after sending
        downloadService.cleanupFile(actualFile);
      });
    });

    proc.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: `Failed to start download: ${err.message}` });
      }
    });

  } catch (err) {
    console.error('Video download error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
