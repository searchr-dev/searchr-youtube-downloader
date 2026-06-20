/**
 * Live Stream Controller
 * 
 * Handles live-stream detection, recording, and download.
 * 
 * Author: Param Panchal (Searchr)
 */

const ytdlp = require('../services/ytdlpService');
const downloadService = require('../services/downloadService');
const historyService = require('../services/historyService');
const path = require('path');
const fs = require('fs');

/**
 * Renders the live stream downloader page.
 */
exports.showPage = (req, res) => {
  res.render('live', { title: 'Live Stream Downloader — Searchr' });
};

/**
 * Fetches live stream info and detects if URL is live.
 * POST /live/info  Body: { url }
 */
exports.getInfo = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !ytdlp.isValidYouTubeUrl(url)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid YouTube URL.' });
    }

    const info = await ytdlp.getFormattedInfo(url);

    res.json({
      success: true,
      data: {
        ...info,
        liveStatus: info.isLive ? 'live' : (info.wasLive ? 'was_live' : 'not_live')
      }
    });
  } catch (err) {
    console.error('Live info error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Downloads / records a live stream.
 * GET /live/download?url=...&duration=...&title=...&fromStart=true
 * 
 * If duration is provided, yt-dlp will record for that many seconds.
 * If fromStart is true, recording starts from the beginning of the stream.
 */
exports.download = async (req, res) => {
  try {
    const { url, duration, title, fromStart, thumbnail } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, error: 'Missing URL.' });
    }

    const outputPath = downloadService.generateOutputPath(
      title || 'livestream', 'mp4', 'live'
    );

    const proc = ytdlp.downloadLiveStream(url, outputPath, {
      fromStart: fromStart === 'true'
    });

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    // If a duration is specified, kill the process after that time
    let killTimer = null;
    if (duration) {
      const durationMs = parseInt(duration) * 1000;
      if (durationMs > 0 && durationMs <= 3600000) { // Max 1 hour
        killTimer = setTimeout(() => {
          console.log(`⏰ Duration limit reached (${duration}s), stopping recording...`);
          proc.kill('SIGINT'); // Graceful stop
        }, durationMs);
      }
    }

    proc.on('close', (code) => {
      if (killTimer) clearTimeout(killTimer);

      // For live streams, yt-dlp may exit with non-zero on SIGINT — that's OK
      // Find the output file
      const dir = path.dirname(outputPath);
      const baseName = path.basename(outputPath, path.extname(outputPath));
      const files = fs.readdirSync(dir).filter(f => f.startsWith(baseName));
      const actualFile = files.length > 0 ? path.join(dir, files[0]) : outputPath;

      if (!fs.existsSync(actualFile)) {
        if (!res.headersSent) {
          return res.status(500).json({ success: false, error: 'Recording failed — no output file.' });
        }
        return;
      }

      // Record in history
      historyService.addEntry({
        url, title,
        quality: duration ? `${duration}s recording` : 'Live Stream',
        type: 'live',
        format: 'mp4',
        thumbnail
      });

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
      if (killTimer) clearTimeout(killTimer);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: `Failed to start: ${err.message}` });
      }
    });

  } catch (err) {
    console.error('Live download error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
