// js/supabase-config.js
console.log('✓ supabase-config.js loading...');

const initializeSupabase = () => {
    const { createClient } = window.supabase;
    
    window.supabase = createClient(
        'http://localhost:3000',  // ← Using localhost proxy
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZXd0ZWNpYmVpa3Z3aGVuayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI3OTExNjc5LCJleHAiOjE4ODU2Nzc2Nzl9.O1PGEZGQYKsEV6mRcO0r-e-d9-5v9nlx7xqT0EcH58E'
    );
    
    console.log('✅ Supabase proxy initialized');
};

if (window.supabase && window.supabase.createClient) {
    initializeSupabase();
} else {
    console.error('⚠️ Supabase library not loaded yet');
}
