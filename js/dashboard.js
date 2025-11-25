// ============================================================================
// js/dashboard.js - DASHBOARD PAGE FUNCTIONS (CORRECTED & FINAL)
// ============================================================================
// This file handles dashboard page functions only
// Uses supabase from config.js - NO hardcoded credentials here!


// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
// ✅ CORRECT - Only declare what dashboard.js needs
// supabase is already declared globally in config.js - just use it directly
let currentUser = null;
let trendChart = null;
let paymentChart = null;


// ============================================================================
// INITIALIZATION - Called on page load
// ============================================================================
/**
 * Initialize dashboard
 * 1. Verify Supabase is available from config.js
 * 2. Check if user is logged in
 * 3. Load all dashboard data
 * 4. Initialize charts
 */
async function initializeDashboard() {
    try {
        // ===== VERIFY SUPABASE IS AVAILABLE =====
        if (typeof supabase === 'undefined' || !supabase) {
            console.error('Supabase client not found. Make sure config.js loaded correctly.');
            showDashboardError();
            return;
        }
        
        // ===== CHECK LOGIN STATUS =====
        const userSession = JSON.parse(localStorage.getItem('userSession'));
        
        if (!userSession) {
            window.location.href = 'index.html';
            return;
        }

        // ===== SHOW USER NAME & ROLE =====
        currentUser = userSession;
        document.getElementById('userName').textContent = `Welcome, ${currentUser.name || 'User'}!`;
        document.getElementById('userRole').textContent = currentUser.role || 'User';

        // ===== HIDE ERROR STATE IF VISIBLE =====
        hideDashboardError();

        // ===== LOAD ALL DATA =====
        await loadDashboardData();
        initializeTrendChart();
        initializePaymentChart();

        // ===== HIDE LOADING OVERLAY =====
        hideStatsLoading();

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showDashboardError();
    }
}


// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Load all dashboard data from Supabase
 * Fetches invoices and customers, then displays them
 */
async function loadDashboardData() {
    try {
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (invoicesError) {
            console.error('Error loading invoices:', invoicesError);
        }
        
        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select('*');
        
        if (customersError) {
            console.error('Error loading customers:', customersError);
        }

        calculateStats(invoices || [], customers || []);
        displayRecentInvoices(invoices?.slice(0, 10) || []);
        displayPendingInvoices(invoices || []);
        displayServiceBreakdown(invoices || []);
        displayActivityLog(invoices || []);

    } catch (error) {
        console.error('Error loading data:', error);
        showDashboardError();
    }
}


// ============================================================================
// STATISTICS CALCULATIONS
// ============================================================================

/**
 * Calculate all statistics and update dashboard cards
 * @param {Array} invoices - List of invoices
 * @param {Array} customers - List of customers
 */
