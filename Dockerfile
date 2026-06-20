FROM node:20-slim

# Install system dependencies (ffmpeg, python3, wget)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Download and install the latest Linux yt-dlp binary
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Override env vars so the server automatically looks in the system PATH
ENV YTDLP_PATH=yt-dlp
ENV FFMPEG_PATH=ffmpeg
ENV PORT=7860
ENV DOWNLOAD_DIR=./downloads

EXPOSE 7860

CMD ["node", "server.js"]
