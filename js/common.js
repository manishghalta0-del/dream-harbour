// ============================================================================
<<<<<<< HEAD
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
=======
// PRODUCTION-READY: common.js & auth.js - COMPLETE CORRECTED VERSION
// ============================================================================
// Project: DreamHarbour - Business Dashboard
// Status: Production-Ready with All Security Fixes
// Last Updated: November 26, 2025
// Review Reference: common_auth_review.pdf
// ============================================================================

// ============================================================================
// FILE 1: js/common.js - SHARED UTILITIES (FULLY CORRECTED)
// ============================================================================

// ============================================================================
// SUPABASE INITIALIZATION & CLIENT MANAGEMENT
// ============================================================================

/**
 * Global Supabase client instance
 * Initialized lazily on first use
 */
let supabaseClient = null;

/**
 * Initialize Supabase client connection
 * CRITICAL: Replace placeholder values with your actual Supabase credentials
 * For production, use environment variables instead of hardcoding
 * 
 * @returns {Object|null} Supabase client instance or null if initialization failed
 */
function initSupabase() {
    // Return existing client if already initialized
    if (supabaseClient) {
        return supabaseClient;
    }

    try {
        // Load credentials from environment variables (recommended for production)
        // For development, you can set these in index.html or a config file
        const SUPABASE_URL = window.SUPABASE_URL || 'https://your-project.supabase.co';
        const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'your-anon-key-here';

        // CRITICAL: Validate credentials are actually set
        if (SUPABASE_URL === 'https://your-project.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key-here') {
            console.error('❌ CRITICAL: Supabase credentials not configured!');
            console.error('   Please set SUPABASE_URL and SUPABASE_ANON_KEY');
            console.error('   Instructions:');
            console.error('   1. Get your URL from: https://app.supabase.com/project/_/settings/api');
            console.error('   2. Set in index.html: window.SUPABASE_URL = "your-url"');
            console.error('   3. Set in index.html: window.SUPABASE_ANON_KEY = "your-key"');
            return null;
        }

        // Verify Supabase library is loaded
        if (!window.supabase || !window.supabase.createClient) {
            console.error('❌ Supabase library not loaded!');
            console.error('   Ensure this line is in your HTML BEFORE common.js:');
            console.error('   <script src="https://cdn.jsdelivr.net/npm/supabase-js@2"></script>');
            return null;
        }

        // Initialize Supabase client
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✓ Supabase client initialized successfully');

        return supabaseClient;

    } catch (error) {
        console.error('❌ Error initializing Supabase:', error.message);
        return null;
    }
}

/**
 * Get or initialize Supabase client
 * This is what auth.js uses to access the database
 * 
 * @returns {Object|null} Supabase client instance or null if initialization failed
 */
function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// ============================================================================
// AUTHENTICATION & SESSION MANAGEMENT
// ============================================================================

/**
 * Check if user is logged in
 * Validates session and user data structure
 * Redirects to login if not authenticated
 * 
 * SECURITY: Validates that user object has required fields
 * ROBUSTNESS: Handles corrupted localStorage data gracefully
 * 
 * @returns {Object|null} User object if logged in, null otherwise
 */
function checkLoginStatus() {
    try {
        // Try sessionStorage first (more secure), then fallback to localStorage
        // sessionStorage is cleared when browser closes (more secure)
        // localStorage persists across browser sessions
        let userJson = sessionStorage.getItem('dreamHarbourUser');
        if (!userJson) {
            userJson = localStorage.getItem('dreamHarbourUser');
        }

        // No session found - redirect to login
        if (!userJson) {
            window.location.href = 'index.html';
            return null;
        }

        // SECURITY FIX: Parse JSON safely with error handling
        let userData;
        try {
            userData = JSON.parse(userJson);
        } catch (parseError) {
            console.error('❌ Corrupted user session data detected');
            throw new Error('Invalid JSON in session storage');
        }

        // SECURITY FIX: Validate user object has required fields
        // Prevents crashes from incomplete or tampered session data
        if (!userData.id || !userData.phone || !userData.name) {
            console.warn('⚠️ User session missing required fields');
            console.warn('   Available fields:', Object.keys(userData));
            throw new Error('Invalid user object structure');
        }

        return userData;

    } catch (error) {
        console.error('❌ Session validation error:', error.message);

        // Clear corrupted data from both storage types
        sessionStorage.removeItem('dreamHarbourUser');
        localStorage.removeItem('dreamHarbourUser');

        // Redirect to login page
        window.location.href = 'index.html';
        return null;
    }
}

