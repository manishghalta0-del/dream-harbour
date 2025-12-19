/**
 * Centralized Supabase Initialization Module
 * Uses Supabase REST API directly with proper implementation
 * Supports: SELECT, INSERT, UPDATE, DELETE with all operators
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
        this.method = 'GET';
        this.bodyData = null;
        this.isInsert = false;
        this.isUpdate = false;
        this.isDelete = false;
    }

    // SELECT operators
    eq(field, value) {
        this.filters[field] = { operator: 'eq', value };
        return this;
    }

    ilike(field, value) {
        // Case-insensitive pattern matching
        // Converts 'test' to '*test*' for SQL ILIKE pattern
        const pattern = value.replace(/%/g, '*');
        this.filters[field] = { operator: 'ilike', value: pattern };
        return this;
    }

    gt(field, value) {
        this.filters[field] = { operator: 'gt', value };
        return this;
    }

    lt(field, value) {
        this.filters[field] = { operator: 'lt', value };
        return this;
    }

    gte(field, value) {
        this.filters[field] = { operator: 'gte', value };
        return this;
    }

    lte(field, value) {
        this.filters[field] = { operator: 'lte', value };
        return this;
    }

    neq(field, value) {
        this.filters[field] = { operator: 'neq', value };
        return this;
    }

    // Modifiers
    limit(count) {
        this.limitVal = count;
        return this;
    }

    order(field, options = {}) {
        const direction = options.ascending !== false ? 'asc' : 'desc';
        this.orderVal = `${field}.${direction}`;
        return this;
    }

    // INSERT operation
    insert(data) {
        this.isInsert = true;
        this.method = 'POST';
        this.bodyData = Array.isArray(data) ? data : [data];
        return this;
    }

    // UPDATE operation
    update(data) {
        this.isUpdate = true;
        this.method = 'PATCH';
        this.bodyData = data;
        return this;
    }

    // DELETE operation
    delete() {
        this.isDelete = true;
        this.method = 'DELETE';
        return this;
    }

    // Return response as single object (for inserts/updates)
    single() {
        return this;
    }

    // Select specific columns for response
    select(columns = '*') {
        this.selectCols = columns;
        return this;
    }

    // Execute the query
    async execute() {
        try {
            const result = await this.client.executeQuery(
                this.method,
                this.table,
                {
                    select: this.selectCols,
                    filters: this.filters,
                    limit: this.limitVal,
                    order: this.orderVal,
                    body: this.bodyData
                }
            );
            
            return {
                body: result,
                error: null
            };
        } catch (error) {
            logSupabase(`Execute error: ${error.message}`, 'error');
            return {
                body: null,
                error: error
            };
        }
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
    }

    /**
     * Get headers with API key
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.anonKey}`,
            'apikey': this.anonKey,
            'Prefer': 'return=representation'
        };
    }

    /**
     * Execute REST API call
     */
    async executeQuery(method, table, options = {}) {
        try {
            const url = new URL(`${this.apiUrl}/${table}`);
            
            // CRITICAL: Add API key to URL for Supabase authentication
            url.searchParams.append('apikey', this.anonKey);
            
            // Add select parameter
            if (options.select) {
                url.searchParams.append('select', options.select);
            }
            
            // Add filters with proper operators
            if (options.filters && Object.keys(options.filters).length > 0) {
                Object.entries(options.filters).forEach(([key, filterObj]) => {
                    if (typeof filterObj === 'object' && filterObj.operator) {
                        const { operator, value } = filterObj;
                        url.searchParams.append(key, `${operator}.${value}`);
                    } else {
                        // Fallback for simple values
                        url.searchParams.append(key, `eq.${filterObj}`);
                    }
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
                headers: this.getHeaders()
            };

            // Add body for POST, PATCH, DELETE
            if (method !== 'GET' && options.body) {
                config.body = JSON.stringify(options.body);
            }

            logSupabase(`${method} ${url.toString()}`, 'loading');
            
            const response = await fetch(url.toString(), config);
            
            if (!response.ok) {
                const error = await response.text();
                logSupabase(`API Error ${response.status}: ${error}`, 'error');
                throw new Error(`API Error ${response.status}: ${error}`);
            }

            const data = await response.json();
            
            // For POST/PATCH, data is the inserted/updated record(s)
            // For GET, data is array of records
            // For DELETE, data is typically empty but return it anyway
            // Always return as array for consistency
            if (Array.isArray(data)) {
                return data;
            } else if (data) {
                return [data];
            } else {
                return [];
            }
        } catch (error) {
            logSupabase(`Query error: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * from() - Start a query
     */
    from(table) {
        const self = this;
        return {
            select: (columns = '*') => {
                return new QueryBuilder(self, table, columns);
            },
            insert: (data) => {
                const qb = new QueryBuilder(self, table);
                qb.insert(data);
                return qb;
            },
            update: (data) => {
                const qb = new QueryBuilder(self, table);
                qb.update(data);
                return qb;
            },
            delete: () => {
                const qb = new QueryBuilder(self, table);
                qb.delete();
                return qb;
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
            
            // Verify connection works with a simple query
            try {
                logSupabase('Testing connection to Supabase...', 'loading');
                const result = await supabaseClient.from('business_settings')
                    .select('id')
                    .limit(1)
                    .execute();
                
                if (result && result.body) {
                    logSupabase('✅ Supabase connection verified successfully!', 'success');
                } else {
                    logSupabase('⚠️ Connection test passed but no data returned', 'warning');
                }
            } catch (testError) {
                logSupabase(`⚠️ Connection test warning: ${testError.message}`, 'warning');
                logSupabase('This might be OK if table is empty or doesn\'t exist yet', 'info');
            }

            supabaseReady = true;
            logSupabase('✅ Supabase initialized successfully! Ready to use.', 'success');
            logSupabase('📱 Application is ready for use.', 'info');

            return supabaseClient;
        } catch (error) {
            logSupabase(`❌ Unexpected error: ${error.message}`, 'error');
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