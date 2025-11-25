// ============================================================================
// js/common.js - Shared Functions Used Across Multiple Pages
// ============================================================================

// Check if user is logged in, redirect to login if not
function checkLoginStatus() {
    const user = localStorage.getItem('dreamHarbourUser');
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(user);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('dreamHarbourUser');
        localStorage.removeItem('userSession');
        window.location.href = 'index.html';
    }
}

// Format currency (Indian Rupees)
function formatCurrency(amount) {
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    // Simple alert for now - can be enhanced with custom toast UI
    alert(message);
}

// Navigate to page
function navigateTo(page) {
    window.location.href = `${page}.html`;
}

// Export dashboard as PDF (placeholder)
function exportDashboardPDF() {
    alert('PDF export feature coming soon!');
}

// Initialize page - check login on page load
document.addEventListener('DOMContentLoaded', () => {
    const user = checkLoginStatus();    
});

