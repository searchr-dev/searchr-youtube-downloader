/**
 * FFmpeg Service
 * 
 * Handles video trimming, audio extraction, format conversion,
 * and live-stream recording via FFmpeg child processes.
 * 
 * Author: Param Panchal (Searchr)
 */

const { spawn } = require('child_process');
const path = require('path');

// Path to ffmpeg binary (from .env or system PATH)
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

/**
 * Trims a video/audio file to a specific time range.
 * @param {string} inputPath  - Path to input file
 * @param {string} outputPath - Path to output file
 * @param {string} startTime  - Start time in HH:MM:SS or seconds
 * @param {string} endTime    - End time in HH:MM:SS or seconds
 * @returns {Promise<string>}   Resolves with output path on success
 */
function trimVideo(inputPath, outputPath, startTime, endTime) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',                    // Overwrite output
      '-i', inputPath,         // Input file
      '-ss', startTime,        // Start time
      '-to', endTime,          // End time
      '-c', 'copy',            // Copy codec (fast, no re-encode)
      '-avoid_negative_ts', '1',
      outputPath
    ];

    console.log(`✂️  FFmpeg trim: ${FFMPEG} ${args.join(' ')}`);

    const proc = spawn(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg trim failed (code ${code}): ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg not found or failed to start: ${err.message}`));
    });
  });
}

/**
 * Extracts audio from a video file.
 * @param {string} inputPath  - Path to input video
 * @param {string} outputPath - Path to output audio file
 * @param {string} format     - Output format ('mp3' or 'm4a')
 * @returns {Promise<string>}   Resolves with output path
 */
function extractAudio(inputPath, outputPath, format = 'mp3') {
  return new Promise((resolve, reject) => {
    const codecMap = {
      mp3: ['libmp3lame', '-q:a', '0'],
      m4a: ['aac', '-b:a', '192k']
    };
    const [codec, ...codecArgs] = codecMap[format] || codecMap.mp3;

    const args = [
      '-y',
      '-i', inputPath,
      '-vn',                   // No video
      '-acodec', codec,
      ...codecArgs,
      outputPath
    ];

    console.log(`🎵 FFmpeg extract audio: ${FFMPEG} ${args.join(' ')}`);

    const proc = spawn(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg audio extraction failed (code ${code}): ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg not found: ${err.message}`));
    });
  });
}

/**
 * Records a live stream for a specified duration.
 * @param {string} streamUrl  - Direct stream URL or YouTube URL
 * @param {string} outputPath - Output file path
 * @param {number} duration   - Duration in seconds
 * @returns {Promise<string>}
 */
function recordStream(streamUrl, outputPath, duration) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', streamUrl,
      '-t', String(duration),
      '-c', 'copy',
      outputPath
    ];

    console.log(`📡 FFmpeg record: ${FFMPEG} ${args.join(' ')}`);

    const proc = spawn(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg recording failed (code ${code}): ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg not found: ${err.message}`));
    });
  });
}

/**
 * Parses FFmpeg progress output to extract percentage (if total duration known).
 * @param {string} stderrLine - A line from FFmpeg stderr
 * @param {number} totalDuration - Total duration in seconds
 * @returns {number|null} Progress percentage or null
 */
function parseProgress(stderrLine, totalDuration) {
  const timeMatch = stderrLine.match(/time=(\d+):(\d+):(\d+\.\d+)/);
  if (timeMatch && totalDuration > 0) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseFloat(timeMatch[3]);
    const current = hours * 3600 + minutes * 60 + seconds;
    return Math.min(Math.round((current / totalDuration) * 100), 100);
  }
  return null;
}

module.exports = {
  trimVideo,
  extractAudio,
  recordStream,
  parseProgress
};
