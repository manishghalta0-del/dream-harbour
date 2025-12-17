// Dream Harbour - Core Application Utilities
// Comprehensive Supabase integration and utilities

let supabase = null;
let currentUser = null;
let sessionTimer = null;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes (increased from 5 for better UX)
let supabaseInitialized = false;

// ==================== SUPABASE INITIALIZATION ====================
async function initSupabase() {
    // Prevent multiple initialization attempts
    if (supabaseInitialized) {
        return Promise.resolve(supabase);
    }

    // Check if Supabase library is available
    if (typeof window.supabase === 'undefined') {
        console.log('⏳ Supabase library not yet loaded, retrying in 200ms...');
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(initSupabase());
            }, 200);
        });
    }

    // Check if createClient method exists
    if (typeof window.supabase.createClient !== 'function') {
        console.log('⏳ Supabase createClient not yet available, retrying in 200ms...');
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(initSupabase());
            }, 200);
        });
    }
    
    try {
        const SUPABASE_URL = 'https://lqrewteclbexiknvhenk.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NzAxODUsImV4cCI6MjA0NTI0NjE4NX0.E9Z-6DH7V-eVaM3_J0Kj8xzH6Py5W_Y_K8L9M0N1O2P';
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseInitialized = true;
        console.log('✅ Supabase initialized successfully');
        
        // Check if user already logged in
        const savedUser = getUserSession();
        if (savedUser) {
            startSessionTimer();
        }
        
        return supabase;
    } catch (error) {
        console.error(`❌ Supabase init error: ${error.message}`);
        supabaseInitialized = false;
        // Retry on error
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(initSupabase());
            }, 500);
        });
    }
}

// ==================== USER MANAGEMENT ====================
function saveUserSession(user) {
    currentUser = user;
    localStorage.setItem('dreamHarbourUser', JSON.stringify(user));
    localStorage.setItem('sessionStartTime', Date.now().toString());
    console.log(`✅ User logged in: ${user.full_name}`);
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
        // Ensure Supabase is initialized
        await initSupabase();
        
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
        console.error(`❌ Login error: ${error.message}`);
        throw error;
    }
}

async function fetchCategories() {
    try {
        // Ensure Supabase is initialized
        await initSupabase();
        
        const { data, error } = await supabase
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`❌ Error fetching categories: ${error.message}`);
        return [];
    }
}

async function fetchServicesByCategory(categoryId) {
    try {
        // Ensure Supabase is initialized
        await initSupabase();
        
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
        console.error(`❌ Error fetching services: ${error.message}`);
        return [];
    }
}

async function fetchSubServices(serviceId) {
    try {
        // Ensure Supabase is initialized
        await initSupabase();
        
        const { data, error } = await supabase
            .from('service_sub_items')
            .select('*')
            .eq('primary_service_id', serviceId)
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`❌ Error fetching sub-services: ${error.message}`);
        return [];
    }
}

async function fetchBusinessSettings() {
    try {
        // Ensure Supabase is initialized
        await initSupabase();
        
        const { data, error } = await supabase
            .from('business_settings')
            .select('*')
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data || {};
    } catch (error) {
        console.error(`❌ Error fetching business settings: ${error.message}`);
        return {};
    }
}

async function fetchInvoices(limit = 10) {
    try {
        // Ensure Supabase is initialized
        await initSupabase();
        
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`❌ Error fetching invoices: ${error.message}`);
        return [];
    }
}

async function fetchCustomers() {
    try {
        // Ensure Supabase is initialized
        await initSupabase();
        
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`❌ Error fetching customers: ${error.message}`);
        return [];
    }
}

async function saveInvoice(invoiceData) {
    try {
        // Ensure Supabase is initialized
        await initSupabase();
        
        const { data, error } = await supabase
            .from('invoices')
            .insert([invoiceData])
            .select();
        
        if (error) throw error;
        console.log('✅ Invoice saved successfully');
        return data?.[0] || null;
    } catch (error) {
        console.error(`❌ Error saving invoice: ${error.message}`);
        throw error;
    }
}

async function saveInvoiceItems(items) {
    try {
        // Ensure Supabase is initialized
        await initSupabase();
        
        const { data, error } = await supabase
            .from('invoice_items')
            .insert(items)
            .select();
        
        if (error) throw error;
        console.log(`✅ ${items.length} invoice items saved`);
        return data || [];
    } catch (error) {
        console.error(`❌ Error saving invoice items: ${error.message}`);
        throw error;
    }
}

async function updateBusinessSettings(settings) {
    try {
        // Ensure Supabase is initialized
        await initSupabase();
        
        const { data, error } = await supabase
            .from('business_settings')
            .upsert([settings]);
        
        if (error) throw error;
        console.log('✅ Business settings updated');
        return data?.[0] || null;
    } catch (error) {
        console.error(`❌ Error updating settings: ${error.message}`);
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

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
}

// Initialize Supabase on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM content loaded, initializing Supabase...');
        initSupabase();
    });
} else {
    console.log('📄 DOM already loaded, initializing Supabase...');
    initSupabase();
}
