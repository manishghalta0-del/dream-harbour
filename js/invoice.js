// js/invoice.js - FIXED SERVICE DROPDOWN VERSION
console.log('✓ invoice.js loaded');

let currentInvoiceServices = [];
let allServices = [];
let invoiceCounter = 1;

// Auto-run when document loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✓ DOM loaded');
    await loadServices();
});

// LOAD SERVICES FROM SUPABASE
async function loadServices() {
    try {
        console.log('📡 Fetching services from Supabase...');
        
        const { data: services, error } = await supabase
            .from('services_config')
            .select('*')
            .eq('is_active', true)
            .order('service_name', { ascending: true });
        
        if (error) {
            console.error('❌ Database error:', error.message);
            alert('Error: ' + error.message);
            return;
        }
        
        if (!services || services.length === 0) {
            console.warn('⚠️ No services found in database');
            return;
        }
        
        allServices = services;
        console.log('✓ Loaded ' + services.length + ' services');
        
        // Fill the dropdown
        const dropdown = document.getElementById('serviceType');
        if (!dropdown) {
            console.error('❌ Dropdown element not found');
            return;
        }
        
        dropdown.innerHTML = '<option value="">-- Select a Service --</option>';
        
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.text = service.service_name + ' (₹' + service.base_rate + ')';
            dropdown.appendChild(option);
        });
        
        console.log('✓ Dropdown populated with', services.length, 'services');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// ADD SERVICE TO INVOICE
function addService() {
    const dropdown = document.getElementById('serviceType');
    const serviceId = dropdown.value;
    
    console.log('Adding service:', serviceId);
    
    if (!serviceId) {
        alert('⚠️ Please select a service');
        return;
    }
    
    const service = allServices.find(s => s.id === serviceId);
    if (!service) {
        alert('Service not found');
        return;
    }
    
    // Add to list
    const item = {
        id: Date.now(),
        serviceId: serviceId,
        service_name: service.service_name,
        sac_code: service.sac_code,
        base_rate: service.base_rate,
        gst_percentage: service.gst_percentage,
        quantity: 1
    };
    
    currentInvoiceServices.push(item);
    dropdown.value = '';
    
    renderServices();
    updateInvoicePreview();
    console.log('✓ Service added');
}

