/**
 * Clip Controller
 * 
 * Handles timestamp-based video/audio clipping using yt-dlp + FFmpeg.
 * 
 * Author: Param Panchal (Searchr)
 */

const ytdlp = require('../services/ytdlpService');
const ffmpeg = require('../services/ffmpegService');
const downloadService = require('../services/downloadService');
const historyService = require('../services/historyService');
const path = require('path');
const fs = require('fs');

/**
 * Renders the timestamp downloader page.
 */
exports.showPage = (req, res) => {
  res.render('clip', { title: 'Timestamp Downloader — Searchr' });
};

/**
 * Fetches video info for clip selection.
 * POST /clip/info  Body: { url }
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
    console.error('Clip info error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Downloads a clipped segment of a video.
 * GET /clip/download?url=...&startTime=...&endTime=...&type=video|audio&title=...
 * 
 * Strategy: Download full video first, then trim with FFmpeg.
 * This ensures accurate cuts.
 */
exports.download = async (req, res) => {
  let outputPath = null;

  try {
    const { url, startTime, endTime, type, quality, title, thumbnail } = req.query;

    if (!url || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing URL, start time, or end time.'
      });
    }

    const isAudioOnly = type === 'audio';
    const ext = isAudioOnly ? 'mp3' : 'mp4';
    const clipLabel = `${startTime.replace(/:/g, '')}-${endTime.replace(/:/g, '')}`;

    outputPath = downloadService.generateOutputPath(
      title || 'clip', ext, `clip_${clipLabel}`
    );

    // Download and trim section directly
    const proc = ytdlp.downloadClip(url, startTime, endTime, quality || 'best', isAudioOnly, outputPath);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', async (code) => {
      if (code !== 0) {
        console.error('Clip download failed:', stderr.slice(-500));
        downloadService.cleanupFile(outputPath);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, error: 'Failed to download and trim clip.' });
        }
        return;
      }

      try {
        // Record in history
        historyService.addEntry({
          url, title,
          quality: `Clip ${startTime}–${endTime} (${isAudioOnly ? 'MP3' : (quality || 'best') + 'p'})`,
          type: 'clip',
          format: ext,
          thumbnail
        });

        // Stream to client
        if (!fs.existsSync(outputPath)) {
          return res.status(500).json({ success: false, error: 'Clip created but file not found.' });
        }

        const stat = fs.statSync(outputPath);

        if (req.query.cookieToken) {
          res.cookie('downloadToken', req.query.cookieToken, { maxAge: 60000, httpOnly: false });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(outputPath))}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', stat.size);

        const readStream = fs.createReadStream(outputPath);
        readStream.pipe(res);
        readStream.on('end', () => {
          downloadService.cleanupFile(outputPath);
        });

      } catch (err) {
        console.error('Clip streaming error:', err.message);
        downloadService.cleanupFile(outputPath);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: `Clip streaming failed: ${err.message}` });
        }
      }
    });

    proc.on('error', (err) => {
      downloadService.cleanupFile(outputPath);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: `Failed to start: ${err.message}` });
      }
    });

    req.on('close', () => {
      if (proc && !proc.killed) {
        console.log('Client aborted clip download. Killing yt-dlp process.');
        proc.kill('SIGTERM');
        // Give it a moment to terminate, then fallback to SIGKILL
        setTimeout(() => {
          if (!proc.killed) proc.kill('SIGKILL');
        }, 1000);
      }
    });

  } catch (err) {
    console.error('Clip download error:', err.message);
    if (outputPath) downloadService.cleanupFile(outputPath);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
