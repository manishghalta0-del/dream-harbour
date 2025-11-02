let dashboardStats = {};

document.addEventListener('DOMContentLoaded', async function() {
    await loadDashboardStats();
    await loadCharts();
    setupDashboardEvents();
});

async function loadDashboardStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        
        const { data: allInvoices, error } = await supabase
            .from('invoices')
            .select('*');
        
        if (error) {
            console.error('Error loading dashboard stats:', error);
            return;
        }
        
        const invoices = allInvoices || [];
        
        const todayInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.invoice_date);
            invDate.setHours(0, 0, 0, 0);
            return invDate.getTime() === today.getTime();
        });
        const todayRevenue = todayInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        
        const yesterdayInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.invoice_date);
            invDate.setHours(0, 0, 0, 0);
            return invDate.getTime() === yesterday.getTime();
        });
        const yesterdayRevenue = yesterdayInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        
        const thisMonthInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.invoice_date);
            return invDate >= monthStart && invDate <= today;
        });
        const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        
        const lastMonthInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.invoice_date);
            return invDate >= lastMonthStart && invDate <= lastMonthEnd;
        });
        const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        
        const monthGrowth = lastMonthRevenue > 0 
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
            : 0;
        
        const gstCollected = thisMonthRevenue * 0.18;
        
        const pendingInvoices = invoices.filter(inv => inv.payment_status === 'Pending');
        const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        
        const collectionRate = invoices.length > 0 
            ? ((invoices.length - pendingInvoices.length) / invoices.length) * 100 
            : 0;
        
        dashboardStats = {
            todayRevenue,
            yesterdayRevenue,
            monthGrowth,
            thisMonthRevenue,
            lastMonthRevenue,
            gstCollected,
            totalInvoices: invoices.length,
            pendingCount: pendingInvoices.length,
            pendingAmount,
            collectionRate,
            totalCustomers: invoices.length > 0 ? [...new Set(invoices.map(i => i.customer_id))].length : 0
        };
        
        updateDashboardDisplay();
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function updateDashboardDisplay() {
    const todayDisplay = document.getElementById('todayRevenue');
    const yesterdayDisplay = document.getElementById('yesterdayRevenue');
    if (todayDisplay) todayDisplay.textContent = formatCurrency(dashboardStats.todayRevenue);
    if (yesterdayDisplay) yesterdayDisplay.textContent = formatCurrency(dashboardStats.yesterdayRevenue);
    
    const thisMonthDisplay = document.getElementById('thisMonthRevenue');
    const lastMonthDisplay = document.getElementById('lastMonthRevenue');
    if (thisMonthDisplay) thisMonthDisplay.textContent = formatCurrency(dashboardStats.thisMonthRevenue);
    if (lastMonthDisplay) lastMonthDisplay.textContent = formatCurrency(dashboardStats.lastMonthRevenue);
    
    const growthDisplay = document.getElementById('monthGrowth');
    if (growthDisplay) {
        growthDisplay.textContent = dashboardStats.monthGrowth.toFixed(1) + '%';
        growthDisplay.style.color = dashboardStats.monthGrowth >= 0 ? '#28a745' : '#dc3545';
    }
    
    const totalRevenueDisplay = document.getElementById('totalRevenue');
    if (totalRevenueDisplay) totalRevenueDisplay.textContent = formatCurrency(dashboardStats.thisMonthRevenue);
    
    const gstDisplay = document.getElementById('gstCollected');
    if (gstDisplay) gstDisplay.textContent = formatCurrency(dashboardStats.gstCollected);
    
    const invoicesDisplay = document.getElementById('totalInvoices');
    if (invoicesDisplay) invoicesDisplay.textContent = dashboardStats.totalInvoices;
    
    const customersDisplay = document.getElementById('totalCustomer');
    if (customersDisplay) customersDisplay.textContent = dashboardStats.totalCustomers;
    
    const pendingCountDisplay = document.getElementById('pendingCount');
    if (pendingCountDisplay) pendingCountDisplay.textContent = dashboardStats.pendingCount;
    
    const pendingAmountDisplay = document.getElementById('pendingAmount');
    if (pendingAmountDisplay) pendingAmountDisplay.textContent = formatCurrency(dashboardStats.pendingAmount);
    
    const collectionRateDisplay = document.getElementById('collectionRate');
    if (collectionRateDisplay) collectionRateDisplay.textContent = dashboardStats.collectionRate.toFixed(1) + '%';
}

async function loadCharts() {
    console.log('Charts would be loaded here');
}

function setupDashboardEvents() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
    
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDashboardStats();
        });
    }
}