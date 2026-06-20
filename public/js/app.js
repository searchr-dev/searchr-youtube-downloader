/**
 * Searchr Downloader — Main Frontend Script
 * Common helper functions, toasts, URL validation, and size/time formatting.
 * 
 * Author: Param Panchal (Searchr)
 */

/**
 * Validates if the given string is a valid YouTube URL.
 * @param {string} url 
 * @returns {boolean}
 */
function isValidUrl(url) {
  if (!url) return false;
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|live\/|shorts\/)|youtu\.be\/)/;
  return pattern.test(url);
}

/**
 * Formats seconds into HH:MM:SS or MM:SS format.
 * @param {number} seconds 
 * @returns {string}
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const formattedM = String(m).padStart(2, '0');
  const formattedS = String(s).padStart(2, '0');

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${formattedM}:${formattedS}`;
  }
  return `${formattedM}:${formattedS}`;
}

/**
 * Formats bytes into a human readable size.
 * @param {number} bytes 
 * @returns {string}
 */
function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return 'N/A';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Shows a toast notification.
 * @param {string} message 
 * @param {'success'|'warning'|'danger'|'info'} type 
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastId = `toast-${Date.now()}`;
  const iconMap = {
    success: 'fa-check-circle text-success',
    warning: 'fa-exclamation-triangle text-warning',
    danger: 'fa-times-circle text-danger',
    info: 'fa-info-circle text-info'
  };

  const borderClass = `toast-glass-${type}`;

  const html = `
    <div id="${toastId}" class="toast toast-glass ${borderClass} align-items-center show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);

  const toastEl = document.getElementById(toastId);
  
  // Auto-remove toast after 4 seconds
  setTimeout(() => {
    if (toastEl) {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    }
  }, 4000);

  // Allow manual close
  toastEl.querySelector('.btn-close').addEventListener('click', () => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 300);
  });
}

// Check if a URL was passed via query param (useful for redirecting from home)
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const queryUrl = params.get('url');
  if (queryUrl) {
    // Fill the inputs if they exist
    ['videoUrl', 'audioUrl', 'clipUrl', 'liveUrl'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = queryUrl;
        // Trigger click on fetch/detect buttons
        const btnId = id.startsWith('video') ? 'fetchVideoBtn' :
                      id.startsWith('audio') ? 'fetchAudioBtn' :
                      id.startsWith('clip') ? 'fetchClipBtn' : 'fetchLiveBtn';
        const btn = document.getElementById(btnId);
        if (btn) btn.click();
      }
    });
  }

  // ═══ Theme Management ═══
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('.theme-toggle-icon');

    function updateThemeUI(theme) {
      if (!icon) return;
      icon.className = 'theme-toggle-icon fas';
      if (theme === 'dark') {
        icon.classList.add('fa-moon');
        themeToggleBtn.title = 'Theme: Dark (Click to switch to Light)';
      } else if (theme === 'light') {
        icon.classList.add('fa-sun');
        themeToggleBtn.title = 'Theme: Light (Click to switch to System)';
      } else {
        icon.classList.add('fa-circle-half-stroke');
        themeToggleBtn.title = 'Theme: System (Click to switch to Dark)';
      }
    }

    function applyTheme(theme) {
      if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      updateThemeUI(theme);
    }

    // Initialize UI on load
    const currentTheme = localStorage.getItem('theme') || 'auto';
    applyTheme(currentTheme);

    // Toggle click handler
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = localStorage.getItem('theme') || 'auto';
      let nextTheme = 'auto';
      if (activeTheme === 'auto') {
        nextTheme = 'dark';
      } else if (activeTheme === 'dark') {
        nextTheme = 'light';
      } else {
        nextTheme = 'auto';
      }
      localStorage.setItem('theme', nextTheme);
      applyTheme(nextTheme);
    });

    // Listen for system theme changes dynamically
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      const activeTheme = localStorage.getItem('theme') || 'auto';
      if (activeTheme === 'auto') {
        if (e.matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
    });
  }
});
