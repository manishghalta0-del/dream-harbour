/**
 * Centralized Supabase Initialization Module
 * Uses Supabase REST API directly instead of JavaScript client to avoid module conflicts
 */

'use strict';

let supabaseClient = null;
let supabaseReady = false;
let supabaseInitPromise = null;

// Configuration
const SUPABASE_CONFIG = {
    URL: typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.SUPABASE.URL : 'https://lqrewteclbexiknvhenk.supabase.co',
    ANON_KEY: typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.SUPABASE.ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8'
};

/**
 * Logging utility
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
 * Query Builder class for method chaining
 */
class QueryBuilder {
    constructor(client, table, selectCols = '*') {
        this.client = client;
        this.table = table;
        this.selectCols = selectCols;
        this.filters = {};
        this.limitVal = null;
        this.orderVal = null;
    }

    eq(field, value) {
        this.filters[field] = value;
        return this; // Return self for chaining
    }

    limit(count) {
        this.limitVal = count;
        return this;
    }

    order(field, ascending = true) {
        this.orderVal = `${field}.${ascending ? 'asc' : 'desc'}`;
        return this;
    }

    async execute() {
        const result = await this.client.executeQuery('GET', this.table, {
            select: this.selectCols,
            filters: this.filters,
            limit: this.limitVal,
            order: this.orderVal
        });
        return result;
    }

    async single() {
        const result = await this.client.executeQuery('GET', this.table, {
            select: this.selectCols,
            filters: this.filters,
            limit: 1,
            order: this.orderVal
        });
        // Return first item or null
        return result && result.length > 0 ? result[0] : null;
    }
}

/**
 * Supabase REST API Wrapper
 */
class SupabaseRESTClient {
    constructor(url, anonKey) {
        this.url = url;
        this.anonKey = anonKey;
        this.apiUrl = `${url}/rest/v1`;
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey
        };
    }

    /**
     * Execute REST API call
     */
    async executeQuery(method, table, options = {}) {
        try {
            const url = new URL(`${this.apiUrl}/${table}`);
            
            // Add select parameter
            if (options.select) {
                url.searchParams.append('select', options.select);
            }
            
            // Add filters
            if (options.filters && Object.keys(options.filters).length > 0) {
                Object.entries(options.filters).forEach(([key, value]) => {
                    url.searchParams.append(key, `eq.${value}`);
                });
            }
            
            // Add limit
            if (options.limit) {
                url.searchParams.append('limit', options.limit);
            }
            
            // Add order
            if (options.order) {
                url.searchParams.append('order', options.order);
            }

            const config = {
                method,
                headers: this.headers
            };

            if (method !== 'GET' && options.body) {
                config.body = JSON.stringify(options.body);
            }

            const response = await fetch(url.toString(), config);
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`API Error ${response.status}: ${error}`);
            }

            const data = await response.json();
            return Array.isArray(data) ? data : (data ? [data] : []);
        } catch (error) {
            logSupabase(`Query error: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Query builder - from().select()
     */
    from(table) {
        const self = this;
        return {
            select: (columns = '*') => {
                return new QueryBuilder(self, table, columns);
            }
        };
    }
}

/**
 * Initialize Supabase client using REST API
 */
async function initSupabase() {
    // Return existing promise if already initializing
    if (supabaseInitPromise) {
        logSupabase('Initialization already in progress, using existing promise', 'loading');
        return supabaseInitPromise;
    }

    // Return cached client if already initialized
    if (supabaseReady && supabaseClient !== null) {
        logSupabase('Supabase already initialized, returning cached instance', 'success');
        return supabaseClient;
    }

    // Create initialization promise
    supabaseInitPromise = (async () => {
        try {
            logSupabase('Starting Supabase initialization using REST API...', 'loading');

            // Validate configuration
            if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
                logSupabase('Supabase configuration is invalid or missing', 'error');
                return null;
            }

            // Create REST API client
            supabaseClient = new SupabaseRESTClient(
                SUPABASE_CONFIG.URL,
                SUPABASE_CONFIG.ANON_KEY
            );

            logSupabase('Supabase REST API client created successfully', 'success');
            
            // Verify connection works
            try {
                logSupabase('Testing connection to Supabase...', 'loading');
                const result = await supabaseClient.from('users')
                    .select('id')
                    .limit(1)
                    .execute();
                
                logSupabase('Supabase connection verified successfully!', 'success');
            } catch (testError) {
                logSupabase(`Warning: Could not verify Supabase connection: ${testError.message}`, 'warning');
            }

            supabaseReady = true;
            logSupabase('Supabase initialized successfully! Ready to use.', 'success');
            logSupabase('Application is ready for use.', 'info');

            return supabaseClient;
        } catch (error) {
            logSupabase(`Unexpected error: ${error.message}`, 'error');
            console.error('Full error:', error);
            supabaseReady = false;
            supabaseInitPromise = null;
            return null;
        }
    })();

    return supabaseInitPromise;
}

/**
 * Get the Supabase client
 */
async function getSupabaseClient() {
    if (!supabaseClient || !supabaseReady) {
        supabaseClient = await initSupabase();
    }
    
    if (!supabaseClient) {
        const error = new Error('Failed to initialize Supabase client');
        logSupabase(error.message, 'error');
        throw error;
    }
    
    return supabaseClient;
}

/**
 * Check if Supabase is ready
 */
function isSupabaseReady() {
    return supabaseReady && supabaseClient !== null;
}

/**
 * Reset Supabase
 */
function resetSupabase() {
    logSupabase('Resetting Supabase state...', 'warning');
    supabaseClient = null;
    supabaseReady = false;
    supabaseInitPromise = null;
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
