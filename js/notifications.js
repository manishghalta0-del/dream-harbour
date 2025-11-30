// notifications.js - Toasts, confirm dialogs, loading overlay (module + global-friendly)

// Toast container helper
function getOrCreateToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.style.position = 'fixed';
    container.style.right = '16px';
    container.style.top = '16px';
    container.style.zIndex = 9999;
    document.body.appendChild(container);
  }
  return container;
}

function createToast(message, type = 'info', duration = 3500) {
  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  toast.className = `dh-toast dh-toast--${type}`;
  toast.style.minWidth = '200px';
  toast.style.marginBottom = '8px';
  toast.style.padding = '12px 16px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.justifyContent = 'space-between';
  toast.style.gap = '12px';
  toast.style.background = type === 'success' ? '#e6fffa' : type === 'error' ? '#ffe6e6' : '#f3f4f6';
  toast.style.color = '#0f172a';

  const icon = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }[type] || 'ℹ';
  toast.innerHTML = `<div style="display:flex;align-items:center;gap:10px"><div aria-hidden style="font-weight:700">${icon}</div><div style="flex:1">${message}</div></div><button aria-label="Close" style="background:none;border:none;font-size:16px;cursor:pointer">×</button>`;

  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', () => {
    toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(12px)';
    setTimeout(() => toast.remove(), 200);
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (!toast.parentElement) return;
    toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(12px)';
    setTimeout(() => toast.remove(), 200);
  }, duration);

  return toast;
}

// Convenience wrappers
function showSuccess(message, duration = 3000) { return createToast(message, 'success', duration); }
function showError(message, duration = 4500) { return createToast(message, 'error', duration); }
function showInfo(message, duration = 3000) { return createToast(message, 'info', duration); }
function showWarning(message, duration = 3500) { return createToast(message, 'warning', duration); }

function clearAllToasts() {
  const container = document.querySelector('.toast-container');
  if (container) container.innerHTML = '';
}

// Loading overlay
function showLoadingOverlay(message = 'Loading...') {
  let overlay = document.getElementById('dhLoadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'dhLoadingOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.right = 0;
    overlay.style.bottom = 0;
    overlay.style.background = 'rgba(0,0,0,0.4)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 9998;

    const card = document.createElement('div');
    card.style.background = '#fff';
    card.style.padding = '28px';
    card.style.borderRadius = '12px';
    card.style.boxShadow = '0 20px 60px rgba(2,6,23,0.2)';
    card.style.textAlign = 'center';
    card.innerHTML = `<div class="dh-spinner" aria-hidden style="width:56px;height:56px;border-radius:50%;border:6px solid #eef2f7;border-top-color:#06b6d4;animation:dh-spin 1s linear infinite;margin:0 auto"></div><p style="margin-top:12px;color:#0f172a">${message}</p>`;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.innerHTML = '@keyframes dh-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  } else {
    overlay.style.display = 'flex';
    overlay.querySelector('p') && (overlay.querySelector('p').textContent = message);
  }
  return overlay;
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('dhLoadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// Confirm dialog (promise-based)
function showConfirmDialog(title = 'Confirm', message = 'Are you sure?') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'dh-confirm';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.right = 0;
    overlay.style.bottom = 0;
    overlay.style.background = 'rgba(0,0,0,0.45)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 9999;

    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.padding = '20px';
    box.style.borderRadius = '10px';
    box.style.width = '380px';
    box.style.boxShadow = '0 20px 60px rgba(2,6,23,0.2)';
    box.innerHTML = `<h3 style="margin:0 0 8px">${title}</h3><p style="margin:0 0 16px">${message}</p><div style="display:flex;gap:8px;justify-content:flex-end"><button id="dhConfirmCancel" style="padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;background:#f8fafc;cursor:pointer">Cancel</button><button id="dhConfirmOk" style="padding:8px 12px;border-radius:8px;background:#06b6d4;color:#fff;border:none;cursor:pointer">OK</button></div>`;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.querySelector('#dhConfirmCancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
    overlay.querySelector('#dhConfirmOk').addEventListener('click', () => { overlay.remove(); resolve(true); });
  });
}

// Expose globally for legacy code
window.createToast = createToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showInfo = showInfo;
window.showWarning = showWarning;
window.clearAllToasts = clearAllToasts;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
window.showConfirmDialog = showConfirmDialog;

// Export for module usage
export {
  createToast,
  showSuccess,
  showError,
  showInfo,
  showWarning,
  clearAllToasts,
  showLoadingOverlay,
  hideLoadingOverlay,
  showConfirmDialog
};
