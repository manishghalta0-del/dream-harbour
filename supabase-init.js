/**
 * Centralized Supabase Initialization Module
 * Ensures Supabase is loaded and initialized only once globally
 * All pages should use this instead of duplicating initialization logic
 * 
 * IMPORTANT: This file handles loading the Supabase library from CDN.
 * Do NOT add <script src="@supabase/supabase-js"> in HTML files.
 * Only include this file and let it handle the library loading.
 * 
 * Usage: const client = await getSupabaseClient();
 */

'use strict';

let supabase = null;
let supabaseReady = false;
let supabaseInitPromise = null;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// Configuration (can be overridden from config.js if loaded)
const SUPABASE_CONFIG = {
    URL: typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.SUPABASE.URL : 'https://lqrewteclbexiknvhenk.supabase.co',
    ANON_KEY: typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.SUPABASE.ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8'
};

/**
 * Logging utility for consistent console output
 * @param {string} message - Message to log
 * @param {string} type - Log type: 'info', 'success', 'error', 'warning'
 */
function logSupabase(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('en-IN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        loading: '⏳'
    };
    
    const icon = icons[type] || icons.info;
    const styles = {
        info: 'color: #2196F3;',
        success: 'color: #4CAF50;',
        error: 'color: #F44336;',
        warning: 'color: #FF9800;',
        loading: 'color: #9C27B0;'
    };
    
    console.log(`%c[${icon}] [${timestamp}] ${message}`, styles[type]);
}

/**
 * Check if Supabase library is available in window
 * Handles multiple naming conventions and library formats
 * @returns {boolean} True if Supabase is available
 */
