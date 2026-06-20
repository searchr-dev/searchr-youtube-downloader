/**
 * yt-dlp Service
 * 
 * Wraps yt-dlp CLI commands for fetching video info, formats,
 * and initiating downloads via child_process.
 * 
 * Author: Param Panchal (Searchr)
 */

const { spawn, execFile } = require('child_process');
const path = require('path');

// Path to yt-dlp binary (from .env or system PATH)
const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';

/**
 * Validates a YouTube URL format.
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidYouTubeUrl(url) {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|live\/|shorts\/)|youtu\.be\/)/;
  return pattern.test(url);
}

/**
 * Fetches complete video information as JSON from yt-dlp.
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} Parsed video info JSON
 */
function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    if (!isValidYouTubeUrl(url)) {
      return reject(new Error('Invalid YouTube URL'));
    }

    const args = [
      '--dump-json',        // Output info as JSON
      '--no-warnings',      // Suppress warnings
      '--no-playlist',      // Single video only
      '--skip-download',    // Don't download
      '--js-runtimes', 'node', // Solve signature challenges using node
      url
    ];

    execFile(YTDLP, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error('yt-dlp error:', stderr);
        return reject(new Error(`yt-dlp failed: ${stderr || error.message}`));
      }
      try {
        const info = JSON.parse(stdout);
        resolve(info);
      } catch (parseErr) {
        reject(new Error('Failed to parse yt-dlp output'));
      }
    });
  });
}

/**
 * Extracts and categorizes available formats from video info.
 * @param {Object} info - Raw yt-dlp info JSON
 * @returns {Object} Categorized formats { video, audio, muxed }
 */
function categorizeFormats(info) {
  const formats = info.formats || [];

  const video = [];
  const audio = [];
  const muxed = [];

  formats.forEach(f => {
    const entry = {
      formatId: f.format_id,
      ext: f.ext,
      resolution: f.resolution || 'N/A',
      width: f.width || null,
      height: f.height || null,
      fps: f.fps || null,
      vcodec: f.vcodec && f.vcodec !== 'none' ? f.vcodec : null,
      acodec: f.acodec && f.acodec !== 'none' ? f.acodec : null,
      filesize: f.filesize || f.filesize_approx || null,
      tbr: f.tbr || null,          // Total bitrate
      vbr: f.vbr || null,          // Video bitrate
      abr: f.abr || null,          // Audio bitrate
      format_note: f.format_note || '',
      protocol: f.protocol || ''
    };

    const hasVideo = entry.vcodec !== null;
    const hasAudio = entry.acodec !== null;

    if (hasVideo && hasAudio) {
      muxed.push(entry);
    } else if (hasVideo) {
      video.push(entry);
    } else if (hasAudio) {
      audio.push(entry);
    }
  });

  // Sort video by height descending
  video.sort((a, b) => (b.height || 0) - (a.height || 0));
  // Sort audio by bitrate descending
  audio.sort((a, b) => (b.abr || 0) - (a.abr || 0));
  // Sort muxed by height descending
  muxed.sort((a, b) => (b.height || 0) - (a.height || 0));

  return { video, audio, muxed };
}

/**
 * Gets parsed and categorized info for a YouTube URL.
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} { title, thumbnail, duration, isLive, formats, ... }
 */
async function getFormattedInfo(url) {
  const info = await getVideoInfo(url);
  const formats = categorizeFormats(info);

  return {
    id: info.id,
    title: info.title || 'Untitled',
    thumbnail: info.thumbnail || info.thumbnails?.[info.thumbnails.length - 1]?.url || '',
    duration: info.duration || 0,
    durationString: info.duration_string || '0:00',
    uploader: info.uploader || 'Unknown',
    viewCount: info.view_count || 0,
    uploadDate: info.upload_date || '',
    isLive: info.is_live || false,
    wasLive: info.was_live || false,
    description: (info.description || '').substring(0, 300),
    thumbnails: info.thumbnails || [],
    formats
  };
}

/**
 * Spawns a yt-dlp download process and returns the child process.
 * @param {string} url - YouTube URL
 * @param {string} formatId - yt-dlp format ID
 * @param {string} outputPath - Output file path
 * @param {Object} [opts] - Additional options
 * @returns {ChildProcess}
 */
