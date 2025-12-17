/**
 * Centralized Supabase Initialization Module
 * Ensures Supabase is loaded and initialized only once
 * All pages should use this instead of duplicating initialization logic
 */

let supabase = null;
let supabaseReady = false;
let supabaseInitPromise = null;

const SUPABASE_CONFIG = {
    URL: 'https://lqrewteclbexiknvhenk.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8'
};

/**
 * Load the Supabase library from CDN
 * @returns {Promise<boolean>} True if library loaded, false otherwise
 */
function loadSupabaseLibrary() {
    return new Promise((resolve) => {
        // If already loaded
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            console.log('✅ Supabase library already in window');
            resolve(true);
            return;
        }

        // Load from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        
        script.onload = () => {
            console.log('✅ Supabase library loaded from CDN');
            resolve(true);
        };
        
        script.onerror = () => {
            console.error('❌ Failed to load Supabase library from CDN');
            resolve(false);
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Initialize Supabase client
 * This is called only once, subsequent calls return the cached promise
 * @returns {Promise<Object|null>} Supabase client or null if initialization failed
 */
async function initSupabase() {
    // Return existing promise if already initializing
    if (supabaseInitPromise) {
        console.log('⏳ Supabase initialization already in progress, returning existing promise');
        return supabaseInitPromise;
    }

    // Return cached client if already initialized
    if (supabaseReady && supabase) {
        console.log('✅ Supabase already initialized, returning cached client');
        return supabase;
    }

    // Create initialization promise
    supabaseInitPromise = (async () => {
        try {
            console.log('🚀 Starting Supabase initialization...');

            // Load the library first
            const libraryLoaded = await loadSupabaseLibrary();
            if (!libraryLoaded) {
                console.error('❌ Failed to load Supabase library');
                return null;
            }

            // Verify library is available
            if (typeof window.supabase === 'undefined') {
                console.error('❌ window.supabase is undefined after loading');
                return null;
            }

            if (typeof window.supabase.createClient !== 'function') {
                console.error('❌ window.supabase.createClient is not a function');
                return null;
            }

            // Create client
            console.log('🔗 Creating Supabase client...');
            supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

            supabaseReady = true;
            console.log('✅ Supabase initialized successfully!');
            console.log('✅ Ready to login.');

            return supabase;
        } catch (error) {
            console.error(`❌ Supabase initialization error: ${error.message}`);
            supabaseReady = false;
            supabaseInitPromise = null; // Reset promise so retry works
            return null;
        }
    })();

    return supabaseInitPromise;
}

/**
 * Get the Supabase client (waits for initialization if needed)
 * Use this in your functions to ensure Supabase is ready
 * @returns {Promise<Object>} Initialized Supabase client
 */
async function getSupabaseClient() {
    if (!supabase || !supabaseReady) {
        supabase = await initSupabase();
    }
    if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
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

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM loaded, auto-initializing Supabase...');
        initSupabase();
    });
} else {
    console.log('📄 DOM already loaded, auto-initializing Supabase...');
    initSupabase();
}
