/**
 * Download Service
 * 
 * Coordinates yt-dlp and FFmpeg services to manage downloads,
 * generate safe filenames, and handle temporary files.
 * 
 * Author: Param Panchal (Searchr)
 */

const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const { v4: uuidv4 } = require('uuid');

// Download directory from .env
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || './downloads';

/**
 * Generates a safe, unique filename for a download.
 * @param {string} title - Video title
 * @param {string} ext   - File extension (e.g., 'mp4', 'mp3')
 * @param {string} [suffix] - Optional suffix (e.g., 'clip', '720p')
 * @returns {string} Full path to the output file
 */
function generateOutputPath(title, ext, suffix = '') {
  // Sanitize the title for filesystem safety
  let safeName = sanitize(title || 'download').substring(0, 100);
  if (suffix) safeName += `_${suffix}`;
  safeName += `_${Date.now()}`;
  
  const filename = `${safeName}.${ext}`;
  return path.resolve(DOWNLOAD_DIR, filename);
}

/**
 * Generates a temporary file path for intermediate processing.
 * @param {string} ext - File extension
 * @returns {string}
 */
function generateTempPath(ext) {
  return path.resolve(DOWNLOAD_DIR, `temp_${uuidv4()}.${ext}`);
}

/**
 * Cleans up a temporary file (fire-and-forget).
 * @param {string} filePath 
 */
function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🧹 Cleaned up: ${filePath}`);
    }
  } catch (err) {
    console.error(`⚠️  Cleanup failed for ${filePath}:`, err.message);
  }
}

/**
 * Gets file size in bytes, or null if file doesn't exist.
 * @param {string} filePath 
 * @returns {number|null}
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return null;
  }
}

/**
 * Formats bytes into a human-readable string.
 * @param {number} bytes 
 * @returns {string}
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Formats duration in seconds to HH:MM:SS string.
 * @param {number} seconds 
 * @returns {string}
 */
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Parses a time string (HH:MM:SS or MM:SS or SS) into total seconds.
 * @param {string} timeStr 
 * @returns {number}
 */
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

module.exports = {
  generateOutputPath,
  generateTempPath,
  cleanupFile,
  getFileSize,
  formatBytes,
  formatDuration,
  parseTimeToSeconds,
  DOWNLOAD_DIR
};
