// js/invoice.js - Invoice Management & Services

console.log('✓ invoice.js loaded');

let currentServices = [];
let allServices = [];
let invoiceNumber = 1;

// LOAD SERVICES FROM SUPABASE
async function loadServices() {
    try {
        console.log('📡 Loading services from Supabase...');
        
        const { data: services, error } = await supabase
            .from('services_config')
            .select('*')
            .eq('is_active', true)
            .order('service_name', { ascending: true });
        
        if (error) {
            console.error('❌ Error loading services:', error);
            return;
        }
        
        if (!services || services.length === 0) {
            console.warn('⚠️ No services found');
            return;
        }
        
        allServices = services;
        console.log('✅ Loaded ' + services.length + ' services');
        
        // Populate dropdown
        const dropdown = document.getElementById('serviceType');
        if (!dropdown) return;
        
        dropdown.innerHTML = '<option value="">-- Select a Service --</option>';
        
        services.forEach(svc => {
            const option = document.createElement('option');
            option.value = svc.id;
            option.textContent = svc.service_name + ' (₹' + svc.base_rate + ')';
            dropdown.appendChild(option);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// SEARCH CUSTOMER BY MOBILE
async function searchCustomer() {
    const mobile = document.getElementById('mobileNumber').value.trim();
    const resultsDiv = document.getElementById('searchResults');
    const contentDiv = document.getElementById('searchContent');
    
    // Validate mobile number
    if (!mobile || !/^\d{10}$/.test(mobile)) {
        resultsDiv.style.display = 'none';
        return;
    }
    
    try {
        console.log('🔍 Searching for mobile:', mobile);
        
        const { data: customers, error } = await supabase
            .from('customers')
            .select('*')
            .eq('mobile_no', mobile);
        
        if (error) {
            console.error('❌ Search error:', error);
            return;
        }
        
        if (!customers || customers.length === 0) {
            resultsDiv.style.display = 'block';
            contentDiv.innerHTML = '<p style="color: #f59e0b; margin: 0;">ℹ️ No customer found. Add as new customer.</p>';
            return;
        }
        
        // Display found customers
        resultsDiv.style.display = 'block';
        contentDiv.innerHTML = '<p style="color: #10b981; margin: 0; font-weight: bold;">✓ Customer Found:</p>';
        
        customers.forEach(customer => {
            const btn = document.createElement('div');
            btn.style.cssText = 'padding: 10px; margin-top: 8px; background: white; border: 2px solid #10b981; border-radius: 6px; cursor: pointer; font-weight: 500; color: #1f2937;';
            btn.textContent = customer.full_name + ' (' + customer.mobile_no + ')';
            
            btn.onclick = () => {
                // Fill form with customer data
                document.getElementById('fullName').value = customer.full_name || '';
                document.getElementById('email').value = customer.email || '';
                document.getElementById('gstin').value = customer.gstin || '';
                document.getElementById('address').value = customer.address || '';
                
                // Hide search results
                resultsDiv.style.display = 'none';
                
                // Update preview
                updateInvoicePreview();
                
                console.log('✅ Customer selected:', customer.full_name);
            };
            
            contentDiv.appendChild(btn);
        });
        
    } catch (error) {
        console.error('❌ Error searching customer:', error);
    }
}

// ADD SERVICE TO INVOICE
function addService() {
    const dropdown = document.getElementById('serviceType');
    const serviceId = dropdown.value;
    
    if (!serviceId) {
        alert('⚠️ Please select a service');
        return;
    }
    
    const service = allServices.find(s => s.id === serviceId);
    if (!service) {
        alert('❌ Service not found');
        return;
    }
    
    // Add to current services
    const serviceItem = {
        id: Date.now(),
        serviceId: serviceId,
        service_name: service.service_name,
        sac_code: service.sac_code,
        base_rate: service.base_rate,
        gst_percentage: service.gst_percentage,
        quantity: 1,
        amount: 0
    };
    
    currentServices.push(serviceItem);
    dropdown.value = '';
    
    console.log('✅ Service added:', service.service_name);
    
    renderServices();
    updateInvoicePreview();
}

// RENDER SERVICES LIST
function renderServices() {
    const container = document.getElementById('servicesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (currentServices.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No services added yet</p>';
        return;
    }
    
    currentServices.forEach((svc, idx) => {
        const div = document.createElement('div');
        div.style.cssText = 'background: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #0284c7;';
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #1f2937;">${svc.service_name}</strong>
                <button onclick="removeService(${idx})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove</button>
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 12px; color: #666;">Amount (₹):</label>
                <input type="number" value="0" step="0.01" min="0" onchange="updateService(${idx}, this.value)" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;">
            </div>
            <div style="font-size: 11px; color: #6b7280;">
                SAC: ${svc.sac_code} | GST: ${svc.gst_percentage}% | Rate: ₹${svc.base_rate}
            </div>
        `;
        
        container.appendChild(div);
    });
}

// UPDATE SERVICE AMOUNT
function updateService(idx, value) {
    if (isNaN(value) || value < 0) return;
    currentServices[idx].amount = parseFloat(value);
    updateInvoicePreview();
}

// REMOVE SERVICE
function removeService(idx) {
    currentServices.splice(idx, 1);
    renderServices();
    updateInvoicePreview();
}

// UPDATE INVOICE PREVIEW
function updateInvoicePreview() {
    const name = document.getElementById('fullName')?.value || '-';
    const mobile = document.getElementById('mobileNumber')?.value || '-';
    const gstin = document.getElementById('gstin')?.value || 'N/A';
    
    // Update preview headers
    document.getElementById('previewName').textContent = name;
    document.getElementById('previewMobile').textContent = mobile;
    document.getElementById('previewInvoiceNo').textContent = 'DH' + String(invoiceNumber).padStart(5, '0');
    document.getElementById('previewDate').textContent = new Date().toLocaleDateString('en-IN');
    
    // Build invoice table
    const tbody = document.getElementById('invoiceTableBody');
    tbody.innerHTML = '';
    
    let subtotal = 0;
    let totalGst = 0;
    
    if (currentServices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #999;">No services added</td></tr>';
        document.getElementById('previewSubtotal').textContent = '₹0.00';
        document.getElementById('previewTotalGst').textContent = '₹0.00';
        document.getElementById('previewGrandTotal').textContent = '₹0.00';
        return;
    }
    
    currentServices.forEach((svc, idx) => {
        const amt = svc.amount || 0;
        const gst = (amt * svc.gst_percentage) / 100;
        const total = amt + gst;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${idx + 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${svc.service_name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">1</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${amt.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${svc.gst_percentage}%</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #10b981;">₹${gst.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₹${total.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
        
        subtotal += amt;
        totalGst += gst;
    });
    
    const grand = subtotal + totalGst;
    document.getElementById('previewSubtotal').textContent = '₹' + subtotal.toFixed(2);
    document.getElementById('previewTotalGst').textContent = '₹' + totalGst.toFixed(2);
    document.getElementById('previewGrandTotal').textContent = '₹' + grand.toFixed(2);
}

// GENERATE INVOICE
function generateInvoice() {
    const name = document.getElementById('fullName')?.value?.trim();
    const mobile = document.getElementById('mobileNumber')?.value?.trim();
    
    if (!name) {
        alert('⚠️ Enter customer name');
        return;
    }
    
    if (!mobile || !/^\d{10}$/.test(mobile)) {
        alert('⚠️ Enter valid 10-digit mobile number');
        return;
    }
    
    if (currentServices.length === 0) {
        alert('⚠️ Add at least one service');
        return;
    }
    
    alert('✅ Invoice generated!\n\nInvoice #: DH' + String(invoiceNumber).padStart(5, '0') + '\n\nFeature coming soon: Will save to database');
    
    invoiceNumber++;
    clearForm();
}

// CLEAR FORM
function clearForm() {
    document.getElementById('fullName').value = '';
    document.getElementById('mobileNumber').value = '';
    document.getElementById('email').value = '';
    document.getElementById('gstin').value = '';
    document.getElementById('address').value = '';
    document.getElementById('serviceType').value = '';
    document.getElementById('searchResults').style.display = 'none';
    
    currentServices = [];
    renderServices();
    updateInvoicePreview();
    
    console.log('🗑️ Form cleared');
}

// PRINT INVOICE
function printInvoice() {
    window.print();
}

// DOWNLOAD PDF
function downloadPDF() {
    alert('📥 PDF download feature coming soon');
}

console.log('✓ invoice.js initialized');