function spawnDownload(url, formatId, outputPath, opts = {}) {
  const args = [
    '-f', formatId,
    '-o', outputPath,
    '--no-playlist',
    '--no-warnings',
    '--newline',         // Progress on new lines for parsing
    '--js-runtimes', 'node'
  ];

  if (process.env.FFMPEG_PATH) {
    args.push('--ffmpeg-location', process.env.FFMPEG_PATH);
  }

  // Merge audio+video if format is video-only
  if (opts.mergeAudio) {
    args.push('--merge-output-format', opts.mergeFormat || 'mp4');
  }

  // Audio extraction
  if (opts.extractAudio) {
    args.push('-x', '--audio-format', opts.audioFormat || 'mp3');
  }

  // Timestamp range (post-processing)
  if (opts.startTime || opts.endTime) {
    const ppArgs = [];
    if (opts.startTime) ppArgs.push(`-ss ${opts.startTime}`);
    if (opts.endTime) ppArgs.push(`-to ${opts.endTime}`);
    args.push('--postprocessor-args', `ffmpeg:${ppArgs.join(' ')}`);
  }

  // Live stream duration limit
  if (opts.duration) {
    args.push('--live-from-start');
    args.push('--postprocessor-args', `ffmpeg:-t ${opts.duration}`);
  }

  args.push(url);

  console.log(`🚀 yt-dlp spawned: ${YTDLP} ${args.join(' ')}`);
  return spawn(YTDLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * Downloads best video+audio merged into mp4.
 * @param {string} url 
 * @param {string} formatId 
 * @param {string} outputPath 
 * @returns {ChildProcess}
 */
function downloadBestVideo(url, formatId, outputPath) {
  const args = [
    '-f', `${formatId}+bestaudio/best`,
    '--merge-output-format', 'mp4',
    '-o', outputPath,
    '--no-playlist',
    '--no-warnings',
    '--newline',
    '--js-runtimes', 'node'
  ];

  if (process.env.FFMPEG_PATH) {
    args.push('--ffmpeg-location', process.env.FFMPEG_PATH);
  }

  args.push(url);

  console.log(`🚀 yt-dlp best video: ${YTDLP} ${args.join(' ')}`);
  return spawn(YTDLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * Downloads audio only in specified format.
 * @param {string} url 
 * @param {string} audioFormat - 'mp3' or 'm4a'
 * @param {string} outputPath 
 * @returns {ChildProcess}
 */
function downloadAudio(url, audioFormat, outputPath) {
  const args = [
    '-x',
    '--audio-format', audioFormat,
    '--audio-quality', '0',   // Best quality
    '-o', outputPath,
    '--no-playlist',
    '--no-warnings',
    '--newline',
    '--js-runtimes', 'node'
  ];

  if (process.env.FFMPEG_PATH) {
    args.push('--ffmpeg-location', process.env.FFMPEG_PATH);
  }

  args.push(url);

  console.log(`🎵 yt-dlp audio: ${YTDLP} ${args.join(' ')}`);
  return spawn(YTDLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * Downloads a live stream.
 * @param {string} url 
 * @param {string} outputPath 
 * @param {Object} [opts] - { duration }
 * @returns {ChildProcess}
 */
function downloadLiveStream(url, outputPath, opts = {}) {
  const args = [
    '-f', 'best',
    '-o', outputPath,
    '--no-playlist',
    '--no-warnings',
    '--newline',
    '--js-runtimes', 'node'
  ];

  if (process.env.FFMPEG_PATH) {
    args.push('--ffmpeg-location', process.env.FFMPEG_PATH);
  }

    if (opts.fromStart) {
    args.push('--live-from-start');
  }

  args.push(url);

  console.log(`📡 yt-dlp live: ${YTDLP} ${args.join(' ')}`);
  return spawn(YTDLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * Downloads a specific section of a video directly.
 * @param {string} url 
 * @param {string} startTime - HH:MM:SS or seconds
 * @param {string} endTime - HH:MM:SS or seconds
 * @param {string} quality - 'best', '1080', '720', etc.
 * @param {boolean} isAudioOnly 
 * @param {string} outputPath 
 * @returns {ChildProcess}
 */
function downloadClip(url, startTime, endTime, quality, isAudioOnly, outputPath) {
  // To allow >720p clips (like 4K/1080p), we must use 'bestvideo+bestaudio' because 'b' maxes at 720p.
  // We prioritize ext=mp4 for video to reduce the chance of ffmpeg hanging on AV1/WebM DASH streams.
  const formatSpec = isAudioOnly 
    ? 'bestaudio/best'
    : (quality === 'best' 
        ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/b/best'
        : `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${quality}]+bestaudio/b[height<=${quality}]/best`);

  const args = [
    '-f', formatSpec,
    '--download-sections', `*${startTime}-${endTime}`,
    '--force-keyframes-at-cuts',
    '-o', outputPath,
    '--no-playlist',
    '--no-warnings',
    '--newline',
    '--js-runtimes', 'node'
  ];

  if (process.env.FFMPEG_PATH) {
    args.push('--ffmpeg-location', process.env.FFMPEG_PATH);
  }

  if (isAudioOnly) {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    args.push('--merge-output-format', 'mp4');
  }

  args.push(url);

  console.log(`🚀 yt-dlp clip: ${YTDLP} ${args.join(' ')}`);
  return spawn(YTDLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

module.exports = {
  isValidYouTubeUrl,
  getVideoInfo,
  getFormattedInfo,
  categorizeFormats,
  spawnDownload,
  downloadBestVideo,
  downloadAudio,
  downloadLiveStream,
  downloadClip
};