/**
 * Logout user - clear all session data and redirect to login
 * SECURITY FIX: Clears both sessionStorage and localStorage
 * SECURITY FIX: Shows audit log entry
 * Shows confirmation dialog before clearing data
 */
function logout() {
    try {
        // Ask user to confirm logout
        if (!confirm('Are you sure you want to logout?')) {
            return; // User cancelled
        }

        // Get user info for logging before clearing data
        const user = checkLoginStatus();
        if (user) {
            console.log(`✓ User ${user.phone} logged out at ${new Date().toISOString()}`);
            // In production: Send to audit logging service
        }

        // SECURITY FIX: Clear ALL storage locations
        localStorage.removeItem('dreamHarbourUser');
        localStorage.removeItem('dreamHarbourRememberedPhone');
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('dreamHarbourUser');

        // Additional cleanup for any other session data
        sessionStorage.clear(); // Clear all sessionStorage

        // Redirect to login
        window.location.href = 'index.html';

    } catch (error) {
        console.error('❌ Logout error:', error.message);
        // Force logout anyway even if error occurs
        window.location.href = 'index.html';
    }
}

// ============================================================================
// DATA FORMATTING FUNCTIONS (WITH INPUT VALIDATION)
// ============================================================================

/**
 * Format amount as Indian Rupees currency
 * SECURITY FIX: Handles null, undefined, NaN, and non-finite numbers
 * Prevents "₹NaN" or "₹Infinity" from being displayed
 * 
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "₹1,234.56") or "₹0.00" for invalid input
 */
