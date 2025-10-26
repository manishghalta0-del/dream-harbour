// js/invoice.js - SIMPLIFIED VERSION
console.log('invoice.js loaded');

let currentInvoiceServices = [];
let allServices = [];
let invoiceCounter = 1;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - loading services');
    loadServices();
    updateInvoicePreview();
});

// Load services from Supabase
async function loadServices() {
    console.log('Starting loadServices...');
    
    try {
        const { data, error } = await supabase
            .from('services_config')
            .select('*')
            .eq('is_active', true)
            .order('service_name', { ascending: true });
        
        if (error) {
            console.error('❌ Supabase Error:', error);
            alert('Error loading services: ' + error.message);
            return;
        }
        
        allServices = data || [];
        console.log('✓ Services loaded:', allServices.length);
        
        // Fill dropdown
        const dropdown = document.getElementById('serviceType');
        if (!dropdown) {
            console.error('❌ Dropdown element NOT found!');
            return;
        }
        
        dropdown.innerHTML = '<option value="">-- Select a Service --</option>';
        
        allServices.forEach(service => {
            const opt = document.createElement('option');
            opt.value = service.id;
            opt.text = service.service_name;
            dropdown.appendChild(opt);
            console.log('✓ Added service:', service.service_name);
        });
        
    } catch (error) {
        console.error('❌ Error in loadServices:', error);
    }
}

// Add service to list
function addService() {
    const dropdown = document.getElementById('serviceType');
    const serviceId = dropdown.value;
    
    console.log('Add service clicked - selected ID:', serviceId);
    
    if (!serviceId) {
        alert('Please select a service');
        return;
    }
    
    const service = allServices.find(s => s.id === serviceId);
    if (!service) {
        alert('Service not found');
        return;
    }
    
    console.log('Adding service:', service.service_name);
    
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
}

// Render services
function renderServices() {
    const container = document.getElementById('servicesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    currentInvoiceServices.forEach((service, idx) => {
        const div = document.createElement('div');
        div.style.cssText = 'background: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #0284c7;';
        
        let inputHTML = '';
        if (service.service_name.includes('Photostat') || service.service_name.includes('Printing')) {
            inputHTML = `<label>Pages: <input type="number" value="1" min="1" onchange="updateService(${idx}, this.value)"></label>`;
        } else {
            inputHTML = `<label>Amount: <input type="number" value="0" step="0.01" onchange="updateService(${idx}, this.value)"></label>`;
        }
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong>${service.service_name}</strong>
                <button onclick="removeService(${idx})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Remove</button>
            </div>
            <div>${inputHTML}</div>
            <small style="color: #6b7280;">Rate: ₹${service.base_rate || 'Manual'} | GST: ${service.gst_percentage}%</small>
        `;
        
        container.appendChild(div);
    });
}

// Update service
function updateService(idx, val) {
    if (isNaN(val) || val < 0) return;
    currentInvoiceServices[idx].customValue = parseFloat(val);
    updateInvoicePreview();
}

// Remove service
function removeService(idx) {
    currentInvoiceServices.splice(idx, 1);
    renderServices();
    updateInvoicePreview();
}

// Update preview
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
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${sn}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${svc.service_name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${svc.sac_code}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${svc.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">₹${(amt/svc.quantity).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">₹${amt.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${svc.gst_percentage}%</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">₹${gst.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">₹${total.toFixed(2)}</td>
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

// Search customer
async function searchCustomer() {
    const mobile = document.getElementById('mobileNumber').value.trim();
    if (!/^\d{10}$/.test(mobile)) {
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
            div.innerHTML = '<strong>✓ Found:</strong><br>';
            data.forEach(c => {
                const btn = document.createElement('div');
                btn.style.cssText = 'padding: 8px; margin: 5px 0; background: white; border: 1px solid #10b981; border-radius: 4px; cursor: pointer;';
                btn.textContent = `${c.full_name} (${c.email || 'No email'})`;
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
            div.innerHTML = '<p style="color: #f59e0b;">ℹ️ No customer found - add as new</p>';
        }
    } catch (e) {
        console.error('Search error:', e);
    }
}

// Generate invoice
async function generateInvoice() {
    const name = document.getElementById('fullName').value.trim();
    const mobile = document.getElementById('mobileNumber').value.trim();
    
    if (!name || !/^\d{10}$/.test(mobile)) {
        alert('Enter valid name and 10-digit mobile');
        return;
    }
    
    if (currentInvoiceServices.length === 0) {
        alert('Add at least one service');
        return;
    }
    
    try {
        let custId;
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('mobile_no', mobile)
            .single();
        
        if (existing) {
            custId = existing.id;
        } else {
            const { data: newCust } = await supabase
                .from('customers')
                .insert([{
                    mobile_no: mobile,
                    full_name: name,
                    email: document.getElementById('email').value || null,
                    gstin: document.getElementById('gstin').value || null,
                    address: document.getElementById('address').value || null
                }])
                .select();
            custId = newCust[0].id;
        }
        
        let subtotal = 0, gst = 0;
        currentInvoiceServices.forEach(s => {
            let amt = (s.service_name.includes('Photostat') || s.service_name.includes('Printing')) 
                ? (s.base_rate * s.quantity) 
                : s.customValue || 0;
            gst += (amt * s.gst_percentage) / 100;
            subtotal += amt;
        });
        
        const invNo = 'DH' + String(invoiceCounter).padStart(5, '0');
        const { data: inv } = await supabase
            .from('invoices')
            .insert([{
                invoice_number: invNo,
                customer_id: custId,
                customer_mobile: mobile,
                customer_name: name,
                customer_email: document.getElementById('email').value || null,
                customer_gstin: document.getElementById('gstin').value || null,
                customer_address: document.getElementById('address').value || null,
                subtotal: subtotal,
                total_gst: gst,
                grand_total: subtotal + gst,
                status: 'paid'
            }])
            .select();
        
        const invId = inv[0].id;
        
        const items = currentInvoiceServices.map((s, i) => {
            let amt = (s.service_name.includes('Photostat') || s.service_name.includes('Printing')) 
                ? (s.base_rate * s.quantity) 
                : s.customValue || 0;
            return {
                invoice_id: invId,
                serial_number: i + 1,
                service_name: s.service_name,
                sac_code: s.sac_code,
                quantity: s.quantity || 1,
                rate: amt,
                amount: amt,
                gst_percentage: s.gst_percentage,
                gst_amount: (amt * s.gst_percentage) / 100,
                total_amount: amt + (amt * s.gst_percentage) / 100,
                is_government_fee: false
            };
        });
        
        await supabase.from('invoice_items').insert(items);
        
        alert('✅ Invoice ' + invNo + ' created!');
        invoiceCounter++;
        clearInvoiceForm();
        
    } catch (e) {
        console.error('Error:', e);
        alert('Error: ' + e.message);
    }
}

// Clear form
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

// Print and download stubs
function printInvoice() {
    window.print();
}

function downloadInvoicePDF() {
    alert('PDF download coming soon');
}
