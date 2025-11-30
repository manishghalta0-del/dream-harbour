// common.js - Supabase Configuration & Shared Functions
// NOTE: You asked to keep Supabase keys where they were in the original file.

const SUPABASE_URL = "https://lqrewteclbexiknvhenk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8";

// Create Supabase client - GLOBAL
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// Shared Utility Functions
// ============================================================================

function checkLoginStatus() {
  const user = localStorage.getItem('dreamHarbourUser');
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return JSON.parse(user);
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('dreamHarbourUser');
    localStorage.removeItem('userSession');
    window.location.href = 'index.html';
  }
}

function formatCurrency(amount) {
  return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(Math.round(num || 0));
}

function showToast(message, type = 'info') {
  // If the project's notification system exists, use it; otherwise fallback to console+alert
  if (typeof createToast === 'function') {
    createToast(message, type);
    return;
  }
  console.log(`[${type.toUpperCase()}] ${message}`);
  alert(message);
}

function navigateTo(page) {
  window.location.href = `${page}.html`;
}

function exportDashboardPDF() {
  alert('PDF export feature coming soon!');
}

// Expose to global scope for legacy pages that rely on globals
window.dh = window.dh || {};
window.dh.supabase = supabase;
window.dh.checkLoginStatus = checkLoginStatus;
window.dh.logout = logout;
window.dh.formatCurrency = formatCurrency;
window.dh.formatDate = formatDate;
window.dh.formatNumber = formatNumber;
window.dh.showToast = showToast;
window.dh.navigateTo = navigateTo;
window.dh.exportDashboardPDF = exportDashboardPDF;

// Also export for module usage
export {
  supabase,
  checkLoginStatus,
  logout,
  formatCurrency,
  formatDate,
  formatNumber,
  showToast,
  navigateTo,
  exportDashboardPDF
};

console.log('✅ DreamHarbour common.js loaded successfully');
