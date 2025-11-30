// ============================================================================
// js/dashboard.js - PROFESSIONAL GRADE (ENHANCED)
// ============================================================================
// Features: Proper error handling, loading states, empty states, animations
// ============================================================================

let currentUser = null;
let loadingState = {
  isLoading: true,
  hasError: false,
  errorMessage: ''
};

// Initialize dashboard
async function initializeDashboard() {
  try {
    if (typeof supabase === 'undefined' || !supabase) {
      console.error('Supabase client not found');
      showLoadingError('Connection failed. Please refresh the page.');
      return;
    }
    
    const userSession = JSON.parse(localStorage.getItem('userSession'));
    if (!userSession) {
      window.location.href = 'index.html';
      return;
    }
    
    currentUser = userSession;
    document.getElementById('userName').textContent = `Welcome, ${currentUser.full_name || 'User'}!`;
    document.getElementById('userRole').textContent = currentUser.role || 'User';
    
    // Show loading skeletons
    showLoadingState();
    
    // Load data
    await loadDashboardData();
    
    // Hide loading, show content
    hideLoadingState();
    
  } catch (error) {
    console.error('Dashboard init error:', error);
    showLoadingError('Failed to initialize dashboard');
  }
}

// Load all dashboard data
async function loadDashboardData() {
  try {
    loadingState.isLoading = true;
    loadingState.hasError = false;
    
    // Fetch invoices with their items
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        customer_id,
        subtotal,
        total_gst,
        total_amount,
        payment_status,
        invoice_date,
        created_at,
        invoice_items (*)
      `)
      .order('created_at', { ascending: false });
    
    // Fetch customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    // Only throw error if it's a real error, not empty result
    if (invoicesError && invoicesError.code !== 'PGRST116') {
      throw invoicesError;
    }
    
    // Calculate and display stats
    calculateStats(invoices || [], customers || []);
    displayRecentInvoices(invoices?.slice(0, 10) || []);
    displayServiceBreakdown(invoices || []);
    
    loadingState.isLoading = false;
    
  } catch (error) {
    console.error('Data loading error:', error);
    loadingState.hasError = true;
    loadingState.errorMessage = error.message || 'Failed to load data';
    showLoadingError('Unable to load dashboard data. Please try again.');
  }
}

// Calculate statistics
function calculateStats(invoices, customers) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Today's invoices
  const todayInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.invoice_date || inv.created_at);
    invDate.setHours(0, 0, 0, 0);
    return invDate.getTime() === today.getTime();
  });
  
  // Yesterday's invoices
  const yesterdayInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.invoice_date || inv.created_at);
    invDate.setHours(0, 0, 0, 0);
    return invDate.getTime() === yesterday.getTime();
  });
  
  // This month
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthInvoices = invoices.filter(inv => 
    new Date(inv.invoice_date || inv.created_at) >= thisMonthStart
  );
  
  // Last month
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const lastMonthInvoices = invoices.filter(inv => {
    const d = new Date(inv.invoice_date || inv.created_at);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });
  
  // Revenue calculations
  const todayRev = todayInvoices.reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
  const yesterdayRev = yesterdayInvoices.reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
  const thisMonthRev = thisMonthInvoices.reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
  const lastMonthRev = lastMonthInvoices.reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
  const totalRev = invoices.reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
  const totalGST = invoices.reduce((s, i) => s + (parseFloat(i.total_gst) || 0), 0);
  
  const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev * 100).toFixed(1) : 0;
  
  // Update UI with animation
  updateStatWithAnimation('todayRevenue', formatCurrency(todayRev));
  updateStatWithAnimation('yesterdayRevenue', formatCurrency(yesterdayRev));
  updateStatWithAnimation('thisMonthRevenue', formatCurrency(thisMonthRev));
  updateStatWithAnimation('lastMonthRevenue', formatCurrency(lastMonthRev));
  updateStatWithAnimation('growthPercentage', `${growth > 0 ? '+' : ''}${growth}%`);
  updateStatWithAnimation('totalRevenue', formatCurrency(totalRev));
  updateStatWithAnimation('totalGST', formatCurrency(totalGST));
  updateStatWithAnimation('totalInvoices', invoices.length);
  updateStatWithAnimation('totalCustomers', customers.length);
  
  document.getElementById('revenueChange').textContent = `${growth > 0 ? '+' : ''}${growth}% from last month`;
  document.getElementById('invoiceChange').textContent = `+${thisMonthInvoices.length} this month`;
  
  // Payment statistics
  const pending = invoices.filter(i => i.payment_status === 'pending' || i.payment_status === 'draft').length;
  const outstanding = invoices
    .filter(i => i.payment_status === 'pending' || i.payment_status === 'draft')
    .reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
  const collection = invoices.length > 0 
    ? ((invoices.filter(i => i.payment_status === 'paid').length / invoices.length) * 100).toFixed(0) 
    : 0;
  
  document.getElementById('pendingPayments').textContent = pending;
  document.getElementById('outstandingAmount').textContent = formatCurrency(outstanding);
  document.getElementById('collectionRate').textContent = `${collection}%`;
}

// Update stat with animation
function updateStatWithAnimation(elementId, value) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.style.opacity = '0';
  element.textContent = value;
  
  setTimeout(() => {
    element.style.transition = 'opacity 0.3s ease-in';
    element.style.opacity = '1';
  }, 10);
}

// Display recent invoices
function displayRecentInvoices(invoices) {
  const tbody = document.getElementById('recentInvoicesList');
  
  if (!tbody) return;
  
  if (invoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state-cell">
          <div class="empty-state">
            <div class="empty-icon">📄</div>
            <h3>No Invoices Yet</h3>
            <p>Create your first invoice to get started</p>
            <button class="btn btn--primary btn--sm" onclick="navigateTo('invoices')">Create Invoice</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = invoices.map((inv, index) => `
    <tr class="fade-in" style="animation-delay: ${index * 0.05}s">
      <td>${inv.invoice_number}</td>
      <td>${inv.customer_id ? `Customer ${inv.customer_id.substring(0, 8)}` : 'N/A'}</td>
      <td>${formatCurrency(inv.total_amount)}</td>
      <td>${formatCurrency(inv.total_gst)}</td>
      <td>${formatDate(inv.invoice_date || inv.created_at)}</td>
      <td><span class="status-badge status-${inv.payment_status}">${inv.payment_status || 'pending'}</span></td>
      <td><button class="btn btn--sm btn--outline" onclick="viewInvoice('${inv.id}')">View</button></td>
    </tr>
  `).join('');
}

// Display service breakdown
function displayServiceBreakdown(invoices) {
  const serviceBreakdown = {};
  
  invoices.forEach(inv => {
    if (inv.invoice_items && Array.isArray(inv.invoice_items)) {
      inv.invoice_items.forEach(item => {
        const service = item.description || 'Other';
        serviceBreakdown[service] = (serviceBreakdown[service] || 0) + (parseFloat(item.amount) || 0);
      });
    }
  });
  
  const services = Object.entries(serviceBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  const serviceListDiv = document.getElementById('serviceBreakdown');
  
  if (!serviceListDiv) return;
  
  if (services.length === 0) {
    serviceListDiv.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <p>No service data available</p>
      </div>
    `;
    return;
  }
  
  serviceListDiv.innerHTML = services.map(([service, amount], index) => `
    <div class="service-item fade-in" style="animation-delay: ${index * 0.1}s">
      <div class="service-name">${service}</div>
      <div class="service-amount">${formatCurrency(amount)}</div>
    </div>
  `).join('');
}

// Loading state functions
function showLoadingState() {
  const skeletons = document.querySelectorAll('.skeleton-loader');
  skeletons.forEach(skeleton => {
    skeleton.style.display = 'block';
  });
}

function hideLoadingState() {
  const skeletons = document.querySelectorAll('.skeleton-loader');
  skeletons.forEach(skeleton => {
    skeleton.style.display = 'none';
  });
}

function showLoadingError(message) {
  const errorDiv = document.getElementById('dashboardError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
  }
}

function hideDashboardError() {
  const errorDiv = document.getElementById('dashboardError');
  if (errorDiv) errorDiv.classList.remove('show');
}

// Utility functions
function viewInvoice(invoiceId) {
  localStorage.setItem('selectedInvoiceId', invoiceId);
  showToast('Opening invoice...', 'info');
  setTimeout(() => navigateTo('invoices'), 300);
}

// Export for HTML
window.initializeDashboard = initializeDashboard;
window.logout = logout;
window.navigateTo = navigateTo;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeDashboard();
});

console.log('✅ dashboard.js (PROFESSIONAL) loaded successfully');