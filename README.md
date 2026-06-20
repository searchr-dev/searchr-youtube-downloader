# Searchr YouTube Downloader

Searchr YouTube Downloader is a premium, full-stack Node.js & Express application designed with a stunning dark glassmorphism interface. It allows you to download YouTube videos in various qualities, extract audio streams directly to MP3 or M4A formats, crop and download custom timestamp clips, and record active live streams.

---

## Developer Credit

- **Developer Name**: Param Panchal
- **Brand**: Searchr
- **Instagram**: [@_`searchr`_](https://instagram.com/_searchr_)
- **Role**: Full Stack Developer / Designer / Video Editor / Content Creator

---

## Key Features

1. **Video Downloader**: 
   - Paste a YouTube URL to retrieve metadata.
   - Choose from a wide range of resolutions: 144p, 240p, 360p, 480p, 720p, 1080p, and Best quality options.
   - Inspect codecs, bitrates, file sizes, formats, and frame rates.
   
2. **Audio Extractor**:
   - Extract MP3 (Universal, up to 320 kbps) or M4A (Apple format, up to 192 kbps) audio.
   - Fast background processing utilizing FFmpeg.

3. **Timestamp Clipper**:
   - Download a select range of a video.
   - Set custom start and end times in `HH:MM:SS` format.
   - Download the clipped segment as video (MP4) or audio (MP3).

4. **Live Stream Downloader**:
   - Auto-detect live broadcast links.
   - Download real-time broadcasts.
   - Set duration limits for stream recording (e.g. 5 minutes, 1 hour).

5. **Download History**:
   - Clean interface displaying recent downloads.
   - Filter by type (Video, Audio, Clip, Live).
   - Single item removal and complete history clearing.

6. **Premium Glassmorphism Dark Theme**:
   - Immersive floating background orbs.
   - Seamless hover gradients, transitions, and pulsing indicator elements.
   - Optimized mobile-first layout with Bootstrap 5.

---

## Technical Stack

- **Backend**: Node.js, Express.js
- **Media Engine**: FFmpeg (Clipping, extraction, formatting), yt-dlp (Metadata fetching, streaming)
- **Frontend**: EJS Template Engine, Bootstrap 5, Font Awesome, Custom Vanilla JavaScript & CSS

---

## Folder Architecture

```text
yt-down/
├── data/
│   └── history.json            # JSON based download history log
├── downloads/                  # Temporary file processing & output target
├── controllers/
│   ├── audioController.js      # Handles audio routing logic
│   ├── clipController.js       # Handles timestamp cropping logic
│   ├── historyController.js    # Handles history logs management
│   ├── liveController.js       # Handles live stream checking/recording
│   └── videoController.js      # Handles standard video downloads logic
├── public/
│   ├── css/
│   │   └── style.css           # Premium glassmorphism design styles
│   └── js/
│       ├── app.js              # Common helpers & toast notifications
│       ├── audio.js            # Extractor interactivity
│       ├── clip.js             # Clipper validations & range selectors
│       ├── history.js          # Deletion & filter transitions
│       ├── live.js             # Live stream parameters & timers
│       └── video.js            # Presets, tables & downloads initiator
├── routes/
│   ├── audio.js
│   ├── clip.js
│   ├── history.js
│   ├── index.js
│   ├── live.js
│   └── video.js
├── services/
│   ├── downloadService.js      # Path gen, sizing & timestamp conversion helpers
│   ├── ffmpegService.js        # Spawn FFmpeg child processes for trimming/conversion
│   ├── historyService.js       # history.json IO helper
│   └── ytdlpService.js         # Spawn yt-dlp child processes for streams
├── views/
│   ├── partials/
│   │   ├── footer.ejs
│   │   └── navbar.ejs
│   ├── about.ejs
│   ├── audio.ejs
│   ├── clip.ejs
│   ├── history.ejs
│   ├── index.ejs
│   ├── layout.ejs
│   ├── live.ejs
│   └── video.ejs
├── .env                        # Configuration file
├── server.js                   # Application bootstrap entry
├── package.json
└── setup.md                    # In-depth setup walkthrough
```

---

## Quick Start

For detailed step-by-step instructions to download binary dependencies (like `FFmpeg` and `yt-dlp`), please read [setup.md](file:///p:/Projects/Node%20JS%20Projects/yt-down/setup.md).

1. Install Node modules:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.
