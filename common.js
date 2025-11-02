// Supabase Configuration
const SUPABASE_URL = 'https://lqrewteclbexiknvhenk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global Variables
let currentUser = null;
let servicesData = [];
let selectedServices = [];
let allCustomers = [];

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

function showAlert(message, type = 'info') {
    alert(message);
}

function formatCurrency(amount) {
    return '₹' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function validatePhoneNumber(phone) {
    return /^[0-9]{10}$/.test(phone);
}

function validatePIN(pin) {
    return /^[0-9]{4}$/.test(pin);
}