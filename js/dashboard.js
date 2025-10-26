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

// LOAD SERVICES (Required by dashboard.html)
function loadServices() {
    console.log('📍 Loading services...');
    // Demo services - will integrate with database later
    const services = [
        { id: 1, name: 'Photocopy & Printing', price: '₹5', description: 'Per page' },
        { id: 2, name: 'Aadhaar-PAN Linking', price: '₹100', description: 'One time' },
        { id: 3, name: 'Document Certification', price: '₹50', description: 'Per document' },
        { id: 4, name: 'Money Transfer', price: 'Variable', description: 'Based on amount' },
        { id: 5, name: 'Online Certificates', price: '₹0-500', description: 'Various types' },
        { id: 6, name: 'GST Compliance', price: 'Consultation', description: 'Variable' }
    ];
    
    console.log('✅ Services loaded:', services);
    return services;
}

// LOAD DASHBOARD DATA
function loadDashboard() {
    console.log('📊 Loading dashboard...');
    return {
        totalInvoices: 24,
        totalEarnings: '₹45,320',
        todayEarnings: '₹2,850',
        activeServices: 6
    };
}

// LOAD INVOICES
function loadInvoices() {
    console.log('📄 Loading invoices...');
    return [
        { id: 'INV-001', customer: 'Acme Corp', amount: '₹2,500', date: '2025-10-26', status: 'Paid' },
        { id: 'INV-002', customer: 'Tech Solutions', amount: '₹1,850', date: '2025-10-25', status: 'Pending' },
        { id: 'INV-003', customer: 'Global Services', amount: '₹3,200', date: '2025-10-24', status: 'Paid' }
    ];
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
    
    // Load services (this is what was missing!)
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
    } else {
        console.warn('⚠️ Page element not found:', pageName + '-page');
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
