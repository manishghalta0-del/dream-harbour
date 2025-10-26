// js/dashboard.js - Session & Page Routing Management

console.log('✓ dashboard.js loaded');

// CHECK SESSION ON PAGE LOAD
window.addEventListener('load', async function() {
    console.log('📍 Page loaded - checking session...');
    
    const session = localStorage.getItem('userSession');
    if (!session) {
        console.log('❌ No session - redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Session found - loading dashboard');
    showPage('dashboard');
    updateDateTime();
    setInterval(updateDateTime, 1000);
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
    
    // Update menu highlighting
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Initialize page-specific functions
    if (pageName === 'invoice') {
        loadServices();
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
    document.getElementById('date-display').textContent = now.toLocaleDateString('en-IN', options);
}

// LOGOUT
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userSession');
        localStorage.removeItem('userPhone');
        window.location.href = 'index.html';
    }
}

console.log('✓ dashboard.js initialized');
