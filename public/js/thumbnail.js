/**
 * Thumbnail Downloader Page Script
 * 
 * Author: Param Panchal (Searchr)
 */

document.addEventListener('DOMContentLoaded', () => {
  const thumbnailUrlInput = document.getElementById('thumbnailUrl');
  const fetchThumbnailBtn = document.getElementById('fetchThumbnailBtn');
  const thumbnailLoading = document.getElementById('thumbnailLoading');
  const thumbnailInfoCard = document.getElementById('thumbnailInfoCard');
  
  const mainThumb = document.getElementById('mainThumb');
  const videoTitle = document.getElementById('videoTitle');
  const videoUploader = document.getElementById('videoUploader');
  const thumbnailsGrid = document.getElementById('thumbnailsGrid');

  // Fetch Info
  fetchThumbnailBtn.addEventListener('click', async () => {
    const url = thumbnailUrlInput.value.trim();
    if (!url) return showToast('Please enter a YouTube URL', 'warning');
    if (!isValidUrl(url)) return showToast('Please enter a valid YouTube URL', 'danger');

    // Reset layout
    thumbnailInfoCard.classList.add('d-none');
    thumbnailLoading.classList.remove('d-none');

    try {
      const response = await fetch('/thumbnail/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      thumbnailLoading.classList.add('d-none');

      if (!result.success) {
        return showToast(result.error || 'Failed to fetch video info', 'danger');
      }

      displayThumbnailInfo(result.data);
    } catch (err) {
      thumbnailLoading.classList.add('d-none');
      showToast('Error connecting to the server', 'danger');
    }
  });

  // Handle Enter key inside input
  thumbnailUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchThumbnailBtn.click();
  });

  function displayThumbnailInfo(data) {
    mainThumb.src = data.thumbnail || 'https://placehold.co/640x360?text=No+Thumbnail';
    videoTitle.textContent = data.title;
    videoUploader.textContent = data.uploader;

    // Populate Thumbnails Grid
    if (thumbnailsGrid && data.thumbnails && data.thumbnails.length > 0) {
      thumbnailsGrid.innerHTML = '';
      
      // Filter out low quality thumbnails or duplicates by keeping unique resolutions/IDs
      // Reverse to show highest quality first
      const uniqueThumbs = [];
      const seenIds = new Set();
      
      [...data.thumbnails].reverse().forEach(t => {
        if (t.width && t.width >= 320 && !seenIds.has(t.id)) {
          seenIds.add(t.id);
          uniqueThumbs.push(t);
        }
      });
      
      if (uniqueThumbs.length === 0) {
        thumbnailsGrid.innerHTML = '<div class="col-12"><p class="text-muted text-center">No additional thumbnail qualities found.</p></div>';
      } else {
        uniqueThumbs.forEach(t => {
          const qualityName = (t.id || 'default').replace('default', '').toUpperCase() || 'STANDARD';
          const resolution = (t.width && t.height) ? `${t.width}x${t.height}` : 'Auto';
          
          const col = document.createElement('div');
          col.className = 'col-md-4 col-sm-6';
          
          col.innerHTML = `
            <div class="glass-card p-2 h-100 d-flex flex-column">
              <div class="position-relative mb-2 rounded overflow-hidden" style="background: var(--surface-muted); aspect-ratio: 16/9;">
                <img src="${t.url}" alt="${qualityName} Thumbnail" class="img-fluid w-100 h-100 object-fit-cover">
                <span class="position-absolute top-0 end-0 m-1 badge bg-dark opacity-75">${resolution}</span>
              </div>
              <div class="mt-auto">
                <p class="mb-2 fw-bold text-center small text-muted">${qualityName}</p>
                <a href="/thumbnail/download?url=${encodeURIComponent(t.url)}&quality=${qualityName.toLowerCase()}&title=${encodeURIComponent(data.title)}" class="btn btn-glass btn-sm w-100">
                  <i class="fas fa-download"></i> Download
                </a>
              </div>
            </div>
          `;
          thumbnailsGrid.appendChild(col);
        });
      }
    } else if (thumbnailsGrid) {
      thumbnailsGrid.innerHTML = '<div class="col-12"><p class="text-muted text-center">No thumbnail data available for this video.</p></div>';
    }

    thumbnailInfoCard.classList.remove('d-none');
  }
});
