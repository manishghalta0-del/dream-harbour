/**
 * Dream Harbour - Core Application Utilities
 * Comprehensive Supabase integration, validation, and utility functions
 * 
 * Dependencies: config.js, supabase-init.js
 */

'use strict';

// Configuration - fallback defaults if config.js not loaded
const CONFIG = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : {
    SESSION: { TIMEOUT: 30 * 60 * 1000 },
    VALIDATION: {
        PHONE_PATTERN: /^\d{10}$/,
        PIN_PATTERN: /^\d{6}$/,
        GSTIN_PATTERN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    },
    ERRORS: {
        INVALID_PHONE: 'Please enter a valid 10-digit phone number',
        INVALID_PIN: 'Please enter a valid 6-digit PIN',
        SESSION_EXPIRED: 'Session expired. Please login again.'
    },
    SUCCESS: {
        LOGIN: 'Login successful! Redirecting...',
        LOGOUT: 'Logged out successfully'
    }
};

// ==================== STATE MANAGEMENT ====================

let currentUser = null;
let sessionTimer = null;
const SESSION_TIMEOUT = CONFIG.SESSION.TIMEOUT;

// ==================== USER MANAGEMENT ====================

/**
 * Save user session to localStorage
 * @param {Object} user - User data to save
 * @returns {void}
 */
function saveUserSession(user) {
    if (!user || typeof user !== 'object') {
        console.error('Invalid user object provided to saveUserSession');
        return;
    }
    
    currentUser = user;
    try {
        localStorage.setItem(CONFIG.SESSION.STORAGE_KEY || 'dreamHarbourUser', JSON.stringify(user));
        localStorage.setItem(CONFIG.SESSION.LOGIN_TIME_KEY || 'dreamHarbourLoginTime', Date.now().toString());
        console.log(`✅ User session saved: ${user.fullName || user.full_name}`);
        startSessionTimer();
    } catch (error) {
        console.error('Error saving user session:', error);
    }
}

/**
 * Get user session from localStorage
 * @returns {Object|null} User data or null if not logged in
 */
function getUserSession() {
    try {
        const userJson = localStorage.getItem(CONFIG.SESSION.STORAGE_KEY || 'dreamHarbourUser');
        currentUser = userJson ? JSON.parse(userJson) : null;
        return currentUser;
    } catch (error) {
        console.error('Error parsing user session:', error);
        return null;
    }
}

/**
 * Clear user session
 * @returns {void}
 */
function clearUserSession() {
    currentUser = null;
    if (sessionTimer) clearTimeout(sessionTimer);
    
    try {
        localStorage.removeItem(CONFIG.SESSION.STORAGE_KEY || 'dreamHarbourUser');
        localStorage.removeItem(CONFIG.SESSION.LOGIN_TIME_KEY || 'dreamHarbourLoginTime');
        console.log('✅ User session cleared');
    } catch (error) {
        console.error('Error clearing user session:', error);
    }
}

/**
 * Start session timeout timer
 * @returns {void}
 */
function startSessionTimer() {
    if (sessionTimer) clearTimeout(sessionTimer);
    
    sessionTimer = setTimeout(() => {
        console.log('⏰ Session expired');
        clearUserSession();
        showToast(CONFIG.ERRORS.SESSION_EXPIRED || 'Session expired', 'warning');
        window.location.href = 'index.html';
    }, SESSION_TIMEOUT);
    
    console.log('⏱️ Session timer started (' + (SESSION_TIMEOUT / 60000) + ' minutes)');
}

/**
 * Extend the current session
 * @returns {boolean} True if session extended successfully
 */
function extendSession() {
    if (!getCurrentUser()) return false;
    
    if (sessionTimer) clearTimeout(sessionTimer);
    startSessionTimer();
    console.log('✅ Session extended');
    return true;
}

/**
 * Get current logged-in user
 * @returns {Object|null} Current user or null
 */
function getCurrentUser() {
    if (!currentUser) {
        currentUser = getUserSession();
    }
    return currentUser;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// ==================== SUPABASE QUERIES ====================

/**
 * Login user with phone and PIN
 * @param {string} phone - User phone number
 * @param {string} pin - User PIN
 * @returns {Promise<Object>} User data if successful
 */
async function loginUser(phone, pin) {
    if (!phone || !pin) {
        throw new Error('Phone and PIN are required');
    }
    
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('users')
            .select('id, phone_number, full_name, role, is_active')
            .eq('phone_number', phone.trim())
            .eq('pin', pin)
            .eq('is_active', true)
            .single();
        
        if (error) {
            console.error('Supabase query error:', error);
            throw new Error(error.message);
        }
        
        if (!data) {
            throw new Error('Invalid credentials');
        }
        
        console.log('✅ Login successful:', data.full_name);
        return data;
    } catch (error) {
        console.error('❌ Login error:', error.message);
        throw error;
    }
}

/**
 * Fetch service categories from database
 * @returns {Promise<Array>} Array of categories
 */
