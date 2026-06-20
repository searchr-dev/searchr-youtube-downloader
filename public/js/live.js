/**
 * Live Stream Downloader Page Script
 * 
 * Author: Param Panchal (Searchr)
 */

document.addEventListener('DOMContentLoaded', () => {
  const liveUrlInput = document.getElementById('liveUrl');
  const fetchLiveBtn = document.getElementById('fetchLiveBtn');
  const liveLoading = document.getElementById('liveLoading');
  const liveInfoCard = document.getElementById('liveInfoCard');

  const liveThumb = document.getElementById('liveThumb');
  const liveStatusBadge = document.getElementById('liveStatusBadge');
  const liveTitle = document.getElementById('liveTitle');
  const liveUploader = document.getElementById('liveUploader');
  
  const liveStatusCard = document.getElementById('liveStatusCard');
  const liveIndicator = document.getElementById('liveIndicator');
  const liveStatusText = document.getElementById('liveStatusText');
  const liveStatusDesc = document.getElementById('liveStatusDesc');

  const liveDuration = document.getElementById('liveDuration');
  const liveCurrentCard = document.getElementById('liveCurrentCard');
  const liveStartCard = document.getElementById('liveStartCard');
  const downloadLiveBtn = document.getElementById('downloadLiveBtn');
  
  const liveDownloadProgress = document.getElementById('liveDownloadProgress');
  const liveDownloadBar = document.getElementById('liveDownloadBar');

  let currentLiveData = null;
  let recordFromStart = false;

  // Toggle start position option
  liveCurrentCard.addEventListener('click', () => {
    liveCurrentCard.classList.add('active');
    liveStartCard.classList.remove('active');
    recordFromStart = false;
  });

  liveStartCard.addEventListener('click', () => {
    liveStartCard.classList.add('active');
    liveCurrentCard.classList.remove('active');
    recordFromStart = true;
  });

  // Detect Live Stream
  fetchLiveBtn.addEventListener('click', async () => {
    const url = liveUrlInput.value.trim();
    if (!url) return showToast('Please enter a YouTube URL', 'warning');
    if (!isValidUrl(url)) return showToast('Please enter a valid YouTube URL', 'danger');

    // Reset view
    liveInfoCard.classList.add('d-none');
    liveDownloadProgress.classList.add('d-none');
    liveLoading.classList.remove('d-none');

    try {
      const response = await fetch('/live/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      liveLoading.classList.add('d-none');

      if (!result.success) {
        return showToast(result.error || 'Failed to detect stream info', 'danger');
      }

      currentLiveData = result.data;
      displayLiveInfo(currentLiveData);
    } catch (err) {
      liveLoading.classList.add('d-none');
      showToast('Error connecting to the server', 'danger');
    }
  });

  // Enter key support
  liveUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchLiveBtn.click();
  });

  function displayLiveInfo(data) {
    liveThumb.src = data.thumbnail || 'https://placehold.co/640x360?text=No+Thumbnail';
    liveTitle.textContent = data.title;
    liveUploader.textContent = data.uploader;

    // Reset indicator classes
    liveIndicator.className = 'live-indicator';
    liveStatusCard.style.borderColor = 'var(--glass-border)';

    if (data.liveStatus === 'live') {
      liveStatusBadge.textContent = '● LIVE';
      liveStatusBadge.style.background = '#ef4444';
      liveStatusBadge.classList.remove('d-none');
      
      liveIndicator.classList.add('live-active');
      liveStatusText.textContent = 'Stream is currently LIVE';
      liveStatusText.className = 'mb-0 text-danger font-weight-bold';
      liveStatusDesc.textContent = 'You can record this live stream in real-time or download it.';
      liveStatusCard.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else if (data.liveStatus === 'was_live') {
      liveStatusBadge.textContent = 'WAS LIVE';
      liveStatusBadge.style.background = '#6b7280';
      liveStatusBadge.classList.remove('d-none');

      liveStatusText.textContent = 'Stream is offline (Completed stream)';
      liveStatusText.className = 'mb-0 text-muted';
      liveStatusDesc.textContent = 'This live broadcast has completed. You can download the full replay.';
    } else {
      liveStatusBadge.classList.add('d-none');
      liveStatusText.textContent = 'Standard Video (Not live)';
      liveStatusText.className = 'mb-0 text-info';
      liveStatusDesc.textContent = 'This is a regular video, not a live broadcast.';
    }

    liveInfoCard.classList.remove('d-none');
  }

  // Handle Download/Record
  downloadLiveBtn.addEventListener('click', () => {
    if (!currentLiveData) return;

    const durationVal = liveDuration.value.trim();
    let durationSec = parseInt(durationVal);

    if (durationVal && (isNaN(durationSec) || durationSec < 10 || durationSec > 3600)) {
      return showToast('Duration must be between 10 and 3600 seconds (1 hour)', 'danger');
    }

    liveDownloadProgress.classList.remove('d-none');
    liveDownloadProgress.scrollIntoView({ behavior: 'smooth', block: 'center' });

    let progress = 0;
    liveDownloadBar.style.width = '0%';
    
    let timerMessage = durationSec ? `Recording for ${durationSec} seconds...` : 'Recording live stream...';
    liveDownloadBar.textContent = timerMessage;

    // Simulated progress bar
    let simulateTime = durationSec ? (durationSec * 1000) : 10000;
    let step = simulateTime / 100;

    const progressInterval = setInterval(() => {
      if (progress < 98) {
        progress += 1;
        liveDownloadBar.style.width = `${progress}%`;
        liveDownloadBar.textContent = `${timerMessage} (${progress}%)`;
      }
    }, step);

    const cookieToken = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);

    const queryParams = new URLSearchParams({
      url: liveUrlInput.value.trim(),
      title: currentLiveData.title,
      fromStart: recordFromStart ? 'true' : 'false',
      thumbnail: currentLiveData.thumbnail,
      cookieToken: cookieToken
    });

    if (durationSec) {
      queryParams.append('duration', durationSec);
    }

    const downloadUrl = `/live/download?${queryParams.toString()}`;

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
        liveDownloadBar.style.width = '100%';
        liveDownloadBar.textContent = '100% Completed';
        showToast('Recording processed successfully!', 'success');
        
        // Clear the cookie
        document.cookie = 'downloadToken=; Max-Age=0; path=/';
        
        // Cleanup iframe
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 2000);

        setTimeout(() => {
          liveDownloadProgress.classList.add('d-none');
        }, 3000);
      }
    }, 500);

    iframe.onload = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const bodyText = iframeDoc.body ? iframeDoc.body.innerText : '';
        
        let errorMsg = 'Failed to record live stream.';
        try {
          const json = JSON.parse(bodyText);
          if (json && json.success === false) {
            errorMsg = json.error || errorMsg;
          }
        } catch (e) {
          if (bodyText.includes('Error') || bodyText.includes('Internal Server Error')) {
            errorMsg = 'Server error occurred during recording.';
          }
        }

        hasError = true;
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        liveDownloadBar.style.width = '0%';
        liveDownloadBar.textContent = 'Failed';
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
