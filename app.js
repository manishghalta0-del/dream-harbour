// Dream Harbour - Core Application Utilities
// Comprehensive Supabase integration and utilities

let supabase = null;
let currentUser = null;
let sessionTimer = null;
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// ==================== SUPABASE INITIALIZATION ====================
async function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        setTimeout(initSupabase, 100);
        return;
    }
    
    try {
        const SUPABASE_URL = 'https://lqrewteclbexiknvhenk.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NzAxODUsImV4cCI6MjA0NTI0NjE4NX0.E9Z-6DH7V-eVaM3_J0Kj8xzH6Py5W_Y_K8L9M0N1O2P';
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        logDebug('Supabase initialized successfully', 'success');
        
        // Check if user already logged in
        const savedUser = getUserSession();
        if (savedUser) {
            startSessionTimer();
        }
    } catch (error) {
        logDebug(`Supabase init error: ${error.message}`, 'error');
    }
}

// ==================== USER MANAGEMENT ====================
function saveUserSession(user) {
    currentUser = user;
    localStorage.setItem('dreamHarbourUser', JSON.stringify(user));
    localStorage.setItem('sessionStartTime', Date.now().toString());
    logDebug(`User logged in: ${user.full_name}`, 'success');
    startSessionTimer();
}

function getUserSession() {
    currentUser = JSON.parse(localStorage.getItem('dreamHarbourUser') || 'null');
    return currentUser;
}

function clearUserSession() {
    currentUser = null;
    localStorage.removeItem('dreamHarbourUser');
    localStorage.removeItem('sessionStartTime');
    if (sessionTimer) clearTimeout(sessionTimer);
}

function startSessionTimer() {
    if (sessionTimer) clearTimeout(sessionTimer);
    sessionTimer = setTimeout(() => {
        clearUserSession();
        showToast('Session expired. Please login again.', 'warning');
        window.location.href = 'index.html';
    }, SESSION_TIMEOUT);
}

// ==================== SUPABASE QUERIES ====================
async function loginUser(phone, pin) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', phone.trim())
            .eq('pin', pin)
            .eq('is_active', true)
            .single();
        
        if (error || !data) {
            throw new Error('Invalid credentials or account inactive');
        }
        
        return data;
    } catch (error) {
        logDebug(`Login error: ${error.message}`, 'error');
        throw error;
    }
}

async function fetchCategories() {
    try {
        const { data, error } = await supabase
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        logDebug(`Error fetching categories: ${error.message}`, 'error');
        return [];
    }
}

async function fetchServicesByCategory(categoryId) {
    try {
        const { data, error } = await supabase
            .from('service_items')
            .select('*')
            .eq('category_id', categoryId)
            .eq('is_active', true)
            .eq('is_primary_service', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        logDebug(`Error fetching services: ${error.message}`, 'error');
        return [];
    }
}

async function fetchSubServices(serviceId) {
    try {
        const { data, error } = await supabase
            .from('service_sub_items')
            .select('*')
            .eq('primary_service_id', serviceId)
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        logDebug(`Error fetching sub-services: ${error.message}`, 'error');
        return [];
    }
}

async function fetchBusinessSettings() {
    try {
        const { data, error } = await supabase
            .from('business_settings')
            .select('*')
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data || {};
    } catch (error) {
        logDebug(`Error fetching business settings: ${error.message}`, 'error');
        return {};
    }
}

async function fetchInvoices(limit = 10) {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        logDebug(`Error fetching invoices: ${error.message}`, 'error');
        return [];
    }
}

async function fetchCustomers() {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        logDebug(`Error fetching customers: ${error.message}`, 'error');
        return [];
    }
}

async function saveInvoice(invoiceData) {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .insert([invoiceData])
            .select();
        
        if (error) throw error;
        logDebug('Invoice saved successfully', 'success');
        return data?.[0] || null;
    } catch (error) {
        logDebug(`Error saving invoice: ${error.message}`, 'error');
        throw error;
    }
}

async function saveInvoiceItems(items) {
    try {
        const { data, error } = await supabase
            .from('invoice_items')
            .insert(items)
            .select();
        
        if (error) throw error;
        logDebug(`${items.length} invoice items saved`, 'success');
        return data || [];
    } catch (error) {
        logDebug(`Error saving invoice items: ${error.message}`, 'error');
        throw error;
    }
}

async function updateBusinessSettings(settings) {
    try {
        const { data, error } = await supabase
            .from('business_settings')
            .upsert([settings]);
        
        if (error) throw error;
        logDebug('Business settings updated', 'success');
        return data?.[0] || null;
    } catch (error) {
        logDebug(`Error updating settings: ${error.message}`, 'error');
        throw error;
    }
}

// ==================== UI UTILITIES ====================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 4000);
}

function showLoader(show = true) {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// ==================== DEBUG CONSOLE ====================
const debugLogs = [];

function logDebug(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const log = { time, message, type };
    debugLogs.push(log);
    
    const debugConsole = document.getElementById('debug-console');
    if (debugConsole) {
        const logEntry = document.createElement('div');
        logEntry.className = `debug-log debug-${type}`;
        logEntry.textContent = `[${time}] ${type.toUpperCase()}: ${message}`;
        debugConsole.appendChild(logEntry);
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }
    
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// ==================== VALIDATORS ====================
function validatePhone(phone) {
    return /^\d{10}$/.test(phone.trim());
}

function validatePIN(pin) {
    return /^\d{6}$/.test(pin.trim());
}

function validateGSTIN(gstin) {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase());
}

// ==================== UTILITIES ====================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function calculateGST(amount, gstPercentage) {
    return (amount * gstPercentage) / 100;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
}

// Initialize Supabase on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}
