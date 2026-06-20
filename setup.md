# Searchr YouTube Downloader Setup Guide

Follow this guide to get **Searchr YouTube Downloader** running locally.

> [!NOTE]
> **Local Binaries Configured**: I have already successfully extracted `yt-dlp.exe` and `ffmpeg.exe` inside your project root and configured the absolute paths in your `.env` file. You can skip standard installation and go straight to **[Application Setup](#application-setup)**.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Node.js** (v16 or higher recommended)
2. **NPM** (normally bundled with Node.js)
3. **FFmpeg** (Configured locally in project folder)
4. **yt-dlp** (Configured locally in project folder)

---

## Installing Prerequisites

### 1. Install FFmpeg
- **Windows**:
  1. Download the build zip from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) (e.g. `ffmpeg-release-essentials.zip`).
  2. Extract it to a folder (e.g., `C:\ffmpeg`).
  3. Copy the path to the `bin` directory (`C:\ffmpeg\bin`).
  4. Search for "Edit the system environment variables" in Windows.
  5. Edit the `Path` variable under User/System variables and paste the path.
  6. Verify by opening PowerShell and running: `ffmpeg -version`

- **macOS** (via Homebrew):
  ```bash
  brew install ffmpeg
  ```

- **Linux** (Debian/Ubuntu):
  ```bash
  sudo apt update && sudo apt install ffmpeg
  ```

---

### 2. Install yt-dlp
- **Windows**:
  1. Download the latest `yt-dlp.exe` binary from [yt-dlp releases GitHub](https://github.com/yt-dlp/yt-dlp/releases).
  2. Move it to a dedicated folder (e.g., `C:\yt-dlp`).
  3. Add this folder path to your system's Environment `Path` variable (same steps as FFmpeg).
  4. Verify by running in PowerShell: `yt-dlp --version`

- **macOS** (via Homebrew):
  ```bash
  brew install yt-dlp
  ```

- **Linux/Unix**:
  ```bash
  sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
  sudo chmod a+rx /usr/local/bin/yt-dlp
  ```

---

## Application Setup

1. **Open Project Folder**:
   Open a terminal/PowerShell window inside the project directory: `p:\Projects\Node JS Projects\yt-down`

2. **Configure Environment Variables**:
   Check the [.env](file:///p:/Projects/Node%20JS%20Projects/yt-down/.env) file. It contains the paths to the local executables:
   ```env
   PORT=3000
   YTDLP_PATH=p:\Projects\Node JS Projects\yt-down\yt-dlp.exe
   FFMPEG_PATH=p:\Projects\Node JS Projects\yt-down\ffmpeg.exe
   DOWNLOAD_DIR=./downloads
   ```

3. **Install Node.js Dependencies**:
   Execute the following command to install the required express, templates, and layouts modules:
   ```bash
   npm install
   ```

4. **Run the Application**:
   - **Production Mode**:
     ```bash
     npm start
     ```
   - **Development Mode** (auto-restart using nodemon):
     ```bash
     npm run dev
     ```

5. **Access the App**:
   Open your browser and navigate to: `http://localhost:3000`
