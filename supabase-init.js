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
 * Handles both @supabase/supabase-js and supabaseJs naming conventions
 * @returns {boolean} True if Supabase is available
 */
function isSupabaseAvailable() {
    return (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') ||
           (typeof window.supabaseJs !== 'undefined' && typeof window.supabaseJs.createClient === 'function');
}

/**
 * Get Supabase library from window (handles different naming conventions)
 * @returns {Object|null} Supabase library or null
 */
function getSupabaseLibrary() {
    // Try standard window.supabase first
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        return window.supabase;
    }
    // Try alternative window.supabaseJs
    if (typeof window.supabaseJs !== 'undefined' && typeof window.supabaseJs.createClient === 'function') {
        return window.supabaseJs;
    }
    return null;
}

/**
 * Load the Supabase library from CDN
 * Handles race conditions with multiple simultaneous load attempts
 * @returns {Promise<boolean>} True if library loaded, false otherwise
 */
function loadSupabaseLibrary() {
    return new Promise((resolve) => {
        // Check if library is already loaded
        if (isSupabaseAvailable()) {
            logSupabase('Supabase library already available in window', 'success');
            resolve(true);
            return;
        }

        // Check if script is already loading
        const existingScript = document.querySelector('script[src*="@supabase/supabase-js"]');
        if (existingScript && existingScript.getAttribute('data-loading') === 'true') {
            // Script is already loading, wait for it
            logSupabase('Supabase script already loading, waiting for library...', 'loading');
            
            let attempts = 0;
            const maxAttempts = 100; // ~10 seconds timeout
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (isSupabaseAvailable()) {
                    clearInterval(checkInterval);
                    logSupabase('Supabase library ready in window', 'success');
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    logSupabase('Timeout waiting for Supabase library', 'error');
                    resolve(false);
                }
            }, 100);
            return;
        }

        // Load library from CDN
        logSupabase('Loading Supabase library from CDN...', 'loading');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        script.type = 'text/javascript';
        script.setAttribute('data-loading', 'true');
        
        script.onload = () => {
            script.setAttribute('data-loading', 'false');
            // Give a small delay for the library to be available in window
            setTimeout(() => {
                if (isSupabaseAvailable()) {
                    logSupabase('Supabase library loaded and available', 'success');
                    resolve(true);
                } else {
                    logSupabase('Supabase library loaded but not found in window object', 'warning');
                    // Try once more
                    setTimeout(() => {
                        if (isSupabaseAvailable()) {
                            logSupabase('Supabase library now available in window', 'success');
                            resolve(true);
                        } else {
                            logSupabase('Failed to access Supabase library', 'error');
                            resolve(false);
                        }
                    }, 200);
                }
            }, 200);
        };
        
        script.onerror = (error) => {
            script.setAttribute('data-loading', 'false');
            logSupabase('Failed to load Supabase library from CDN: ' + error, 'error');
            resolve(false);
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Initialize Supabase client with error handling and retry logic
 * This is called only once, subsequent calls return the cached promise
 * @returns {Promise<Object|null>} Supabase client or null if initialization failed
 */
async function initSupabase() {
    // Return existing promise if already initializing
    if (supabaseInitPromise) {
        logSupabase('Initialization already in progress, returning existing promise', 'loading');
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
            logSupabase('Starting Supabase initialization (attempt ' + (initializationAttempts + 1) + '/' + MAX_INIT_ATTEMPTS + ')...', 'loading');
            initializationAttempts++;

            // Load library
            const libraryLoaded = await loadSupabaseLibrary();
            if (!libraryLoaded) {
                logSupabase('Failed to load Supabase library', 'error');
                supabaseInitPromise = null; // Reset for retry
                return null;
            }

            // Get the library from window
            const supabaseLib = getSupabaseLibrary();
            if (!supabaseLib) {
                logSupabase('Supabase library not found in window object', 'error');
                supabaseInitPromise = null;
                return null;
            }

            // Verify createClient method exists
            if (typeof supabaseLib.createClient !== 'function') {
                logSupabase('supabase.createClient is not a function', 'error');
                supabaseInitPromise = null;
                return null;
            }

            // Validate configuration
            if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
                logSupabase('Supabase configuration is invalid or missing', 'error');
                supabaseInitPromise = null;
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
                logSupabase('Failed to create Supabase client: ' + createError.message, 'error');
                supabaseInitPromise = null;
                return null;
            }

            // Verify client was created
            if (!supabase || typeof supabase.from !== 'function') {
                logSupabase('Supabase client created but invalid (missing methods)', 'error');
                supabaseInitPromise = null;
                return null;
            }

            supabaseReady = true;
            logSupabase('Supabase initialized successfully! Ready to use.', 'success');

            return supabase;
        } catch (error) {
            logSupabase(`Unexpected error during initialization: ${error.message}`, 'error');
            console.error('Full error details:', error);
            supabaseReady = false;
            supabaseInitPromise = null; // Reset for retry
            
            // Retry logic
            if (initializationAttempts < MAX_INIT_ATTEMPTS) {
                logSupabase(`Retrying initialization in 2 seconds...`, 'warning');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return initSupabase();
            }
            
            logSupabase(`Gave up after ${MAX_INIT_ATTEMPTS} attempts`, 'error');
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
        logSupabase('DOM loaded, starting auto-initialization...', 'info');
        initSupabase().catch(err => {
            logSupabase(`Auto-initialization error: ${err.message}`, 'error');
        });
    });
} else {
    logSupabase('DOM already loaded, starting auto-initialization...', 'info');
    initSupabase().catch(err => {
        logSupabase(`Auto-initialization error: ${err.message}`, 'error');
    });
}
