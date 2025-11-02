// Supabase Configuration
const SUPABASE_URL = 'https://lqrewteclbexiknvhenk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global Variables
let currentUser = null;

// ============================================
// SESSION MANAGEMENT
// ============================================

function checkSession() {
    const userData = localStorage.getItem('dreamHarbourUser');
    if (!userData) {
        window.location.href = 'index.html';
        return false;
    }
    currentUser = JSON.parse(userData);
    return true;
}

function logout() {
    localStorage.removeItem('dreamHarbourUser');
    currentUser = null;
    window.location.href = 'index.html';
}

function storeSession(userData) {
    localStorage.setItem('dreamHarbourUser', JSON.stringify(userData));
    currentUser = userData;
}

function getCurrentUser() {
    return currentUser;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatCurrencyWithDecimals(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function validatePhoneNumber(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

function validatePIN(pin) {
    const pinRegex = /^[0-9]{4}$/;
    return pinRegex.test(pin);
}

function showAlert(message, type = 'info') {
    alert(message);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateGST(amount, gstPercentage) {
    return (amount * gstPercentage) / 100;
}

function calculateTotal(amount, gstPercentage) {
    const gst = calculateGST(amount, gstPercentage);
    return amount + gst;
}

// ============================================
// SESSION CHECK ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.body.id !== 'loginPage') {
        if (!checkSession()) {
            return;
        }
        const userNameElement = document.getElementById('userName');
        if (userNameElement && currentUser) {
            userNameElement.textContent = currentUser.name;
        }
    }
});