function isSupabaseAvailable() {
    try {
        // Try window.supabase (UMD builds)
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            return true;
        }
        // Try window.supabaseJs (alternative naming)
        if (typeof window.supabaseJs !== 'undefined' && typeof window.supabaseJs.createClient === 'function') {
            return true;
        }
        // Try window.__SUPABASE__ (alternative global)
        if (typeof window.__SUPABASE__ !== 'undefined' && typeof window.__SUPABASE__.createClient === 'function') {
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * Get Supabase library from window (handles different naming conventions)
 * @returns {Object|null} Supabase library or null
 */
function getSupabaseLibrary() {
    try {
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            return window.supabase;
        }
        if (typeof window.supabaseJs !== 'undefined' && typeof window.supabaseJs.createClient === 'function') {
            return window.supabaseJs;
        }
        if (typeof window.__SUPABASE__ !== 'undefined' && typeof window.__SUPABASE__.createClient === 'function') {
            return window.__SUPABASE__;
        }
    } catch (e) {
        console.error('Error accessing Supabase library:', e);
    }
    return null;
}

/**
 * Load Supabase via inline code to avoid module conflicts
 * This avoids the jsdelivr header issue completely
 */
function createSupabaseClientInline() {
    return new Promise((resolve) => {
        // If already available, return it
        if (isSupabaseAvailable()) {
            logSupabase('Supabase already available globally', 'success');
            resolve(true);
            return;
        }

        logSupabase('Loading Supabase using inline approach...', 'loading');

        // Load the library from a different CDN to avoid header conflicts
        const script = document.createElement('script');
        // Use unpkg which provides clean UMD without problematic headers
        script.src = 'https://unpkg.com/@supabase/supabase-js@2';
        script.type = 'application/javascript';
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        let timeoutId = null;
        let loaded = false;

        script.onload = () => {
            loaded = true;
            if (timeoutId) clearTimeout(timeoutId);
            logSupabase('Supabase library loaded, waiting for availability...', 'info');
            
            // Wait for library to be available
            let checkCount = 0;
            const checkInterval = setInterval(() => {
                checkCount++;
                if (isSupabaseAvailable()) {
                    clearInterval(checkInterval);
                    logSupabase('Supabase library available in window', 'success');
                    resolve(true);
                } else if (checkCount >= 50) { // 5 seconds
                    clearInterval(checkInterval);
                    logSupabase('Timeout waiting for library availability', 'error');
                    resolve(false);
                }
            }, 100);
        };

        script.onerror = (error) => {
            loaded = true;
            if (timeoutId) clearTimeout(timeoutId);
            logSupabase(`Failed to load Supabase from CDN: ${error}`, 'error');
            resolve(false);
        };

        // Set timeout
        timeoutId = setTimeout(() => {
            if (!loaded) {
                logSupabase('CDN load timeout, trying fallback...', 'warning');
                resolve(false);
            }
        }, 20000); // 20 second timeout

        // Attempt to insert
        try {
            document.head.appendChild(script);
        } catch (e) {
            logSupabase(`Failed to append script: ${e.message}`, 'error');
            resolve(false);
        }
    });
}

/**
 * Initialize Supabase client with error handling and retry logic
 * @returns {Promise<Object|null>} Supabase client or null if initialization failed
 */
async function initSupabase() {
    // Return existing promise if already initializing
    if (supabaseInitPromise) {
        logSupabase('Initialization already in progress, using existing promise', 'loading');
        return supabaseInitPromise;
    }

    // Return cached client if already initialized
    if (supabaseReady && supabase !== null) {
        logSupabase('Supabase already initialized, returning cached instance', 'success');
        return supabase;
    }

    // Create initialization promise
    supabaseInitPromise = (async () => {
        try {
            logSupabase(`Starting Supabase initialization (attempt ${initializationAttempts + 1}/${MAX_INIT_ATTEMPTS})...`, 'loading');
            initializationAttempts++;

            // Try to load the library
            const libraryLoaded = await createSupabaseClientInline();
            
            if (!libraryLoaded) {
                logSupabase('Failed to load Supabase library from CDN', 'error');
                
                // Retry
                if (initializationAttempts < MAX_INIT_ATTEMPTS) {
                    logSupabase('Retrying in 3 seconds...', 'warning');
                    supabaseInitPromise = null;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return initSupabase();
                }
                
                return null;
            }

            // Get the library from window
            const supabaseLib = getSupabaseLibrary();
            if (!supabaseLib) {
                logSupabase('Supabase library not found in window object after load', 'error');
                
                if (initializationAttempts < MAX_INIT_ATTEMPTS) {
                    logSupabase('Retrying in 3 seconds...', 'warning');
                    supabaseInitPromise = null;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return initSupabase();
                }
                
                return null;
            }

            // Verify createClient method exists
            if (typeof supabaseLib.createClient !== 'function') {
                logSupabase('supabase.createClient is not a function', 'error');
                
                if (initializationAttempts < MAX_INIT_ATTEMPTS) {
                    logSupabase('Retrying in 3 seconds...', 'warning');
                    supabaseInitPromise = null;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return initSupabase();
                }
                
                return null;
            }

            // Validate configuration
            if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
                logSupabase('Supabase configuration is invalid or missing', 'error');
                return null;
            }

            // Create client
            logSupabase('Creating Supabase client with provided credentials...', 'loading');
            try {
                supabase = supabaseLib.createClient(
                    SUPABASE_CONFIG.URL,
                    SUPABASE_CONFIG.ANON_KEY
                );
            } catch (createError) {
                logSupabase(`Failed to create Supabase client: ${createError.message}`, 'error');
                supabaseInitPromise = null;
                return null;
            }

            // Verify client was created and is valid
            if (!supabase || typeof supabase.from !== 'function') {
                logSupabase('Supabase client created but invalid (missing methods)', 'error');
                supabaseInitPromise = null;
                return null;
            }

            supabaseReady = true;
            logSupabase('Supabase initialized successfully! Ready to use.', 'success');
            logSupabase('Application is ready for use.', 'info');

            return supabase;
        } catch (error) {
            logSupabase(`Unexpected error: ${error.message}`, 'error');
            console.error('Full error:', error);
            supabaseReady = false;
            supabaseInitPromise = null;
            
            if (initializationAttempts < MAX_INIT_ATTEMPTS) {
                logSupabase('Retrying in 3 seconds...', 'warning');
                await new Promise(resolve => setTimeout(resolve, 3000));
                return initSupabase();
            }
            
            return null;
        }
    })();

    return supabaseInitPromise;
}

/**
 * Get the Supabase client (waits for initialization if needed)
 * Use this in your functions to ensure Supabase is ready
 * @returns {Promise<Object>} Initialized Supabase client
 * @throws {Error} If Supabase client cannot be initialized
 */
async function getSupabaseClient() {
    if (!supabase || !supabaseReady) {
        supabase = await initSupabase();
    }
    
    if (!supabase) {
        const error = new Error('Failed to initialize Supabase client');
        logSupabase(error.message, 'error');
        throw error;
    }
    
    return supabase;
}

/**
 * Check if Supabase is ready without waiting
 * @returns {boolean} True if Supabase is initialized, false otherwise
 */
function isSupabaseReady() {
    return supabaseReady && supabase !== null;
}

/**
 * Reset Supabase initialization (useful for testing)
 * Use with caution - will force re-initialization on next call
 */
function resetSupabase() {
    logSupabase('Resetting Supabase state...', 'warning');
    supabase = null;
    supabaseReady = false;
    supabaseInitPromise = null;
    initializationAttempts = 0;
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        logSupabase('DOM loaded, auto-initializing Supabase...', 'info');
        initSupabase().catch(err => {
            logSupabase(`Auto-initialization error: ${err.message}`, 'error');
        });
    });
} else {
    logSupabase('DOM already loaded, auto-initializing Supabase...', 'info');
    initSupabase().catch(err => {
        logSupabase(`Auto-initialization error: ${err.message}`, 'error');
    });
}