async function fetchCategories() {
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        console.log(`✅ Fetched ${data?.length || 0} categories`);
        return data || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

/**
 * Fetch services by category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Array>} Array of services
 */
async function fetchServicesByCategory(categoryId) {
    if (!categoryId) return [];
    
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('service_items')
            .select('*')
            .eq('category_id', categoryId)
            .eq('is_active', true)
            .eq('is_primary_service', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        console.log(`✅ Fetched ${data?.length || 0} services for category ${categoryId}`);
        return data || [];
    } catch (error) {
        console.error('Error fetching services:', error);
        return [];
    }
}

/**
 * Fetch sub-services
 * @param {string} serviceId - Service ID
 * @returns {Promise<Array>} Array of sub-services
 */
async function fetchSubServices(serviceId) {
    if (!serviceId) return [];
    
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('service_sub_items')
            .select('*')
            .eq('primary_service_id', serviceId)
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching sub-services:', error);
        return [];
    }
}

/**
 * Fetch business settings
 * @returns {Promise<Object>} Business settings object
 */
async function fetchBusinessSettings() {
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('business_settings')
            .select('*')
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        console.log('✅ Fetched business settings');
        return data || {};
    } catch (error) {
        console.error('Error fetching business settings:', error);
        return {};
    }
}

/**
 * Fetch invoices
 * @param {number} limit - Number of invoices to fetch
 * @returns {Promise<Array>} Array of invoices
 */
async function fetchInvoices(limit = 10) {
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        console.log(`✅ Fetched ${data?.length || 0} invoices`);
        return data || [];
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
}

/**
 * Fetch customers
 * @returns {Promise<Array>} Array of customers
 */
async function fetchCustomers() {
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        console.log(`✅ Fetched ${data?.length || 0} customers`);
        return data || [];
    } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
    }
}

/**
 * Save invoice
 * @param {Object} invoiceData - Invoice data to save
 * @returns {Promise<Object>} Saved invoice
 */
async function saveInvoice(invoiceData) {
    if (!invoiceData || typeof invoiceData !== 'object') {
        throw new Error('Invalid invoice data');
    }
    
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('invoices')
            .insert([invoiceData])
            .select();
        
        if (error) throw error;
        console.log('✅ Invoice saved successfully');
        return data?.[0] || null;
    } catch (error) {
        console.error('Error saving invoice:', error);
        throw error;
    }
}

/**
 * Save invoice items
 * @param {Array} items - Invoice items array
 * @returns {Promise<Array>} Saved items
 */
async function saveInvoiceItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Invalid items array');
    }
    
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('invoice_items')
            .insert(items)
            .select();
        
        if (error) throw error;
        console.log(`✅ ${items.length} invoice items saved`);
        return data || [];
    } catch (error) {
        console.error('Error saving invoice items:', error);
        throw error;
    }
}

/**
 * Update business settings
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
async function updateBusinessSettings(settings) {
    if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings object');
    }
    
    try {
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('business_settings')
            .upsert([settings])
            .select();
        
        if (error) throw error;
        console.log('✅ Business settings updated');
        return data?.[0] || null;
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
}

// ==================== VALIDATION ====================

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function validatePhone(phone) {
    const pattern = CONFIG.VALIDATION.PHONE_PATTERN || /^\d{10}$/;
    return pattern.test((phone || '').trim());
}

/**
 * Validate PIN format
 * @param {string} pin - PIN to validate
 * @returns {boolean} True if valid
 */
function validatePIN(pin) {
    const pattern = CONFIG.VALIDATION.PIN_PATTERN || /^\d{6}$/;
    return pattern.test((pin || '').trim());
}

/**
 * Validate GSTIN format
 * @param {string} gstin - GSTIN to validate
 * @returns {boolean} True if valid
 */
function validateGSTIN(gstin) {
    const pattern = CONFIG.VALIDATION.GSTIN_PATTERN || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return pattern.test((gstin || '').trim().toUpperCase());
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test((email || '').trim());
}

// ==================== FORMATTING ====================

/**
 * Format amount as Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    if (isNaN(amount)) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Calculate GST amount
 * @param {number} amount - Amount to calculate GST for
 * @param {number} gstPercentage - GST percentage
 * @returns {number} GST amount
 */
function calculateGST(amount, gstPercentage) {
    if (isNaN(amount) || isNaN(gstPercentage)) return 0;
    return (parseFloat(amount) * parseFloat(gstPercentage)) / 100;
}

/**
 * Format date in Indian format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
function formatDate(date) {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '/');
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}

/**
 * Format date-time in Indian format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date-time string
 */
function formatDateTime(date) {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date-time:', error);
        return '';
    }
}

// ==================== UI UTILITIES ====================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'info', 'success', 'error', 'warning'
 * @returns {HTMLElement} Toast element
 */
function showToast(message, type = 'info') {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = `${icons[type] || icons.info} ${message}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
        info: '#2196F3'
    };
    toast.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
    
    return toast;
}

/**
 * Show or hide global loader
 * @param {boolean} show - True to show, false to hide
 * @returns {void}
 */
function showLoader(show = true) {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 3000;
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = show ? 'flex' : 'none';
}

// ==================== INITIALIZATION ====================

console.log('✅ app.js loaded successfully');

// Check user authentication on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (isAuthenticated()) {
            console.log('✅ User authenticated, starting session timer');
            startSessionTimer();
        }
    });
} else if (isAuthenticated()) {
    console.log('✅ User authenticated, starting session timer');
    startSessionTimer();
}