function calculateStats(invoices, customers) {
    // ===== DATE SETUP =====
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // ===== TODAY'S INVOICES =====
    const todayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.created_at);
        invDate.setHours(0, 0, 0, 0);
        return invDate.getTime() === today.getTime();
    });

    // ===== YESTERDAY'S INVOICES =====
    const yesterdayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.created_at);
        invDate.setHours(0, 0, 0, 0);
        return invDate.getTime() === yesterday.getTime();
    });

    // ===== THIS MONTH INVOICES =====
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthInvoices = invoices.filter(inv => new Date(inv.created_at) >= thisMonthStart);
    
    // ===== LAST MONTH INVOICES =====
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const lastMonthInvoices = invoices.filter(inv => {
        const d = new Date(inv.created_at);
        return d >= lastMonthStart && d <= lastMonthEnd;
    });

    // ===== REVENUE CALCULATIONS =====
    const todayRev = todayInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
    const yesterdayRev = yesterdayInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
    const thisMonthRev = thisMonthInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
    const lastMonthRev = lastMonthInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
    const totalRev = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
    const totalGSTVal = totalRev * 0.18;
    const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev * 100).toFixed(1) : 0;

    // ===== UPDATE REVENUE CARDS =====
    document.getElementById('todayRevenue').textContent = `₹${fmt(todayRev)}`;
    document.getElementById('yesterdayRevenue').textContent = `₹${fmt(yesterdayRev)}`;
    document.getElementById('thisMonthRevenue').textContent = `₹${fmt(thisMonthRev)}`;
    document.getElementById('lastMonthRevenue').textContent = `₹${fmt(lastMonthRev)}`;
    document.getElementById('growthPercentage').textContent = `${growth > 0 ? '+' : ''}${growth}%`;
    document.getElementById('totalRevenue').textContent = `₹${fmt(totalRev)}`;
    document.getElementById('totalGST').textContent = `₹${fmt(totalGSTVal)}`;
    document.getElementById('totalInvoices').textContent = invoices.length;
    document.getElementById('totalCustomers').textContent = customers.length;
    document.getElementById('revenueChange').textContent = `${growth > 0 ? '+' : ''}${growth}% from last month`;
    document.getElementById('invoiceChange').textContent = `+${thisMonthInvoices.length} this month`;
    document.getElementById('customerChange').textContent = `+${customers.filter(c => new Date(c.created_at) >= thisMonthStart).length} new`;

    // ===== PAYMENT STATISTICS =====
    const pending = invoices.filter(i => i.payment_status === 'pending').length;
    const outstanding = invoices.filter(i => i.payment_status === 'pending').reduce((s, i) => s + (i.total_amount || 0), 0);
    const collection = invoices.length > 0 ? ((invoices.filter(i => i.payment_status === 'paid').length / invoices.length) * 100).toFixed(0) : 0;

    document.getElementById('pendingPayments').textContent = pending;
    document.getElementById('outstandingAmount').textContent = `₹${fmt(outstanding)}`;
    document.getElementById('collectionRate').textContent = `${collection}%`;
}


// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

/**
 * Format number as Indian currency (with commas)
 * @param {Number} n - Number to format
 * @returns {String} Formatted number
 */
function fmt(n) {
    return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

/**
 * Display recent invoices in table
 * @param {Array} invoices - List of invoices
 */
function displayRecentInvoices(invoices) {
    const tbody = document.getElementById('recentInvoicesList');
    
    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">No invoices</td></tr>';
        return;
    }
    
    tbody.innerHTML = invoices.map(inv => `
        <tr>
            <td><strong>${inv.invoice_number || 'N/A'}</strong></td>
            <td>${inv.customer_name || 'Unknown'}</td>
            <td>₹${fmt(inv.total_amount || 0)}</td>
            <td>₹${fmt((inv.gst_amount || 0))}</td>
            <td>${new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
            <td><span style="background: ${inv.payment_status === 'paid' ? '#10b981' : '#fbbf24'}; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;">${inv.payment_status || 'pending'}</span></td>
            <td><button class="btn-action" onclick="viewInvoice('${inv.id}')">View</button></td>
        </tr>
    `).join('');
}

/**
 * Display pending invoices (draft or pending status)
 * @param {Array} invoices - List of invoices
 */
function displayPendingInvoices(invoices) {
    const pending = invoices.filter(inv => inv.payment_status === 'draft' || inv.payment_status === 'pending').slice(0, 6);
    const container = document.getElementById('pendingInvoicesList');
    
    if (pending.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-state-icon">✅</div><div class="empty-state-text">All invoices finalized!</div></div>`;
        return;
    }
    
    container.innerHTML = pending.map(inv => `
        <div class="pending-card">
            <div class="pending-header">
                <span class="pending-invoice-id">${inv.invoice_number || 'Draft'}</span>
                <span class="pending-amount">₹${fmt(inv.total_amount || 0)}</span>
            </div>
            <div class="pending-date">Customer: ${inv.customer_name || 'Unknown'}</div>
            <div class="pending-actions">
                <button class="btn-complete" onclick="completeInvoice('${inv.id}')">✓ Complete</button>
                <button class="btn-send" onclick="sendInvoice('${inv.id}')">📧 Send</button>
            </div>
        </div>
    `).join('');
}

/**
 * Display service breakdown chart
 * @param {Array} invoices - List of invoices
 */
