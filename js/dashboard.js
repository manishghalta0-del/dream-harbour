// js/dashboard.js - Dashboard Session Management

console.log('✓ dashboard.js loaded');

// SIMPLE SESSION CHECK
function checkSession() {
    const session = localStorage.getItem('userSession');
    
    if (!session) {
        console.log('❌ No session - redirecting to login');
        window.location.href = 'index.html';
        return false;
    }
    
    console.log('✅ Session valid');
    return true;
}

// LOAD DASHBOARD
window.addEventListener('load', function() {
    console.log('📍 Dashboard loading...');
    
    // Check session first
    if (!checkSession()) {
        return;
    }
    
    // Show dashboard
    console.log('✅ Showing dashboard');
    showPage('dashboard');
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load services for invoice page
    loadServices();
});

// PAGE ROUTING
function showPage(pageName) {
    console.log('📄 Showing page:', pageName);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(pageName + '-page');
    if (pageElement) {
        pageElement.classList.add('active');
        console.log('✅ Page displayed:', pageName);
    }
}

// UPDATE DATE & TIME
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const dateDisplay = document.getElementById('date-display');
    if (dateDisplay) {
        dateDisplay.textContent = now.toLocaleDateString('en-IN', options);
    }
}

// LOGOUT
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userSession');
        localStorage.removeItem('userPhone');
        console.log('🔓 Logged out');
        window.location.href = 'index.html';
    }
}

console.log('✓ dashboard.js initialized');