// RENDER SERVICES LIST
function renderServices() {
    const container = document.getElementById('servicesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (currentInvoiceServices.length === 0) {
        container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No services added yet</p>';
        return;
    }
    
    currentInvoiceServices.forEach((svc, idx) => {
        const div = document.createElement('div');
        div.style.cssText = 'background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #0284c7;';
        
        let inputHTML = '';
        if (svc.service_name.includes('Photostat') || svc.service_name.includes('Printing')) {
            inputHTML = `<div style="margin-bottom: 8px;"><label style="font-weight: 500; display: block; margin-bottom: 4px;">Pages:</label><input type="number" value="1" min="1" onchange="updateService(${idx}, this.value)" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;"></div>`;
        } else {
            inputHTML = `<div style="margin-bottom: 8px;"><label style="font-weight: 500; display: block; margin-bottom: 4px;">Amount:</label><input type="number" value="0" step="0.01" min="0" onchange="updateService(${idx}, this.value)" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;"></div>`;
        }
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #1f2937;">${svc.service_name}</strong>
                <button onclick="removeService(${idx})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Remove</button>
            </div>
            ${inputHTML}
            <div style="font-size: 0.85rem; color: #6b7280;">
                SAC: ${svc.sac_code} | GST: ${svc.gst_percentage}% | Rate: ₹${svc.base_rate}
            </div>
        `;
        
        container.appendChild(div);
    });
}

// UPDATE SERVICE
function updateService(idx, value) {
    if (isNaN(value) || value < 0) return;
    currentInvoiceServices[idx].customValue = parseFloat(value);
    updateInvoicePreview();
}

// REMOVE SERVICE
function removeService(idx) {
    currentInvoiceServices.splice(idx, 1);
    renderServices();
    updateInvoicePreview();
}

// UPDATE PREVIEW
function updateInvoicePreview() {
    const name = document.getElementById('fullName')?.value || '-';
    const mobile = document.getElementById('mobileNumber')?.value || '-';
    const gstin = document.getElementById('gstin')?.value || '-';
    const addr = document.getElementById('address')?.value || '-';
    
    document.getElementById('previewName').textContent = name;
    document.getElementById('previewMobile').textContent = mobile;
    document.getElementById('previewGstin').textContent = gstin || 'N/A';
    document.getElementById('previewAddress').textContent = addr;
    document.getElementById('previewDate').textContent = new Date().toLocaleDateString('en-IN');
    document.getElementById('previewInvoiceNo').textContent = 'DH' + String(invoiceCounter).padStart(5, '0');
    
    let subtotal = 0;
    let totalGst = 0;
    
    const tbody = document.getElementById('invoiceTableBody');
    tbody.innerHTML = '';
    
    let sn = 1;
    currentInvoiceServices.forEach(svc => {
        let amt = 0;
        if (svc.service_name.includes('Photostat') || svc.service_name.includes('Printing')) {
            amt = (svc.base_rate * svc.quantity) || 0;
        } else {
            amt = svc.customValue || 0;
        }
        
        const gst = (amt * svc.gst_percentage) / 100;
        const total = amt + gst;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${sn}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${svc.service_name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${svc.sac_code}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${svc.quantity || 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(amt/(svc.quantity || 1)).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${amt.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${svc.gst_percentage}%</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #10b981; font-weight: 500;">₹${gst.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₹${total.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
        
        subtotal += amt;
        totalGst += gst;
        sn++;
    });
    
    const grand = subtotal + totalGst;
    document.getElementById('previewSubtotal').textContent = '₹' + subtotal.toFixed(2);
    document.getElementById('previewTotalGst').textContent = '₹' + totalGst.toFixed(2);
    document.getElementById('previewGrandTotal').textContent = '₹' + grand.toFixed(2);
}

// SEARCH CUSTOMER
async function searchCustomer() {
    const mobile = document.getElementById('mobileNumber')?.value?.trim();
    if (!mobile || !/^\d{10}$/.test(mobile)) {
        alert('Enter valid 10-digit mobile');
        return;
    }
    
    try {
        const { data } = await supabase
            .from('customers')
            .select('*')
            .eq('mobile_no', mobile);
        
        const div = document.getElementById('existingCustomers');
        
        if (data && data.length > 0) {
            div.style.display = 'block';
            div.innerHTML = '<strong style="color: #10b981;">✓ Found:</strong><br>';
            
            data.forEach(c => {
                const btn = document.createElement('div');
                btn.style.cssText = 'padding: 10px; margin: 5px 0; background: white; border: 2px solid #10b981; border-radius: 6px; cursor: pointer; font-weight: 500; color: #1f2937;';
                btn.textContent = c.full_name + (c.email ? ' (' + c.email + ')' : '');
                btn.onclick = () => {
                    document.getElementById('fullName').value = c.full_name;
                    document.getElementById('email').value = c.email || '';
                    document.getElementById('gstin').value = c.gstin || '';
                    document.getElementById('address').value = c.address || '';
                    div.style.display = 'none';
                    updateInvoicePreview();
                };
                div.appendChild(btn);
            });
        } else {
            div.style.display = 'block';
            div.innerHTML = '<p style="padding: 10px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; color: #92400e;">ℹ️ No customer found - add as new</p>';
        }
    } catch (e) {
        console.error('Search error:', e);
    }
}

// GENERATE INVOICE
async function generateInvoice() {
    const name = document.getElementById('fullName')?.value?.trim();
    const mobile = document.getElementById('mobileNumber')?.value?.trim();
    
    if (!name || !/^\d{10}$/.test(mobile)) {
        alert('Enter valid name and mobile');
        return;
    }
    
    if (currentInvoiceServices.length === 0) {
        alert('Add at least one service');
        return;
    }
    
    try {
        alert('✅ Invoice created successfully!\n\nFeature coming soon - will save to database');
        
        invoiceCounter++;
        clearInvoiceForm();
        
    } catch (e) {
        console.error('Error:', e);
    }
}

// CLEAR FORM
function clearInvoiceForm() {
    document.getElementById('fullName').value = '';
    document.getElementById('mobileNumber').value = '';
    document.getElementById('email').value = '';
    document.getElementById('gstin').value = '';
    document.getElementById('address').value = '';
    document.getElementById('serviceType').value = '';
    document.getElementById('existingCustomers').style.display = 'none';
    currentInvoiceServices = [];
    renderServices();
    updateInvoicePreview();
}

// PRINT
function printInvoice() {
    window.print();
}

// DOWNLOAD
function downloadInvoicePDF() {
    alert('PDF feature coming soon');
}
