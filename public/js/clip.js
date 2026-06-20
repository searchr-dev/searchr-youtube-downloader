/**
 * Timestamp Downloader Page Script
 * 
 * Author: Param Panchal (Searchr)
 */

document.addEventListener('DOMContentLoaded', () => {
  const clipUrlInput = document.getElementById('clipUrl');
  const fetchClipBtn = document.getElementById('fetchClipBtn');
  const clipLoading = document.getElementById('clipLoading');
  const clipInfoCard = document.getElementById('clipInfoCard');

  const clipThumb = document.getElementById('clipThumb');
  const clipFullDuration = document.getElementById('clipFullDuration');
  const clipTitle = document.getElementById('clipTitle');
  const clipUploader = document.getElementById('clipUploader');
  const clipDurationText = document.getElementById('clipDurationText');

  const clipStart = document.getElementById('clipStart');
  const clipEnd = document.getElementById('clipEnd');
  
  const clipVideoCard = document.getElementById('clipVideoCard');
  const clipAudioCard = document.getElementById('clipAudioCard');
  const downloadClipBtn = document.getElementById('downloadClipBtn');
  const clipDownloadProgress = document.getElementById('clipDownloadProgress');
  const clipDownloadBar = document.getElementById('clipDownloadBar');
  const clipDownloadStatus = document.getElementById('clipDownloadStatus');

  let currentClipData = null;
  let selectedType = 'video';

  // Toggle clip type selection
  const clipQualitySection = document.getElementById('clipQualitySection');

  clipVideoCard.addEventListener('click', () => {
    clipVideoCard.classList.add('active');
    clipAudioCard.classList.remove('active');
    selectedType = 'video';
    if (clipQualitySection) clipQualitySection.classList.remove('d-none');
  });

  clipAudioCard.addEventListener('click', () => {
    clipAudioCard.classList.add('active');
    clipVideoCard.classList.remove('active');
    selectedType = 'audio';
    if (clipQualitySection) clipQualitySection.classList.add('d-none');
  });

  // Fetch Clip Video Info
  fetchClipBtn.addEventListener('click', async () => {
    const url = clipUrlInput.value.trim();
    if (!url) return showToast('Please enter a YouTube URL', 'warning');
    if (!isValidUrl(url)) return showToast('Please enter a valid YouTube URL', 'danger');

    // Reset view
    clipInfoCard.classList.add('d-none');
    clipDownloadProgress.classList.add('d-none');
    clipLoading.classList.remove('d-none');

    try {
      const response = await fetch('/clip/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      clipLoading.classList.add('d-none');

      if (!result.success) {
        return showToast(result.error || 'Failed to fetch video info', 'danger');
      }

      currentClipData = result.data;
      displayClipInfo(currentClipData);
    } catch (err) {
      clipLoading.classList.add('d-none');
      showToast('Error connecting to the server', 'danger');
    }
  });

  // Enter key support
  clipUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchClipBtn.click();
  });

  function displayClipInfo(data) {
    clipThumb.src = data.thumbnail || 'https://placehold.co/640x360?text=No+Thumbnail';
    
    const durationStr = data.durationString || formatDuration(data.duration);
    clipFullDuration.textContent = durationStr;
    clipTitle.textContent = data.title;
    clipUploader.textContent = data.uploader;
    clipDurationText.textContent = durationStr;

    // Set initial start/end times
    clipStart.value = '00:00:00';
    clipEnd.value = durationStr.includes(':') && durationStr.split(':').length === 2 
      ? `00:${durationStr}` 
      : durationStr;

    // Dynamically update quality dropdown based on max available resolution
    let maxHeight = 0;
    if (data.formats && data.formats.video) {
      data.formats.video.forEach(f => {
        if (f.height && f.height > maxHeight) maxHeight = f.height;
      });
    }
    
    const clipQuality = document.getElementById('clipQuality');
    if (clipQuality && maxHeight > 0) {
      clipQuality.innerHTML = '<option value="best" selected>Best Quality (Auto)</option>';
      const allQualities = [
        { val: 2160, label: '2160p (4K)' },
        { val: 1440, label: '1440p (2K)' },
        { val: 1080, label: '1080p (Full HD)' },
        { val: 720, label: '720p (HD)' },
        { val: 480, label: '480p' },
        { val: 360, label: '360p' },
        { val: 240, label: '240p' },
        { val: 144, label: '144p' }
      ];
      
      allQualities.forEach(q => {
        if (q.val <= maxHeight || maxHeight === 0) {
          const opt = document.createElement('option');
          opt.value = q.val;
          opt.textContent = q.label;
          clipQuality.appendChild(opt);
        }
      });
    }

    clipInfoCard.classList.remove('d-none');
  }

  // Parse time input (HH:MM:SS) to seconds
  function parseTimeToSeconds(timeStr) {
    const parts = timeStr.trim().split(':').map(Number);
    if (parts.some(isNaN)) return -1;
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      return parts[0];
    }
    return -1;
  }

  // Handle Download Clip
  downloadClipBtn.addEventListener('click', () => {
    if (!currentClipData) return;

    const startVal = clipStart.value.trim();
    const endVal = clipEnd.value.trim();

    const startSec = parseTimeToSeconds(startVal);
    const endSec = parseTimeToSeconds(endVal);

    if (startSec < 0 || endSec < 0) {
      return showToast('Invalid time format. Please use HH:MM:SS', 'danger');
    }

    if (startSec >= endSec) {
      return showToast('Start time must be less than end time', 'danger');
    }

    if (endSec > currentClipData.duration) {
      return showToast(`End time cannot exceed video duration (${formatDuration(currentClipData.duration)})`, 'warning');
    }

    clipDownloadProgress.classList.remove('d-none');
    clipDownloadProgress.scrollIntoView({ behavior: 'smooth', block: 'center' });

    let progress = 0;
    clipDownloadBar.style.width = '0%';
    clipDownloadBar.textContent = 'Trimming clip...';
    if (clipDownloadStatus) clipDownloadStatus.textContent = 'Downloading and trimming your clip. This may take a moment...';
    
    const cancelClipBtn = document.getElementById('cancelClipBtn');
    if (cancelClipBtn) cancelClipBtn.classList.remove('d-none');

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (progress < 95) {
        progress += Math.floor(Math.random() * 5) + 1;
        clipDownloadBar.style.width = `${progress}%`;
        clipDownloadBar.textContent = `Downloading & trimming... ${progress}%`;
      }
    }, 1200);

    const clipQuality = document.getElementById('clipQuality') ? document.getElementById('clipQuality').value : 'best';
    const cookieToken = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);

    const queryParams = new URLSearchParams({
      url: clipUrlInput.value.trim(),
      startTime: startVal,
      endTime: endVal,
      type: selectedType,
      quality: clipQuality,
      title: currentClipData.title,
      thumbnail: currentClipData.thumbnail,
      cookieToken: cookieToken
    });

    const downloadUrl = `/clip/download?${queryParams.toString()}`;

    // Create a dynamic iframe to download without reloading the page
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    let hasError = false;

    const cancelHandler = () => {
      if (iframe.parentNode) document.body.removeChild(iframe);
      clearInterval(pollInterval);
      clearInterval(progressInterval);
      clipDownloadBar.style.width = '0%';
      clipDownloadBar.textContent = 'Aborted';
      if (clipDownloadStatus) clipDownloadStatus.textContent = 'Download cancelled.';
      showToast('Download cancelled.', 'warning');
      if (cancelClipBtn) {
        cancelClipBtn.classList.add('d-none');
        cancelClipBtn.removeEventListener('click', cancelHandler);
      }
    };
    
    if (cancelClipBtn) {
      // Remove any old listeners (clone trick)
      const newBtn = cancelClipBtn.cloneNode(true);
      cancelClipBtn.parentNode.replaceChild(newBtn, cancelClipBtn);
      newBtn.addEventListener('click', cancelHandler);
    }

    // Poll for the cookie showing successful start
    const pollInterval = setInterval(() => {
      const cookieMatch = document.cookie.match(new RegExp('(^|;)\\s*downloadToken\\s*=\\s*' + cookieToken));
      if (cookieMatch) {
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        clipDownloadBar.style.width = '100%';
        clipDownloadBar.textContent = '100%';
        if (clipDownloadStatus) clipDownloadStatus.textContent = 'Download completed! Your browser will now save the file.';
        showToast('Clip download started successfully!', 'success');
        
        const currentCancelBtn = document.getElementById('cancelClipBtn');
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
        
        let errorMsg = 'Failed to download and trim clip.';
        try {
          const json = JSON.parse(bodyText);
          if (json && json.success === false) {
            errorMsg = json.error || errorMsg;
          }
        } catch (e) {
          if (bodyText.includes('Error') || bodyText.includes('Internal Server Error')) {
            errorMsg = 'Server error occurred during clip download.';
          }
        }

        hasError = true;
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        clipDownloadBar.style.width = '0%';
        clipDownloadBar.textContent = 'Failed';
        if (clipDownloadStatus) clipDownloadStatus.textContent = `Error: ${errorMsg}`;
        showToast(errorMsg, 'danger');
        
        const currentCancelBtn = document.getElementById('cancelClipBtn');
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
  });
});
