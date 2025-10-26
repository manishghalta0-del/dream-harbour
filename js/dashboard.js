// js/dashboard.js
// Dashboard page functionality

let currentSection = 'home'; // Track current section

// Check if user is logged in on page load
window.addEventListener('DOMContentLoaded', async () => {
    const user = checkAuth();
    
    if (!user) {
        // Not logged in, redirect to login
        window.location.href = 'index.html';
        return;
    }
    
    // Show user name
    document.getElementById('userName').textContent = user.name || 'User';
    
    // Load dashboard data
    await loadDashboardData();
    
    // Update time every minute
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
    
    // Restore last viewed section
    const lastSection = localStorage.getItem('lastSection') || 'home';
    showSection(lastSection);
});

// Update current time display
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

// Show different sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Find and activate corresponding menu button
    document.querySelectorAll('.menu-item').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(sectionId === 'home' ? 'dashboard' : sectionId.replace('_', ' '))) {
            btn.classList.add('active');
        }
    });
    
    // Update title
    const titles = {
        'home': 'Dashboard',
        'invoice': 'Generate Invoice',
        'reports': 'Reports & Analytics',
        'settings': 'Business Settings',
        'users': 'User Management'
    };
    document.getElementById('sectionTitle').textContent = titles[sectionId] || 'Dashboard';
    
    // Save current section
    localStorage.setItem('lastSection', sectionId);
    
    // If invoice section, load services
    if (sectionId === 'invoice') {
        loadServices();
    }
}

// Load all services from database
async function loadServices() {
    try {
        const dropdown = document.getElementById('serviceType');
        if (!dropdown) {
            console.error('Service dropdown not found');
            return;
        }
        
        const { data, error } = await supabase
            .from('services_config')
            .select('*')
            .eq('is_active', true)
            .order('service_name', { ascending: true });
        
        if (error) {
            console.error('Supabase error:', error);
            return;
        }
        
        if (!data || data.length === 0) {
            console.warn('No services found');
            return;
        }
        
        window.allServices = data; // Make globally available
        
        // Clear existing options
        dropdown.innerHTML = '<option value="">-- Select a Service --</option>';
        
        // Add each service
        data.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.service_name;
            dropdown.appendChild(option);
        });
        
        console.log('✓ Services loaded successfully:', data.length);
        
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Load dashboard data from Supabase
async function loadDashboardData() {
    try {
        // Get invoices for revenue calculation
        const { data: invoices, error: invoiceError } = await supabase
            .from('invoices')
            .select('*');
        
        if (!invoiceError && invoices) {
            let totalRevenue = 0;
            let totalGST = 0;
            
            invoices.forEach(invoice => {
                totalRevenue += parseFloat(invoice.grand_total || 0);
                totalGST += parseFloat(invoice.total_gst || 0);
            });
            
            document.getElementById('totalRevenue').textContent = '₹' + totalRevenue.toFixed(2);
            document.getElementById('totalGST').textContent = '₹' + totalGST.toFixed(2);
        }
        
        // Get services count
        const { data: services, error: servicesError } = await supabase
            .from('services_config')
            .select('*')
            .eq('is_active', true);
        
        if (!servicesError && services) {
            document.getElementById('servicesCount').textContent = services.length;
        }
        
        // Get customers count
        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select('*');
        
        if (!customersError && customers) {
            document.getElementById('customersCount').textContent = customers.length;
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}
