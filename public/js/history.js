/**
 * Download History Page Script
 * 
 * Author: Param Panchal (Searchr)
 */

document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const historyItems = document.querySelectorAll('.history-item');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');

  // Filter History Items
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Toggle active classes
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const filter = this.getAttribute('data-filter');

      historyItems.forEach(item => {
        const type = item.getAttribute('data-type');
        if (filter === 'all' || type === filter) {
          item.style.display = 'block';
          item.classList.add('show');
        } else {
          item.style.display = 'none';
          item.classList.remove('show');
        }
      });
    });
  });

  // Delete Individual Entry
  document.querySelectorAll('.delete-history-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const id = this.getAttribute('data-id');
      const itemEl = document.querySelector(`.history-item[data-id="${id}"]`);

      if (!id || !itemEl) return;

      try {
        const response = await fetch(`/history/${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
          // Fade out and remove
          itemEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          itemEl.style.opacity = '0';
          itemEl.style.transform = 'scale(0.95)';
          
          setTimeout(() => {
            itemEl.remove();
            showToast('History entry removed', 'info');
            
            // Check if there are no items left
            if (document.querySelectorAll('.history-item').length === 0) {
              renderEmptyState();
            }
          }, 300);
        } else {
          showToast('Failed to delete history entry', 'danger');
        }
      } catch (err) {
        showToast('Error connecting to the server', 'danger');
      }
    });
  });

  // Clear All History
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to clear your entire download history?')) {
        return;
      }

      try {
        const response = await fetch('/history', {
          method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
          showToast('Download history cleared successfully!', 'success');
          renderEmptyState();
        } else {
          showToast('Failed to clear history', 'danger');
        }
      } catch (err) {
        showToast('Error connecting to the server', 'danger');
      }
    });
  }

  function renderEmptyState() {
    if (clearHistoryBtn) clearHistoryBtn.remove();
    if (historyList) {
      historyList.innerHTML = `
        <div class="glass-card p-5 text-center">
          <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h4 class="text-muted">No Downloads Yet</h4>
          <p class="text-muted">Your download history will appear here.</p>
          <a href="/video" class="btn btn-accent btn-glow mt-2">
            <i class="fas fa-download me-1"></i> Start Downloading
          </a>
        </div>
      `;
    }
  }
});
