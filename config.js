/**
 * Application Configuration
 * Centralized configuration for the entire application
 * This file should NOT be committed if it contains sensitive data
 * Use environment variables instead in production
 */

const APP_CONFIG = {
    // Application metadata
    APP_NAME: 'Dream Harbour',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'Professional Invoice Management System',
    
    // Supabase Configuration
    SUPABASE: {
        URL: 'https://lqrewteclbexiknvhenk.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8'
    },
    
    // Session Configuration
    SESSION: {
        TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
        STORAGE_KEY: 'dreamHarbourUser',
        LOGIN_TIME_KEY: 'dreamHarbourLoginTime'
    },
    
    // UI Configuration
    UI: {
        TOAST_DURATION: 4000, // Toast notification duration in ms
        ANIMATION_DURATION: 300, // CSS animation duration in ms
        MODAL_ANIMATION_DURATION: 200,
        SIDEBAR_WIDTH: 260, // Pixels
        TOPBAR_HEIGHT: 60, // Pixels
        MAX_CONTENT_WIDTH: 1400 // Pixels
    },
    
    // Validation Configuration
    VALIDATION: {
        PHONE_PATTERN: /^\d{10}$/,
        PHONE_LENGTH: 10,
        PIN_PATTERN: /^\d{6}$/,
        PIN_LENGTH: 6,
        GSTIN_PATTERN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PINCODE_PATTERN: /^[0-9]{6}$/
    },
    
    // Error Messages
    ERRORS: {
        INVALID_PHONE: 'Please enter a valid 10-digit phone number',
        INVALID_PIN: 'Please enter a valid 6-digit PIN',
        INVALID_GSTIN: 'Please enter a valid GSTIN',
        INVALID_EMAIL: 'Please enter a valid email address',
        INVALID_AMOUNT: 'Please enter a valid amount',
        SESSION_EXPIRED: 'Session expired. Please login again.',
        NETWORK_ERROR: 'Network error. Please check your connection.',
        SUPABASE_ERROR: 'Database error. Please try again later.',
        REQUIRED_FIELD: 'This field is required',
        INVALID_CREDENTIALS: 'Invalid credentials. Please try again.'
    },
    
    // Success Messages
    SUCCESS: {
        LOGIN: 'Login successful! Redirecting...',
        LOGOUT: 'Logged out successfully',
        SAVED: 'Data saved successfully',
        DELETED: 'Deleted successfully',
        UPDATED: 'Updated successfully',
        SESSION_EXTENDED: 'Session extended for 30 more minutes'
    },
    
    // Feature Flags (for future use)
    FEATURES: {
        ENABLE_OFFLINE_MODE: false,
        ENABLE_EXPORT_PDF: true,
        ENABLE_EMAIL_INVOICES: false,
        ENABLE_DARK_MODE: false
    },
    
    // API Endpoints (for future backend integration)
    ENDPOINTS: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH_TOKEN: '/api/auth/refresh',
        INVOICES: '/api/invoices',
        CUSTOMERS: '/api/customers',
        SETTINGS: '/api/settings'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}
