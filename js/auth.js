// js/auth.js - Authentication Management

console.log('✓ auth.js loaded');

// CHECK IF ALREADY LOGGED IN
window.addEventListener('load', function() {
    console.log('📍 Checking authentication...');
    
    const currentPage = window.location.pathname;
    console.log('Current page:', currentPage);
    
    const session = localStorage.getItem('userSession');
    console.log('Session found:', !!session);
    
    // If on login page and already logged in
    if (currentPage.includes('index.html') || currentPage === '/') {
        if (session) {
            console.log('✅ Already logged in - redirecting to dashboard');
            window.location.href = 'dashboard.html';
        }
    }
    
    // If on dashboard and NOT logged in
    if (currentPage.includes('dashboard.html')) {
        if (!session) {
            console.log('❌ Not logged in - redirecting to login');
            window.location.href = 'index.html';
        }
    }
});

// LOGIN FUNCTION
async function login() {
    const phone = document.getElementById('phone')?.value?.trim();
    const pin = document.getElementById('pin')?.value?.trim();
    
    console.log('🔐 Attempting login with phone:', phone);
    
    if (!phone || !pin) {
        alert('Enter both phone and PIN');
        return;
    }
    
    if (!/^\d{10}$/.test(phone)) {
        alert('Enter valid 10-digit phone number');
        return;
    }
    
    try {
        // Verify against Supabase
        const { data: users, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('phone_number', phone)
            .eq('pin', pin)
            .single();
        
        if (error || !users) {
            console.error('❌ Login failed:', error);
            alert('❌ Invalid phone or PIN');
            return;
        }
        
        // SAVE SESSION
        localStorage.setItem('userSession', JSON.stringify({
            phone: phone,
            loginTime: new Date().toISOString(),
            id: users.id
        }));
        
        localStorage.setItem('userPhone', phone);
        
        console.log('✅ Login successful for:', phone);
        console.log('🔄 Redirecting to dashboard...');
        
        // REDIRECT TO DASHBOARD
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error during login: ' + error.message);
    }
}

console.log('✓ auth.js initialized');
