// js/supabase-config.js
console.log('✓ Loading Supabase configuration...');

// Create global supabase instance when library is ready
const initializeSupabase = () => {
    const { createClient } = window.supabase;
    
    window.supabase = createClient(
        'https://qrewtecibeikvwhenk.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZXd0ZWNpYmVpa3Z3aGVuayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI3OTExNjc5LCJleHAiOjE4ODU2Nzc2Nzl9.O1PGEZGQYKsEV6mRcO0r-e-d9-5v9nlx7xqT0EcH58E'
    );
    
    console.log('✅ Supabase initialized');
};

if (window.supabase && window.supabase.createClient) {
    initializeSupabase();
} else {
    console.error('⚠️ Supabase library not loaded yet');
}
