#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Node.js dependencies
npm install

# Create a directory to store Linux binaries
mkdir -p bin

# 1. Download the Linux version of yt-dlp
echo "Downloading yt-dlp for Linux..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp
chmod a+rx bin/yt-dlp

# 2. Download the Linux version of FFmpeg
echo "Downloading FFmpeg static build..."
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz

# Move the binaries into the bin folder
mv ffmpeg-*-amd64-static/ffmpeg bin/
mv ffmpeg-*-amd64-static/ffprobe bin/

# Clean up temporary archive files
rm -rf ffmpeg.tar.xz ffmpeg-*-amd64-static

echo "Build complete! Linux binaries installed in ./bin"
