// ============================================================================
// js/common.js - Supabase Configuration & Shared Functions
// ============================================================================

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
  console.log(`[${type.toUpperCase()}] ${message}`);
  alert(message);
}

function navigateTo(page) {
  window.location.href = `${page}.html`;
}

function exportDashboardPDF() {
  alert('PDF export feature coming soon!');
}

// ============================================================================
// Initialize on Page Load
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const user = checkLoginStatus();
  if (user) {
    console.log('✅ User logged in:', user.full_name);
  }
});

console.log('✅ DreamHarbour common.js loaded successfully');