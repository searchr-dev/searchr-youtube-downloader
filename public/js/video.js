/**
 * Video Downloader Page Script
 * 
 * Author: Param Panchal (Searchr)
 */

document.addEventListener('DOMContentLoaded', () => {
  const videoUrlInput = document.getElementById('videoUrl');
  const fetchVideoBtn = document.getElementById('fetchVideoBtn');
  const videoLoading = document.getElementById('videoLoading');
  const videoInfoCard = document.getElementById('videoInfoCard');
  const formatsBody = document.getElementById('formatsBody');

  const videoThumb = document.getElementById('videoThumb');
  const videoDuration = document.getElementById('videoDuration');
  const videoTitle = document.getElementById('videoTitle');
  const videoUploader = document.getElementById('videoUploader');
  const videoViews = document.getElementById('videoViews');
  const videoDesc = document.getElementById('videoDesc');

  const downloadProgress = document.getElementById('downloadProgress');
  const downloadBar = document.getElementById('downloadBar');
  const downloadStatus = document.getElementById('downloadStatus');

  let currentVideoData = null;

  // Fetch Video Info
  fetchVideoBtn.addEventListener('click', async () => {
    const url = videoUrlInput.value.trim();
    if (!url) return showToast('Please enter a YouTube URL', 'warning');
    if (!isValidUrl(url)) return showToast('Please enter a valid YouTube URL', 'danger');

    // Reset layout
    videoInfoCard.classList.add('d-none');
    downloadProgress.classList.add('d-none');
    videoLoading.classList.remove('d-none');

    try {
      const response = await fetch('/video/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      videoLoading.classList.add('d-none');

      if (!result.success) {
        return showToast(result.error || 'Failed to fetch video info', 'danger');
      }

      currentVideoData = result.data;
      displayVideoInfo(currentVideoData);
    } catch (err) {
      videoLoading.classList.add('d-none');
      showToast('Error connecting to the server', 'danger');
    }
  });

  // Handle Enter key inside input
  videoUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchVideoBtn.click();
  });

  function displayVideoInfo(data) {
    videoThumb.src = data.thumbnail || 'https://placehold.co/640x360?text=No+Thumbnail';
    videoDuration.textContent = data.durationString || formatDuration(data.duration);
    videoTitle.textContent = data.title;
    videoUploader.textContent = data.uploader;
    videoViews.textContent = Number(data.viewCount).toLocaleString();
    videoDesc.textContent = data.description || 'No description available.';

    // Populate format table
    formatsBody.innerHTML = '';
    
    // Merge mixed (video+audio) and video-only formats
    const allFormats = [...data.formats.muxed, ...data.formats.video];

    if (allFormats.length === 0) {
      formatsBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No video formats found.</td></tr>';
    } else {
      allFormats.forEach(f => {
        const row = document.createElement('tr');
        row.setAttribute('data-height', f.height || 0);

        const codec = f.vcodec ? `${f.vcodec.split('.')[0]}` : 'N/A';
        const hasAudio = f.acodec && f.acodec !== 'none';
        const audioBadge = hasAudio ? '<i class="fas fa-volume-up text-success ms-1" title="Audio Included"></i>' : '<i class="fas fa-volume-mute text-danger ms-1" title="Video Only (Audio will be auto-merged)"></i>';
        
        row.innerHTML = `
          <td><span class="badge btn-quality">${f.height ? f.height + 'p' : 'N/A'}</span></td>
          <td>${f.resolution || 'N/A'}</td>
          <td>${f.ext ? f.ext.toUpperCase() : 'N/A'}</td>
          <td>${codec} ${audioBadge}</td>
          <td>${f.fps || 'N/A'}</td>
          <td>${f.tbr ? Math.round(f.tbr) + ' kbps' : 'N/A'}</td>
          <td>${formatSize(f.filesize)}</td>
          <td>
            <button class="btn btn-accent btn-sm download-btn" 
              data-format-id="${f.formatId}" 
              data-quality="${f.height ? f.height + 'p' : 'Best'}"
              data-ext="${f.ext}">
              <i class="fas fa-download"></i> Download
            </button>
          </td>
        `;
        formatsBody.appendChild(row);
      });
    }

    videoInfoCard.classList.remove('d-none');

    // Add download action handlers
    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const formatId = this.getAttribute('data-format-id');
        const quality = this.getAttribute('data-quality');
        initiateDownload(formatId, quality);
      });
    });
  }

  // Quality Presets Quick Filtering / Highlight
  document.querySelectorAll('.quality-presets button').forEach(presetBtn => {
    presetBtn.addEventListener('click', function() {
      const targetQual = this.getAttribute('data-quality');
      
      // Remove active from all quality buttons
      document.querySelectorAll('.quality-presets button').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const rows = formatsBody.querySelectorAll('tr');
      let matched = false;

      rows.forEach(row => {
        const h = parseInt(row.getAttribute('data-height'));
        row.style.background = ''; // reset highlight
        
        if (targetQual === 'best') {
          // Highlight first row (since they are sorted descending by height)
          rows[0].style.background = 'rgba(255, 0, 127, 0.08)';
          matched = true;
        } else if (h === parseInt(targetQual)) {
          row.style.background = 'rgba(255, 0, 127, 0.08)';
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          matched = true;
        }
      });

      if (!matched && targetQual !== 'best') {
        showToast(`No exact match for ${targetQual}p, looking in table...`, 'info');
      }
    });
  });

  // Initiate Download Streaming
  function initiateDownload(formatId, quality) {
    if (!currentVideoData) return;

    downloadProgress.classList.remove('d-none');
    downloadProgress.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    let progress = 0;
    downloadBar.style.width = '0%';
    downloadBar.textContent = '0%';
    downloadStatus.textContent = 'Contacting server and starting download...';

    const cancelVideoBtn = document.getElementById('cancelVideoBtn');
    if (cancelVideoBtn) cancelVideoBtn.classList.remove('d-none');

    // Fake progress simulation to give smooth premium feel during buffering
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.floor(Math.random() * 8) + 2;
        downloadBar.style.width = `${progress}%`;
        downloadBar.textContent = `${progress}%`;
        
        if (progress > 40) downloadStatus.textContent = 'Downloading media segments...';
        if (progress > 75) downloadStatus.textContent = 'Merging video and audio streams...';
      }
    }, 800);

    const cookieToken = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);

    const queryParams = new URLSearchParams({
      url: videoUrlInput.value.trim(),
      formatId: formatId,
      title: currentVideoData.title,
      quality: quality,
      thumbnail: currentVideoData.thumbnail,
      cookieToken: cookieToken
    });

    const downloadUrl = `/video/download?${queryParams.toString()}`;
    
    // Create a dynamic iframe to download without reloading the page
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    let hasError = false;

    const cancelHandler = () => {
      if (iframe.parentNode) document.body.removeChild(iframe);
      clearInterval(pollInterval);
      clearInterval(progressInterval);
      downloadBar.style.width = '0%';
      downloadBar.textContent = 'Aborted';
      if (downloadStatus) downloadStatus.textContent = 'Download cancelled.';
      showToast('Download cancelled.', 'warning');
      if (cancelVideoBtn) {
        cancelVideoBtn.classList.add('d-none');
        cancelVideoBtn.removeEventListener('click', cancelHandler);
      }
    };

    if (cancelVideoBtn) {
      // Remove old listeners
      const newBtn = cancelVideoBtn.cloneNode(true);
      cancelVideoBtn.parentNode.replaceChild(newBtn, cancelVideoBtn);
      newBtn.addEventListener('click', cancelHandler);
    }

    // Poll for the cookie showing successful start
    const pollInterval = setInterval(() => {
      const cookieMatch = document.cookie.match(new RegExp('(^|;)\\s*downloadToken\\s*=\\s*' + cookieToken));
      if (cookieMatch) {
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        downloadBar.style.width = '100%';
        downloadBar.textContent = '100%';
        downloadStatus.textContent = 'Download completed! Your browser will now save the file.';
        showToast('Download started successfully!', 'success');
        
        const currentCancelBtn = document.getElementById('cancelVideoBtn');
        if (currentCancelBtn) currentCancelBtn.classList.add('d-none');
        
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
        
        if (!bodyText) return; // Sometimes triggered on abort
        
        let errorMsg = 'Failed to download file.';
        try {
          const json = JSON.parse(bodyText);
          if (json && json.success === false) {
            errorMsg = json.error || errorMsg;
          }
        } catch (e) {
          if (bodyText.includes('Error') || bodyText.includes('Internal Server Error')) {
            errorMsg = 'Server error occurred during download.';
          }
        }

        hasError = true;
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        downloadBar.style.width = '0%';
        downloadBar.textContent = 'Failed';
        downloadStatus.textContent = `Error: ${errorMsg}`;
        showToast(errorMsg, 'danger');
        
        const currentCancelBtn = document.getElementById('cancelVideoBtn');
        if (currentCancelBtn) currentCancelBtn.classList.add('d-none');

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
  }
});
