// ============================================================================
// js/invoices.js - INVOICES PAGE FUNCTIONS (CORRECTED)
// ============================================================================
// This file handles invoices page functions only
// Uses getSupabase() from common.js - NO hardcoded credentials here!

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let supabase = null;
let currentUser = null;
let allServices = [];
let selectedServices = [];

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

/**
 * Initialize invoices page on load
 * 1. Check if user is logged in
 * 2. Load all services from Supabase
 * 3. Load existing invoices
 */
document.addEventListener('DOMContentLoaded', async function() {
    // ===== GET SUPABASE FROM common.js =====
    supabase = getSupabase();
    
    // ===== CHECK SESSION =====
    if (!checkSession()) return;
    
    // ===== LOAD DATA =====
    await loadServices();
    await loadInvoices();
});

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Load all active services from Supabase
 * Populate the service dropdown in the modal
 */
async function loadServices() {
    try {
        const { data } = await supabase
            .from('service_types')
            .select('*')
            .eq('is_active', true);
        
        allServices = data || [];
        
        // ===== POPULATE DROPDOWN =====
        const select = document.getElementById('serviceType');
        select.innerHTML = '<option value="">-- Select Service --</option>';
        allServices.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.service_name;
            option.dataset.rate = service.base_rate;
            option.dataset.gst = service.gst_percentage;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

/**
 * Load all invoices from Supabase
 * Display in table on the page
 */
async function loadInvoices() {
    try {
        const { data } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        const list = document.getElementById('invoiceList');
        list.innerHTML = (data || []).map(inv => `
            <tr>
                <td>${inv.invoice_number}</td>
                <td>${formatDate(inv.invoice_date)}</td>
                <td>${inv.customer_id}</td>
                <td>${formatCurrency(inv.total_amount)}</td>
                <td>${inv.payment_status}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

/**
 * Open invoice creation modal
 */
function openModal() {
    document.getElementById('invoiceModal').classList.add('show');
}

/**
 * Close invoice creation modal
 * Clear all selected services and reset form
 */
function closeModal() {
    document.getElementById('invoiceModal').classList.remove('show');
    selectedServices = [];
    document.getElementById('serviceItemsList').innerHTML = '';
}

// ============================================================================
// CUSTOMER LOOKUP
// ============================================================================

/**
 * Lookup customer by mobile number
 * Auto-populate customer details if found
 */
async function lookupCustomer() {
    const mobile = document.getElementById('customerMobile').value;
    
    if (mobile.length === 10) {
        try {
            const { data } = await supabase
                .from('customers')
                .select('*')
                .eq('mobile_no', mobile)
                .single();
            
            if (data) {
                document.getElementById('customerName').value = data.full_name;
                document.getElementById('customerEmail').value = data.email || '';
                document.getElementById('customerGSTIN').value = data.gstin || '';
                document.getElementById('customerAddress').value = data.address || '';
                showAlert('Customer found!');
            }
        } catch (error) {
            console.log('New customer - form ready');
        }
    }
}

// ============================================================================
// SERVICE SELECTION & MANAGEMENT
// ============================================================================

/**
 * Update service rate when service is selected
 * Get rate from the selected option's data attribute
 */
function onServiceChange() {
    const select = document.getElementById('serviceType');
    const option = select.options[select.selectedIndex];
    if (option.dataset.rate) {
        document.getElementById('serviceRate').value = option.dataset.rate;
    }
}

/**
 * Add selected service to the services list
 * Validate input and calculate GST
 */
function addService() {
    const serviceId = document.getElementById('serviceType').value;
    const quantity = parseInt(document.getElementById('serviceQuantity').value) || 1;
    const rate = parseFloat(document.getElementById('serviceRate').value) || 0;
    
    // ===== VALIDATION =====
    if (!serviceId || quantity < 1 || rate <= 0) {
        showAlert('Please fill all fields correctly');
        return;
    }
    
    // ===== GET SERVICE DETAILS =====
    const service = allServices.find(s => s.id === serviceId);
    const amount = quantity * rate;
    const gst = (amount * (service.gst_percentage || 18)) / 100;
    
    // ===== ADD TO SELECTED SERVICES =====
    selectedServices.push({
        id: serviceId,
        name: service.service_name,
        quantity,
        rate,
        amount,
        gst,
        gstPercent: service.gst_percentage || 18
    });
    
    displayServices();
}

/**
 * Display all selected services
 * Calculate and show subtotal, GST, and grand total
 */
function displayServices() {
    const list = document.getElementById('serviceItemsList');
    let subtotal = 0, totalGST = 0;
    
    list.innerHTML = selectedServices.map((srv, i) => {
        subtotal += srv.amount;
        totalGST += srv.gst;
        return `
            <tr>
                <td>${srv.name}</td>
                <td>${srv.quantity}</td>
                <td>${formatCurrency(srv.rate)}</td>
                <td>${formatCurrency(srv.amount)}</td>
                <td>${srv.gstPercent}% = ${formatCurrency(srv.gst)}</td>
                <td>${formatCurrency(srv.amount + srv.gst)}</td>
                <td><button onclick="selectedServices.splice(${i}, 1); displayServices();">Remove</button></td>
            </tr>
        `;
    }).join('');
    
    // ===== UPDATE TOTALS =====
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('totalGST').textContent = formatCurrency(totalGST);
    document.getElementById('grandTotal').textContent = formatCurrency(subtotal + totalGST);
}

// ============================================================================
// INVOICE SUBMISSION
// ============================================================================

/**
 * Submit invoice to Supabase
 * 1. Create/find customer
 * 2. Create invoice record
 * 3. Add invoice items
 * 4. Reload invoices list
 */
async function submitInvoice() {
    const phone = document.getElementById('customerMobile').value;
    const name = document.getElementById('customerName').value;
    
    // ===== VALIDATION =====
    if (!phone || !name || selectedServices.length === 0) {
        showAlert('Please fill customer details and add services');
        return;
    }
    
    try {
        // ===== FIND OR CREATE CUSTOMER =====
        let customerId;
        let customer = (await supabase
            .from('customers')
            .select('*')
            .eq('mobile_no', phone)
            .single()).data;
        
        if (!customer) {
            // ===== CREATE NEW CUSTOMER =====
            const { data } = await supabase
                .from('customers')
                .insert([{
                    mobile_no: phone,
                    full_name: name,
                    email: document.getElementById('customerEmail').value,
                    gstin: document.getElementById('customerGSTIN').value,
                    address: document.getElementById('customerAddress').value
                }])
                .select();
            customerId = data[0].id;
        } else {
            // ===== USE EXISTING CUSTOMER =====
            customerId = customer.id;
        }
        
        // ===== CALCULATE TOTALS =====
        let subtotal = 0, totalGST = 0;
        selectedServices.forEach(srv => {
            subtotal += srv.amount;
            totalGST += srv.gst;
        });
        
        // ===== CREATE INVOICE =====
        const { data: inv } = await supabase
            .from('invoices')
            .insert([{
                invoice_number: 'INV-' + Date.now(),
                customer_id: customerId,
                created_by: currentUser.id,
                invoice_date: new Date().toISOString(),
                subtotal: subtotal,
                total_gst: totalGST,
                total_amount: subtotal + totalGST,
                payment_status: document.getElementById('paymentStatus').value
            }])
            .select();
        
        const invoiceId = inv[0].id;
        
        // ===== ADD INVOICE ITEMS =====
        await supabase
            .from('invoice_items')
            .insert(selectedServices.map(srv => ({
                invoice_id: invoiceId,
                description: srv.name,
                quantity: srv.quantity,
                rate: srv.rate,
                amount: srv.amount,
                gst_percentage: srv.gstPercent,
                gst_amount: srv.gst
            })));
        
        // ===== SUCCESS =====
        showAlert('Invoice created successfully!');
        closeModal();
        loadInvoices();
        
    } catch (error) {
        showAlert('Error: ' + error.message);
        console.error('Error submitting invoice:', error);
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format date to DD/MM/YYYY
 * @param {String} dateString - ISO date string
 * @returns {String} Formatted date
 */
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN');
}

/**
 * Format number as Indian currency
 * @param {Number} amount - Amount to format
 * @returns {String} Formatted currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

/**
 * Show alert message to user
 * @param {String} message - Message to show
 */
function showAlert(message) {
    alert(message);
    // TODO: Replace with better notification system
}