function displayServiceBreakdown(invoices) {
    const services = {};
    invoices.forEach(inv => {
        const service = inv.service_type || 'Other';
        services[service] = (services[service] || 0) + (inv.total_amount || 0);
    });
    
    const sorted = Object.entries(services).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = sorted[0]?.[1] || 1;
    const list = document.getElementById('serviceList');
    
    if (sorted.length === 0) {
        list.innerHTML = '<li class="empty-state">No data</li>';
        return;
    }
    
    list.innerHTML = sorted.map(([s, a]) => `
        <li class="service-item">
            <span class="service-name">${s}</span>
            <div class="service-bar"><div class="service-bar-fill" style="width: ${(a / max) * 100}%"></div></div>
            <span class="service-value">₹${fmt(a)}</span>
        </li>
    `).join('');
}

/**
 * Display activity log
 * @param {Array} invoices - List of invoices
 */
function displayActivityLog(invoices) {
    const activities = invoices.slice(0, 5).map(inv => ({
        title: `Invoice ${inv.invoice_number} created`,
        user: inv.created_by || 'System',
        time: inv.created_at
    }));
    
    const list = document.getElementById('activityLog');
    
    if (activities.length === 0) {
        list.innerHTML = '<li class="activity-item">No recent activity</li>';
        return;
    }
    
    list.innerHTML = activities.map(a => `
        <li class="activity-item">
            <div class="activity-icon">📄</div>
            <div class="activity-content">
                <div class="activity-title">${a.title}</div>
                <div class="activity-user">by ${a.user}</div>
                <div class="activity-time">${timeAgo(a.time)}</div>
            </div>
        </li>
    `).join('');
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert date to relative time (e.g., "2 hours ago")
 * @param {String} dateString - Date string
 * @returns {String} Relative time
 */
function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return new Date(dateString).toLocaleDateString('en-IN');
}


// ============================================================================
// CHART INITIALIZATION
// ============================================================================

/**
 * Initialize revenue trend chart
 */
function initializeTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
            datasets: [
                {
                    label: 'Revenue',
                    data: [25000, 32000, 28000, 45000, 52000, 48000],
                    borderColor: '#1e40af',
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#1e40af',
                    pointRadius: 5
                },
                {
                    label: 'GST (18%)',
                    data: [4500, 5760, 5040, 8100, 9360, 8640],
                    borderColor: '#1e3a8a',
                    backgroundColor: 'rgba(30, 58, 138, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#1e3a8a',
                    pointRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

/**
 * Initialize payment status chart
 */
function initializePaymentChart() {
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;
    
    paymentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'],
            datasets: [
                { label: 'Collected', data: [5000, 8000, 7000, 9000, 6500], backgroundColor: '#10b981' },
                { label: 'Pending', data: [2000, 1500, 2500, 1000, 2000], backgroundColor: '#fbbf24' }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}


// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Filter dashboard by date
 */
function filterByDate() {
    const dateRange = document.getElementById('dateRange').value;
    console.log('Filter by date:', dateRange);
    // TODO: Implement date filtering logic
    // This would reload data based on selected date range
}

/**
 * View invoice details
 * @param {String} id - Invoice ID
 */
function viewInvoice(id) {
    console.log('Viewing invoice:', id);
    // TODO: Implement invoice detail view
    // window.location.href = `invoice-detail.html?id=${id}`;
}

/**
 * Mark invoice as complete
 * @param {String} id - Invoice ID
 */
async function completeInvoice(id) {
    console.log('Completing invoice:', id);
    try {
        const { error } = await supabase
            .from('invoices')
            .update({ payment_status: 'completed' })
            .eq('id', id);
        
        if (error) throw error;
        
        // Reload dashboard data
        await loadDashboardData();
        alert('Invoice marked as complete!');
    } catch (error) {
        console.error('Error completing invoice:', error);
        alert('Failed to complete invoice');
    }
}

/**
 * Send invoice to customer
 * @param {String} id - Invoice ID
 */
function sendInvoice(id) {
    console.log('Sending invoice:', id);
    // TODO: Implement email sending functionality
    alert('Email functionality coming soon!');
}

/**
 * Export dashboard to PDF
 */
function exportDashboardPDF() {
    console.log('Exporting dashboard to PDF...');
    // TODO: Implement PDF export
    // Requires html2pdf library
    alert('PDF export functionality coming soon!');
}

/**
 * Logout user
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userSession');
        window.location.href = 'index.html';
    }
}


// ============================================================================
// PAGE LOAD - Initialize when page loads
// ============================================================================
window.addEventListener('load', initializeDashboard);

// Alias for compatibility with common.js
const initDashboard = initializeDashboard;
