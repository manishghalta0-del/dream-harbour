// ============================================================================
// js/settings.js - SETTINGS PAGE FUNCTIONS (CORRECTED)
// ============================================================================
// This file handles settings page functions only
// Uses getSupabase() from common.js - NO hardcoded credentials here!

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let supabase = null;
let currentUser = null;

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

/**
 * Initialize settings page on load
 * 1. Check if user is logged in
 * 2. Display user name
 * 3. Load all settings data
 */
document.addEventListener('DOMContentLoaded', async function() {
    // ===== GET SUPABASE FROM common.js =====
    supabase = getSupabase();
    
    // ===== CHECK SESSION =====
    if (!checkSession()) return;
    
    // ===== SHOW USER NAME =====
    document.getElementById('userName').textContent = 'Welcome, ' + currentUser.name;
    
    // ===== LOAD ALL DATA =====
    await loadAllData();
});

// ============================================================================
// TAB SWITCHING
// ============================================================================

/**
 * Switch between tabs (Services, Customers, etc)
 * Hide current tab, show selected tab
 * Update active button styling
 * 
 * @param {String} tabName - ID of tab to show
 */
function switchTab(tabName) {
    // ===== HIDE ALL TABS =====
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // ===== SHOW SELECTED TAB =====
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Load all settings data from Supabase
 * 1. Load all service types
 * 2. Load all customers
 * 3. Display data in respective tables
 * 4. Show statistics
 */
async function loadAllData() {
    try {
        // ===== LOAD DATA FROM SUPABASE =====
        const { data: services } = await supabase
            .from('service_types')
            .select('*');
        
        const { data: customers } = await supabase
            .from('customers')
            .select('*');

        // ===== DISPLAY SERVICES TABLE =====
        displayServicesTable(services);
        
        // ===== DISPLAY CUSTOMERS TABLE =====
        displayCustomersTable(customers);
        
        // ===== DISPLAY STATISTICS =====
        displayStatistics(services, customers);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

/**
 * Display services in table format
 * @param {Array} services - List of services from Supabase
 */
function displayServicesTable(services) {
    const serviceTable = document.getElementById('serviceTable').querySelector('tbody');
    
    serviceTable.innerHTML = (services || []).map(service => `
        <tr>
            <td>${service.service_name}</td>
            <td>${service.category || '-'}</td>
            <td>${service.sac_code}</td>
            <td>${service.gst_percentage}%</td>
            <td>₹${service.base_rate}</td>
            <td>${service.is_active ? 'Active' : 'Inactive'}</td>
            <td><button onclick="editService('${service.id}')">Edit</button></td>
        </tr>
    `).join('');
}

/**
 * Display customers in table format
 * @param {Array} customers - List of customers from Supabase
 */
function displayCustomersTable(customers) {
    const customerTable = document.getElementById('customerTable').querySelector('tbody');
    
    customerTable.innerHTML = (customers || []).map(customer => `
        <tr>
            <td>${customer.full_name}</td>
            <td>${customer.mobile_no}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.gstin || '-'}</td>
        </tr>
    `).join('');
}

/**
 * Display statistics cards
 * Show total and active services, total customers
 * @param {Array} services - List of services
 * @param {Array} customers - List of customers
 */
function displayStatistics(services, customers) {
    const activeServices = services?.filter(s => s.is_active).length || 0;
    const totalServices = services?.length || 0;
    const totalCustomers = customers?.length || 0;
    
    document.getElementById('serviceStat').textContent = `📊 Total: ${totalServices} | Active: ${activeServices}`;
    document.getElementById('customerStat').textContent = `📊 Total Customers: ${totalCustomers}`;
}

// ============================================================================
// ACTION HANDLERS (PLACEHOLDER)
// ============================================================================

/**
 * Edit service (placeholder for future implementation)
 * @param {String} serviceId - ID of service to edit
 */
function editService(serviceId) {
    console.log('Editing service:', serviceId);
    // TODO: Open edit modal and populate with service data
}

/**
 * Edit customer (placeholder for future implementation)
 * @param {String} customerId - ID of customer to edit
 */
function editCustomer(customerId) {
    console.log('Editing customer:', customerId);
    // TODO: Open edit modal and populate with customer data
}

/**
 * Refresh all data from Supabase
 */
function refreshData() {
    console.log('Refreshing data...');
    loadAllData();
}

/**
 * Export data to CSV
 * @param {String} type - Type of data to export (services or customers)
 */
function exportData(type) {
    console.log('Exporting:', type);
    // TODO: Implement CSV export functionality
}

/**
 * Import data from file
 * @param {String} type - Type of data to import (services or customers)
 */
function importData(type) {
    console.log('Importing:', type);
    // TODO: Implement file import functionality
}