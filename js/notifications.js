// ============================================================================
// js/notifications.js - PROFESSIONAL TOAST NOTIFICATIONS
// ============================================================================

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = getOrCreateToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icon mapping
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ'}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
  
  return toast;
}

/**
 * Show success toast
 */
function showSuccess(message, duration = 3000) {
  return showToast(message, 'success', duration);
}

/**
 * Show error toast
 */
function showError(message, duration = 4000) {
  return showToast(message, 'error', duration);
}

/**
 * Show info toast
 */
function showInfo(message, duration = 3000) {
  return showToast(message, 'info', duration);
}

/**
 * Show warning toast
 */
function showWarning(message, duration = 3500) {
  return showToast(message, 'warning', duration);
}

/**
 * Get or create toast container
 */
function getOrCreateToastContainer() {
  let container = document.querySelector('.toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * Clear all toasts
 */
function clearAllToasts() {
  const container = document.querySelector('.toast-container');
  if (container) {
    container.innerHTML = '';
  }
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

function showLoadingOverlay(message = 'Loading...') {
  let overlay = document.getElementById('loadingOverlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p id="loadingMessage">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Add CSS for loading overlay
    if (!document.getElementById('loadingOverlayStyles')) {
      const style = document.createElement('style');
      style.id = 'loadingOverlayStyles';
      style.innerHTML = `
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          animation: fadeIn 0.2s ease-in;
        }
        
        .loading-content {
          background: white;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        
        .loading-content p {
          margin-top: 16px;
          color: #666;
          font-size: 16px;
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    overlay.style.display = 'flex';
    document.getElementById('loadingMessage').textContent = message;
  }
  
  return overlay;
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// ============================================================================
// CONFIRMATION DIALOG
// ============================================================================

function showConfirmDialog(title, message, onConfirm, onCancel) {
  let dialog = document.getElementById('confirmDialog');
  
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'confirmDialog';
    dialog.className = 'confirm-dialog';
    document.body.appendChild(dialog);
    
    // Add CSS for dialog
    if (!document.getElementById('confirmDialogStyles')) {
      const style = document.createElement('style');
      style.id = 'confirmDialogStyles';
      style.innerHTML = `
        .confirm-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        
        .confirm-content {
          background: white;
          padding: 32px;
          border-radius: 12px;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideInDown 0.3s ease-out;
        }
        
        .confirm-content h2 {
          margin-top: 0;
          color: #333;
          font-size: 20px;
        }
        
        .confirm-content p {
          color: #666;
          margin-bottom: 24px;
        }
        
        .confirm-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .confirm-buttons button {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .btn-cancel {
          background: #e5e7eb;
          color: #333;
        }
        
        .btn-cancel:hover {
          background: #d1d5db;
        }
        
        .btn-confirm {
          background: #208d8d;
          color: white;
        }
        
        .btn-confirm:hover {
          background: #1a7575;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  dialog.innerHTML = `
    <div class="confirm-content">
      <h2>${title}</h2>
      <p>${message}</p>
      <div class="confirm-buttons">
        <button class="btn-cancel" onclick="hideConfirmDialog(); (${onCancel || 'function(){}'}())">Cancel</button>
        <button class="btn-confirm" onclick="hideConfirmDialog(); (${onConfirm || 'function(){}'}())">Confirm</button>
      </div>
    </div>
  `;
  
  dialog.style.display = 'flex';
  return dialog;
}

function hideConfirmDialog() {
  const dialog = document.getElementById('confirmDialog');
  if (dialog) {
    dialog.style.display = 'none';
  }
}

// ============================================================================
// HELPERS FOR DATA OPERATIONS
// ============================================================================

/**
 * Execute async operation with loading state
 */
async function executeWithLoading(asyncFn, loadingMessage = 'Processing...') {
  try {
    showLoadingOverlay(loadingMessage);
    const result = await asyncFn();
    hideLoadingOverlay();
    return result;
  } catch (error) {
    hideLoadingOverlay();
    showError(error.message || 'Operation failed');
    throw error;
  }
}

/**
 * Format currency with animation
 */
function animateCurrencyUpdate(elementId, newValue, oldValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // If value actually changed, show animation
  if (oldValue !== newValue) {
    element.classList.add('success-animation');
    element.textContent = formatCurrency(newValue);
    
    setTimeout(() => {
      element.classList.remove('success-animation');
    }, 600);
  }
}

// ============================================================================
// EXPORT FOR GLOBAL USE
// ============================================================================

window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showInfo = showInfo;
window.showWarning = showWarning;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
window.showConfirmDialog = showConfirmDialog;
window.hideConfirmDialog = hideConfirmDialog;
window.executeWithLoading = executeWithLoading;
window.animateCurrencyUpdate = animateCurrencyUpdate;

console.log('✅ notifications.js loaded successfully');