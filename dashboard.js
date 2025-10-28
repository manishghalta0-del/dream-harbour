// Supabase configuration
const SUPABASE_URL = 'https://lqrewteclbexiknvhenk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global variables
let currentUser = null;
let servicesData = [];
let selectedServices = [];

// Check login on page load
document.addEventListener('DOMContentLoaded', async () => {
    const userData = localStorage.getItem('dreamHarbourUser');
    
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    document.getElementById('userName').textContent = currentUser.name;
    
    await loadServices();
    await loadDashboardStats();
    await loadCustomers();
});

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Activate nav button
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('dreamHarbourUser');
    window.location.href = 'index.html';
}

// Load services from database
async function loadServices() {
    try {
        const { data, error } = await supabase
            .from('service_types')
            .select('*');
        
        if (error) throw error;
        
        servicesData = data;
        
        const serviceSelect = document.getElementById('serviceType');
        if (serviceSelect) {
            serviceSelect.innerHTML = '<option value="">-- Select Service --</option>';
            
            data.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.service_name;
                serviceSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// When service is selected, populate rate or make it editable
if (document.getElementById('serviceType')) {
    document.getElementById('serviceType').addEventListener('change', function() {
        const serviceId = this.value;
        const service = servicesData.find(s => s.id === serviceId);
        const rateField = document.getElementById('serviceRate');
        
        if (service) {
            // If service needs manual amount, leave field empty and editable
            if (service.requires_manual_amount) {
                rateField.value = '';
                rateField.placeholder = 'Enter amount';
                rateField.readOnly = false;
            } else {
                // Auto-populate for standard services
                rateField.value = service.base_rate || 0;
                rateField.readOnly = true;
            }
        } else {
            rateField.value = '';
            rateField.readOnly = false;
        }
    });
}

// Check mobile number for existing customer
if (document.getElementById('customerMobile')) {
    document.getElementById('customerMobile').addEventListener('blur', async function() {
        const mobile = this.value;
        
        if (mobile.length === 10) {
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('mobile_no', mobile)
                    .single();
                
                if (data) {
                    // Customer exists - auto-fill
                    document.getElementById('customerName').value = data.full_name;
                    document.getElementById('customerEmail').value = data.email || '';
                    document.getElementById('customerGSTIN').value = data.gstin || '';
                    document.getElementById('customerAddress').value = data.address || '';
                    
                    showAlert('Customer found! Details auto-filled.', 'success');
                }
            } catch (error) {
                // Customer not found - that's okay
                console.log('New customer');
            }
        }
    });
}

// Add service to list
function addService() {
    const serviceId = document.getElementById('serviceType').value;
    const quantityInput = document.getElementById('serviceQuantity').value;
    const rateInput = document.getElementById('serviceRate').value;
    
    if (!serviceId) {
        showAlert('Please select a service', 'error');
        return;
    }
    
    const service = servicesData.find(s => s.id === serviceId);
    let quantity = parseInt(quantityInput) || 1;
    let rate = parseFloat(rateInput) || 0;
    
    if (quantity < 1) {
        showAlert('Quantity must be at least 1', 'error');
        return;
    }
    
    // Handle services that require manual amount input
    if (service.requires_manual_amount && rate === 0) {
        showAlert('Please enter the service fee amount in "Rate per Unit" field', 'error');
        return;
    }

    
    // Create service items array
    let itemsToAdd = [];
    
    // If service has government fee
    if (service.has_government_fee) {
        let govFeeAmount = service.government_fee_amount;
        
        // If government fee needs to be entered manually
        if (service.requires_manual_amount && govFeeAmount === 0) {
            const govFee = window.prompt(`Enter the Government/Statutory fee for ${service.service_name}:`);
            if (govFee !== null && govFee !== '') {
                govFeeAmount = parseFloat(govFee);
            }
        }
        
        // Add government fee as first item (if amount > 0)
        if (govFeeAmount > 0) {
            itemsToAdd.push({
                id: serviceId + '_gov_' + Date.now(),
                name: getGovernmentFeeName(service.service_name),
                sac_code: 'N/A',
                quantity: quantity,
                rate: govFeeAmount,
                gst_percentage: 0,
                amount: govFeeAmount * quantity,
                gst_amount: 0,
                total: govFeeAmount * quantity,
                is_government_fee: true
            });
        }
    }
    
    // Add main service
    const serviceAmount = quantity * rate;
    const gstAmount = (serviceAmount * service.gst_percentage) / 100;
    const totalAmount = serviceAmount + gstAmount;
    
    itemsToAdd.push({
        id: serviceId + '_' + Date.now(),
        name: service.service_name,
        sac_code: service.sac_code,
        quantity: quantity,
        rate: rate,
        gst_percentage: service.gst_percentage,
        amount: serviceAmount,
        gst_amount: gstAmount,
        total: totalAmount,
        is_government_fee: false
    });
    
    // For Affidavit/Application and Deed Writing - add document handling fee
    const serviceNameLower = service.service_name.toLowerCase();
    if (serviceNameLower.includes('affidavit') || serviceNameLower.includes('deed')) {
        const handlingFee = window.prompt(`Enter the Document Handling/Processing Fee (without GST):`);
        if (handlingFee !== null && handlingFee !== '' && parseFloat(handlingFee) > 0) {
            const handlingAmount = parseFloat(handlingFee) * quantity;
            itemsToAdd.push({
                id: serviceId + '_handling_' + Date.now(),
                name: 'Document Handling / Processing Fee',
                sac_code: 'N/A',
                quantity: quantity,
                rate: parseFloat(handlingFee),
                gst_percentage: 0,
                amount: handlingAmount,
                gst_amount: 0,
                total: handlingAmount,
                is_government_fee: false
            });
        }
    }
    
    // Add all items to selected services
    itemsToAdd.forEach(item => selectedServices.push(item));
    
    displaySelectedServices();
    
    // Reset form
    document.getElementById('serviceType').value = '';
    document.getElementById('serviceQuantity').value = 1;
    document.getElementById('serviceRate').value = '';
}

// Helper function to get government fee name
function getGovernmentFeeName(serviceName) {
    const feeNames = {
        'Aadhaar Pan Linking': 'Government Fee (Paid to Income Tax Dept.)',
        'Pan Card and Others': 'Government Fee (Paid to Income Tax Dept.)',
        'Registration Fees': 'Government Fee (Paid to IG of Registration)',
        'Driving Licence': 'Government Fee',
        'E-Stamping': 'E-Stamp Paper Fees',
        'Jamabandi': 'Government Statutory Fee',
        'Online Certificates': 'Government Statutory Fee',
        'Online Internet Services': 'Statutory Fee',
        'Nepal Money Transfer': 'Remitted Money',
        'Affidavit/Application': 'Affidavit/Application Typing',
        'Deed Writing': 'Deed Typing'
    };
    
    return feeNames[serviceName] || 'Government Fee';
}

// Display selected services
function displaySelectedServices() {
    const container = document.getElementById('serviceItemsList');
    
    if (selectedServices.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<h4 style="margin-bottom: 15px;">Selected Services:</h4>';
    
    selectedServices.forEach((service, index) => {
        html += `
            <div class="service-item">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${service.name}</strong><br>
                        <small>SAC: ${service.sac_code} | Qty: ${service.quantity} | Rate: ₹${service.rate.toFixed(2)} | GST: ${service.gst_percentage}%</small><br>
                        <small>Amount: ₹${service.amount.toFixed(2)} + GST: ₹${service.gst_amount.toFixed(2)} = <strong>₹${service.total.toFixed(2)}</strong></small>
                    </div>
                    <button onclick="removeService(${index})" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Remove</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Remove service from list
function removeService(index) {
    selectedServices.splice(index, 1);
    displaySelectedServices();
}

// Generate invoice preview
function generateInvoice() {
    const mobile = document.getElementById('customerMobile').value;
    const name = document.getElementById('customerName').value;
    
    if (!mobile || mobile.length !== 10) {
        showAlert('Please enter valid 10-digit mobile number', 'error');
        return;
    }
    
    if (!name) {
        showAlert('Please enter customer name', 'error');
        return;
    }
    
    if (selectedServices.length === 0) {
        showAlert('Please add at least one service', 'error');
        return;
    }
    
    // Calculate totals
    let subtotal = 0;
    let totalGST = 0;
    
    selectedServices.forEach(service => {
        subtotal += service.amount;
        totalGST += service.gst_amount;
    });
    
    const cgst = totalGST / 2;
    const sgst = totalGST / 2;
    const grandTotal = subtotal + totalGST;
    
    // Generate invoice number
    const invoiceNumber = 'DH-' + Date.now();
    const invoiceDate = new Date().toLocaleDateString('en-IN');
    
    // Fill preview
    document.getElementById('invoiceNumber').textContent = invoiceNumber;
    document.getElementById('invoiceDate').textContent = invoiceDate;
    document.getElementById('previewCustomerName').textContent = name;
    document.getElementById('previewCustomerMobile').textContent = 'Mobile: ' + mobile;
    document.getElementById('previewCustomerEmail').textContent = document.getElementById('customerEmail').value || '';
    document.getElementById('previewCustomerGSTIN').textContent = document.getElementById('customerGSTIN').value ? 'GSTIN: ' + document.getElementById('customerGSTIN').value : '';
    document.getElementById('previewCustomerAddress').textContent = document.getElementById('customerAddress').value || '';
    
    // Fill items table
    let tableHTML = '';
    selectedServices.forEach((service, index) => {
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${service.name}</td>
                <td>${service.sac_code}</td>
                <td>${service.quantity}</td>
                <td>₹${service.rate.toFixed(2)}</td>
                <td>${service.gst_percentage}%</td>
                <td>₹${service.total.toFixed(2)}</td>
            </tr>
        `;
    });
    document.getElementById('invoiceItemsTable').innerHTML = tableHTML;
    
    // Fill totals
    document.getElementById('previewSubtotal').textContent = '₹' + subtotal.toFixed(2);
    document.getElementById('previewCGST').textContent = '₹' + cgst.toFixed(2);
    document.getElementById('previewSGST').textContent = '₹' + sgst.toFixed(2);
    document.getElementById('previewGrandTotal').textContent = '₹' + grandTotal.toFixed(2);
    
    // Show preview
    document.getElementById('invoicePreview').classList.remove('hidden');
    document.getElementById('invoicePreview').scrollIntoView({ behavior: 'smooth' });
}

// Save invoice to database
async function saveInvoice() {
    try {
        const mobile = document.getElementById('customerMobile').value;
        const name = document.getElementById('customerName').value;
        const email = document.getElementById('customerEmail').value;
        const gstin = document.getElementById('customerGSTIN').value;
        const address = document.getElementById('customerAddress').value;
        
        // First, save or update customer
        const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .upsert({
                mobile_no: mobile,
                full_name: name,
                email: email,
                gstin: gstin,
                address: address
            }, { onConflict: 'mobile_no' })
            .select()
            .single();
        
        if (customerError) throw customerError;
        
        // Calculate totals
        let subtotal = 0;
        let totalGST = 0;
        
        selectedServices.forEach(service => {
            subtotal += service.amount;
            totalGST += service.gst_amount;
        });
        
        const grandTotal = subtotal + totalGST;
        const invoiceNumber = document.getElementById('invoiceNumber').textContent;
        
        // Save invoice
        const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                invoice_number: invoiceNumber,
                customer_id: customerData.id,
                created_by: currentUser.id,
                subtotal: subtotal,
                total_gst: totalGST,
                total_amount: grandTotal
            })
            .select()
            .single();
        
        if (invoiceError) throw invoiceError;
        
        // Save invoice items
        const items = selectedServices.map((service, index) => ({
            invoice_id: invoiceData.id,
            description: service.name,
            sac_code: service.sac_code,
            quantity: service.quantity,
            rate: service.rate,
            gst_percentage: service.gst_percentage,
            amount: service.total
        }));
        
        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(items);
        
        if (itemsError) throw itemsError;
        
        showAlert('Invoice saved successfully!', 'success');
        
        // Reload stats
        await loadDashboardStats();
        
    } catch (error) {
        console.error('Error saving invoice:', error);
        showAlert('Error saving invoice: ' + error.message, 'error');
    }
}

// Download PDF
function downloadPDF() {
    const element = document.getElementById('invoiceContent');
    const opt = {
        margin: 10,
        filename: document.getElementById('invoiceNumber').textContent + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
}

// Close preview
function closePreview() {
    document.getElementById('invoicePreview').classList.add('hidden');
}

// Clear form
function clearForm() {
    document.getElementById('customerMobile').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerGSTIN').value = '';
    document.getElementById('customerAddress').value = '';
    selectedServices = [];
    displaySelectedServices();
    closePreview();
}

// Show alert
function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    if (container) {
        container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        // Total invoices
        const { count: invoiceCount } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true });
        
        const totalInvoicesElement = document.getElementById('totalInvoices');
        if (totalInvoicesElement) {
            totalInvoicesElement.textContent = invoiceCount || 0;
        }
        
        // Total customers
        const { count: customerCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });
        
        const totalCustomersElement = document.getElementById('totalCustomers');
        if (totalCustomersElement) {
            totalCustomersElement.textContent = customerCount || 0;
        }
        
        // Total revenue and GST
        const { data: invoices } = await supabase
            .from('invoices')
            .select('total_amount, total_gst');
        
        let totalRevenue = 0;
        let totalGST = 0;
        
        if (invoices) {
            invoices.forEach(inv => {
                totalRevenue += parseFloat(inv.total_amount || 0);
                totalGST += parseFloat(inv.total_gst || 0);
            });
        }
        
        const totalRevenueElement = document.getElementById('totalRevenue');
        if (totalRevenueElement) {
            totalRevenueElement.textContent = '₹' + totalRevenue.toFixed(2);
        }
        
        const gstCollectedElement = document.getElementById('gstCollected');
        if (gstCollectedElement) {
            gstCollectedElement.textContent = '₹' + totalGST.toFixed(2);
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load customers list
async function loadCustomers() {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const table = document.getElementById('customersTable');
        if (!table) return;
        
        if (!data || data.length === 0) {
            table.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">No customers yet</td></tr>';
            return;
        }
        
        let html = '';
        data.forEach(customer => {
            html += `
                <tr>
                    <td>${customer.mobile_no}</td>
                    <td>${customer.full_name}</td>
                    <td>${customer.email || '-'}</td>
                    <td>${customer.gstin || '-'}</td>
                </tr>
            `;
        });
        
        table.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}
