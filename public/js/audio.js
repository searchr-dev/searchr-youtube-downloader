/**
 * Audio Extractor Page Script
 * 
 * Author: Param Panchal (Searchr)
 */

document.addEventListener('DOMContentLoaded', () => {
  const audioUrlInput = document.getElementById('audioUrl');
  const fetchAudioBtn = document.getElementById('fetchAudioBtn');
  const audioLoading = document.getElementById('audioLoading');
  const audioInfoCard = document.getElementById('audioInfoCard');
  const audioFormatsBody = document.getElementById('audioFormatsBody');

  const audioThumb = document.getElementById('audioThumb');
  const audioDuration = document.getElementById('audioDuration');
  const audioTitle = document.getElementById('audioTitle');
  const audioUploader = document.getElementById('audioUploader');

  const mp3Card = document.getElementById('mp3Card');
  const m4aCard = document.getElementById('m4aCard');
  const downloadAudioBtn = document.getElementById('downloadAudioBtn');
  const audioDownloadProgress = document.getElementById('audioDownloadProgress');
  const audioDownloadBar = document.getElementById('audioDownloadBar');
  const audioDownloadStatus = document.getElementById('audioDownloadStatus');

  let currentAudioData = null;
  let selectedFormat = 'mp3';

  // Toggle format selection
  mp3Card.addEventListener('click', () => {
    mp3Card.classList.add('active');
    m4aCard.classList.remove('active');
    selectedFormat = 'mp3';
  });

  m4aCard.addEventListener('click', () => {
    m4aCard.classList.add('active');
    mp3Card.classList.remove('active');
    selectedFormat = 'm4a';
  });

  // Fetch Audio Info
  fetchAudioBtn.addEventListener('click', async () => {
    const url = audioUrlInput.value.trim();
    if (!url) return showToast('Please enter a YouTube URL', 'warning');
    if (!isValidUrl(url)) return showToast('Please enter a valid YouTube URL', 'danger');

    // Reset view
    audioInfoCard.classList.add('d-none');
    audioDownloadProgress.classList.add('d-none');
    audioLoading.classList.remove('d-none');

    try {
      const response = await fetch('/audio/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      audioLoading.classList.add('d-none');

      if (!result.success) {
        return showToast(result.error || 'Failed to fetch audio info', 'danger');
      }

      currentAudioData = result.data;
      displayAudioInfo(currentAudioData);
    } catch (err) {
      audioLoading.classList.add('d-none');
      showToast('Error connecting to the server', 'danger');
    }
  });

  // Enter key support
  audioUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchAudioBtn.click();
  });

  function displayAudioInfo(data) {
    audioThumb.src = data.thumbnail || 'https://placehold.co/640x360?text=No+Thumbnail';
    audioDuration.textContent = data.durationString || formatDuration(data.duration);
    audioTitle.textContent = data.title;
    audioUploader.textContent = data.uploader;

    // Populate the audio streams table
    audioFormatsBody.innerHTML = '';
    const audioStreams = data.formats.audio;

    if (audioStreams.length === 0) {
      audioFormatsBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No dedicated audio streams found.</td></tr>';
    } else {
      audioStreams.forEach(f => {
        const codec = f.acodec ? f.acodec.split('.')[0] : 'N/A';
        const bitrate = f.abr ? Math.round(f.abr) + ' kbps' : 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><code>${codec}</code></td>
          <td>${bitrate}</td>
          <td>${formatSize(f.filesize)}</td>
          <td><span class="format-badge">${f.ext ? f.ext.toUpperCase() : 'N/A'}</span></td>
        `;
        audioFormatsBody.appendChild(row);
      });
    }

    audioInfoCard.classList.remove('d-none');
  }

  // Handle Download Action
  downloadAudioBtn.addEventListener('click', () => {
    if (!currentAudioData) return;

    audioDownloadProgress.classList.remove('d-none');
    audioDownloadProgress.scrollIntoView({ behavior: 'smooth', block: 'center' });

    let progress = 0;
    audioDownloadBar.style.width = '0%';
    audioDownloadBar.textContent = 'Preparing...';
    if (audioDownloadStatus) audioDownloadStatus.textContent = 'Please wait while we extract the audio...';

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.floor(Math.random() * 10) + 1;
        audioDownloadBar.style.width = `${progress}%`;
        audioDownloadBar.textContent = `Extracting audio... ${progress}%`;
      }
    }, 600);

    const cookieToken = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);

    const queryParams = new URLSearchParams({
      url: audioUrlInput.value.trim(),
      format: selectedFormat,
      title: currentAudioData.title,
      thumbnail: currentAudioData.thumbnail,
      cookieToken: cookieToken
    });

    const downloadUrl = `/audio/download?${queryParams.toString()}`;

    // Create a dynamic iframe to download without reloading the page
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    let hasError = false;

    // Poll for the cookie showing successful start
    const pollInterval = setInterval(() => {
      const cookieMatch = document.cookie.match(new RegExp('(^|;)\\s*downloadToken\\s*=\\s*' + cookieToken));
      if (cookieMatch) {
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        audioDownloadBar.style.width = '100%';
        audioDownloadBar.textContent = '100%';
        if (audioDownloadStatus) audioDownloadStatus.textContent = 'Download completed! Your browser will now save the file.';
        showToast('Audio extraction started successfully!', 'success');
        
        // Clear the cookie
        document.cookie = 'downloadToken=; Max-Age=0; path=/';
        
        // Cleanup iframe
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    }, 500);

    iframe.onload = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const bodyText = iframeDoc.body ? iframeDoc.body.innerText : '';
        
        let errorMsg = 'Failed to extract audio.';
        try {
          const json = JSON.parse(bodyText);
          if (json && json.success === false) {
            errorMsg = json.error || errorMsg;
          }
        } catch (e) {
          if (bodyText.includes('Error') || bodyText.includes('Internal Server Error')) {
            errorMsg = 'Server error occurred during extraction.';
          }
        }

        hasError = true;
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        audioDownloadBar.style.width = '0%';
        audioDownloadBar.textContent = 'Failed';
        if (audioDownloadStatus) audioDownloadStatus.textContent = `Error: ${errorMsg}`;
        showToast(errorMsg, 'danger');

        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      } catch (err) {
        console.error('Error checking iframe:', err);
      }
    };

    iframe.src = downloadUrl;
  });
});