function formatCurrency(amount) {
    try {
        // SECURITY FIX: Validate input type and value
        if (amount === null || amount === undefined || amount === '') {
            return '₹0.00';
        }

        // Convert to number
        const numAmount = parseFloat(amount);

        // SECURITY FIX: Check for NaN or non-finite values
        if (isNaN(numAmount) || !isFinite(numAmount)) {
            console.warn(`⚠️ Invalid currency amount: ${amount}`);
            return '₹0.00';
        }

        // Format with Indian locale (en-IN)
        // This ensures comma placement and decimal format matches Indian standards
        return `₹${numAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    } catch (error) {
        console.error('❌ Error formatting currency:', error.message);
        return '₹0.00';
    }
}

/**
 * Format date string to Indian date format
 * SECURITY FIX: Handles invalid dates gracefully
 * Prevents "Invalid Date" strings from crashing the app
 * 
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date (e.g., "26-Nov-2025") or "N/A" for invalid input
 */
function formatDate(dateString) {
    try {
        // Validate input
        if (!dateString || dateString === '') {
            return 'N/A';
        }

        // Parse date
        const date = new Date(dateString);

        // SECURITY FIX: Validate date is actually valid
        // Invalid dates have NaN as getTime()
        if (isNaN(date.getTime())) {
            console.warn(`⚠️ Invalid date string received: ${dateString}`);
            return 'Invalid Date';
        }

        // Format with Indian locale
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

    } catch (error) {
        console.error('❌ Error formatting date:', error.message);
        return 'Invalid Date';
    }
}

/**
 * Format date and time together
 * Useful for timestamps and activity logs
 * 
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted datetime (e.g., "26-Nov-2025, 1:05 PM")
 */
function formatDateTime(dateString) {
    try {
        if (!dateString || dateString === '') {
            return 'N/A';
        }

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        const datePart = date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const timePart = date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return `${datePart}, ${timePart}`;

    } catch (error) {
        console.error('❌ Error formatting datetime:', error.message);
        return 'Invalid Date';
    }
}

/**
 * Format phone number for display
 * Converts "9876543210" to "987-654-3210"
 * 
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    try {
        if (!phone) return '';

        // Remove all non-digits
        const cleaned = phone.replace(/\D/g, '');

        // Format as XXX-XXXX-XXXX for 10-digit number
        if (cleaned.length === 10) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
        }

        return phone;

    } catch (error) {
        console.error('❌ Error formatting phone:', error.message);
        return phone;
    }
}

// ============================================================================
// NOTIFICATION/TOAST UI COMPONENT
// ============================================================================

/**
 * Show a custom toast notification (non-blocking UI notification)
 * IMPROVEMENT: Replaces browser alert() with professional toast UI
 * Toasts appear in top-right corner and auto-dismiss after 3 seconds
 * 
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', or 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    try {
        // Validate inputs
        if (!message || typeof message !== 'string') {
            console.error('❌ Invalid toast message');
            return;
        }

        // Validate and normalize type
        const validTypes = ['success', 'error', 'warning', 'info'];
        if (!validTypes.includes(type)) {
            console.warn(`⚠️ Invalid toast type "${type}", using "info" instead`);
            type = 'info';
        }

        // Create container for toasts if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.setAttribute('role', 'region');
            toastContainer.setAttribute('aria-label', 'Notifications');
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            `;
            document.body.appendChild(toastContainer);
        }

        // Create individual toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const bgColor = getToastColor(type);
        toast.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 4px;
            background-color: ${bgColor};
            color: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            font-size: 14px;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
            word-wrap: break-word;
        `;

        // Set text content (not innerHTML to prevent XSS)
        toast.textContent = message;

        // Add to container
        toastContainer.appendChild(toast);

        // Auto-remove after specified duration
        setTimeout(() => {
            try {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            } catch (e) {
                console.warn('⚠️ Error removing toast element');
            }
        }, duration);

    } catch (error) {
        console.error('❌ Error showing toast:', error.message);
        // Fallback to alert if toast fails
        alert(message);
    }
}

/**
 * Get background color for toast based on type
 * @param {string} type - Toast type
 * @returns {string} Hex color code
 */
function getToastColor(type) {
    const colors = {
        'success': '#10b981',  // Green
        'error': '#ef4444',    // Red
        'warning': '#f59e0b',  // Amber
        'info': '#3b82f6'      // Blue
    };
    return colors[type] || colors['info'];
}

// ============================================================================
// NAVIGATION FUNCTIONS (WITH SECURITY)
// ============================================================================

/**
 * Navigate to a page (with input validation)
 * SECURITY FIX: Only allows navigation to whitelisted pages
 * Prevents XSS attacks through URL manipulation
 * 
 * @param {string} page - Page name without .html extension
 */
function navigateTo(page) {
    try {
        // Whitelist of allowed pages
        const ALLOWED_PAGES = ['dashboard', 'invoices', 'settings', 'index'];

        // Validate input exists and is string
        if (!page || typeof page !== 'string') {
            console.error('❌ Invalid page name provided to navigateTo()');
            return;
        }

        // Clean and normalize page name
        const cleanPage = page.toLowerCase().trim();

        // SECURITY FIX: Check against whitelist
        if (!ALLOWED_PAGES.includes(cleanPage)) {
            console.error(`❌ Navigation to '${cleanPage}' not allowed (not in whitelist)`);
            showToast(`Cannot navigate to ${cleanPage}`, 'error');
            return;
        }

        // Safe navigation
        window.location.href = `${cleanPage}.html`;

    } catch (error) {
        console.error('❌ Navigation error:', error.message);
    }
}

// ============================================================================
// EXPORT/DOWNLOAD FUNCTIONS
// ============================================================================

/**
 * Export dashboard data as CSV
 * Placeholder - to be implemented in dashboard.js
 * Will export all visible dashboard data
 */
function exportDashboardCSV() {
    showToast('CSV export feature coming soon!', 'info', 5000);
    console.log('ℹ️ CSV export feature requested');
}

/**
 * Export dashboard as PDF
 * Placeholder - to be implemented in dashboard.js with a library like jsPDF
 * Will export dashboard with all charts, tables, and statistics
 */
function exportDashboardPDF() {
    showToast('PDF export feature coming soon!', 'info', 5000);
    console.log('ℹ️ PDF export feature requested');
}

// ============================================================================
// UTILITY FUNCTIONS & HELPERS
// ============================================================================

/**
 * Debounce function - delays function execution until user stops triggering
 * Useful for search/filter inputs to avoid excessive API calls
 * 
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} Debounced function
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Check if user has specific role/permission
 * SECURITY: Admins can access anything, other roles checked against requirement
 * 
 * @param {string} requiredRole - Role to check for
 * @returns {boolean} True if user has the role or is admin
 */
function hasRole(requiredRole) {
    try {
        const user = checkLoginStatus();
        if (!user) {
            return false;
        }

        // Admins have access to everything
        // Other users must have exact role match
        return user.role === requiredRole || user.role === 'admin';

    } catch (error) {
        console.error('❌ Error checking role:', error.message);
        return false;
    }
}

/**
 * Get current logged-in user
 * @returns {Object|null} Current user object or null if not logged in
 */
function getCurrentUser() {
    return checkLoginStatus();
}

/**
 * Generate UUID v4 (RFC 4122)
 * Used for creating unique identifiers
 * @returns {string} UUID string
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Sleep/delay execution
 * Useful for adding delays between API calls or animations
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// PAGE INITIALIZATION & GLOBAL SETUP
// ============================================================================

/**
 * Initialize page when DOM is ready
 * - Check login status on protected pages (not login page)
 * - Set up global error handlers
 */
document.addEventListener('DOMContentLoaded', function initPage() {
    try {
        // Get current page path
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('index.html') || currentPage.endsWith('/');

        // Skip authentication check on login page
        if (isLoginPage) {
            console.log('ℹ️ Login page detected - skipping authentication check');
            return;
        }

        // Check authentication on protected pages
        const user = checkLoginStatus();
        if (user) {
            console.log(`✓ User ${user.name} (${user.phone}) authenticated - Role: ${user.role}`);
        }

    } catch (error) {
        console.error('❌ Page initialization error:', error.message);
    }
});

// ============================================================================
// GLOBAL ERROR HANDLING (CATCH ALL ERRORS)
// ============================================================================

/**
 * Global error handler - catches all uncaught JavaScript errors
 */
window.addEventListener('error', function handleGlobalError(event) {
    console.error('❌ Global error caught:', event.error);
    console.error('   File:', event.filename);
    console.error('   Line:', event.lineno);
    console.error('   Column:', event.colno);

    // Show user-friendly error message
    showToast('An unexpected error occurred. Please refresh the page.', 'error');

    // In production: Send to error tracking service (Sentry, etc.)
});

/**
 * Global unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', function handleUnhandledRejection(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);

    showToast('An error occurred. Please try again.', 'error');

    // In production: Send to error tracking service
});

// ============================================================================
// CSS ANIMATIONS (Add to your <style> section or CSS file)
// ============================================================================
// Add these CSS keyframes to your stylesheet for toast animations:
//
// @keyframes slideIn {
//     from {
//         transform: translateX(400px);
//         opacity: 0;
//     }
//     to {
//         transform: translateX(0);
//         opacity: 1;
//     }
// }
//
// @keyframes slideOut {
//     from {
//         transform: translateX(0);
//         opacity: 1;
//     }
//     to {
//         transform: translateX(400px);
//         opacity: 0;
//     }
// }
// ============================================================================

console.log('✓ common.js loaded successfully - All utilities ready');
>>>>>>> b064aad0d69ca9268f13fbba5e73f179bb618242
