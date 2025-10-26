// js/invoice.js
console.log('✓ invoice.js loading');

let currentServices = [];
let allServices = [];
let invoiceNumber = 1;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ invoice.js DOM ready');
    loadServices();
});

// LOAD SERVICES
async function loadServices() {
    try {
        console.log('📡 Loading services...');
        
        if (!window.supabase) {
            console.error('❌ Supabase not available');
            return;
        }
        
        const { data, error } = await window.supabase
            .from('services_config')
            .select('*')
            .eq('is_active', true);
        
        if (error) throw error;
        if (!data || data.length === 0) {
            console.warn('⚠️ No services found');
            return;
        }
        
        allServices = data;
        console.log('✅ Loaded ' + data.length + ' services');
        
        // Populate dropdown
        const select = document.getElementById('serviceType');
        if (select) {
            select.innerHTML = '<option value="">-- Select Service --</option>';
            data.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.service_name;
                select.appendChild(opt);
            });
            console.log('✅ Dropdown populated');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// ADD SERVICE
function addService() {
    const sel = document.getElementById('serviceType');
    if (!sel.value) {
        alert('Select a service');
        return;
    }
    
    const svc = allServices.find(s => s.id === sel.value);
    if (!svc) return;
    
    currentServices.push({
        id: Date.now(),
        ...svc,
        amount: 0
    });
    
    sel.value = '';
    renderServices();
    updatePreview();
}

// RENDER SERVICES LIST
function renderServices() {
    const list = document.getElementById('servicesList');
    if (!list) return;
    
    list.innerHTML = '';
    
    currentServices.forEach((s, i) => {
        const div = document.createElement('div');
        div.style.cssText = 'background:#f0f9ff;padding:12px;border-radius:6px;margin:8px 0;';
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <strong>${s.service_name}</strong>
                <button onclick="removeService(${i})" style="background:#ef4444;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;">Remove</button>
            </div>
            <input type="number" step="0.01" value="0" onchange="updateService(${i},this.value)" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;">
        `;
        list.appendChild(div);
    });
}

// UPDATE SERVICE AMOUNT
function updateService(idx, val) {
    currentServices[idx].amount = parseFloat(val) || 0;
    updatePreview();
}

// REMOVE SERVICE
function removeService(idx) {
    currentServices.splice(idx, 1);
    renderServices();
    updatePreview();
}

// UPDATE PREVIEW
function updatePreview() {
    const name = document.getElementById('fullName')?.value || '-';
    const mobile = document.getElementById('mobileNumber')?.value || '-';
    
    document.getElementById('previewName').textContent = name;
    document.getElementById('previewMobile').textContent = mobile;
    document.getElementById('previewDate').textContent = new Date().toLocaleDateString();
    document.getElementById('previewInvoiceNo').textContent = 'DH' + String(invoiceNumber).padStart(5, '0');
    
    let subtotal = 0, gst = 0;
    const tbody = document.getElementById('invoiceTableBody');
    tbody.innerHTML = '';
    
    currentServices.forEach((s, i) => {
        const amt = s.amount;
        const g = (amt * (s.gst_percentage || 18)) / 100;
        subtotal += amt;
        gst += g;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i+1}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${s.service_name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">1</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${amt.toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${s.gst_percentage}%</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${g.toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">₹${(amt+g).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('previewSubtotal').textContent = '₹' + subtotal.toFixed(2);
    document.getElementById('previewTotalGst').textContent = '₹' + gst.toFixed(2);
    document.getElementById('previewGrandTotal').textContent = '₹' + (subtotal + gst).toFixed(2);
}

// SEARCH CUSTOMER
async function searchCustomer() {
    const mobile = document.getElementById('mobileNumber').value.trim();
    if (!/^\d{10}$/.test(mobile)) return;
    
    try {
        const { data } = await window.supabase.from('customers').select('*').eq('mobile_no', mobile);
        
        const div = document.getElementById('existingCustomers');
        if (data && data.length > 0) {
            div.style.display = 'block';
            div.innerHTML = '<strong style="color:green;">✓ Found:</strong>';
            data.forEach(c => {
                const btn = document.createElement('div');
                btn.style.cssText = 'padding:8px;margin:5px 0;background:white;border:2px solid #10b981;border-radius:6px;cursor:pointer;';
                btn.textContent = c.full_name;
                btn.onclick = () => {
                    document.getElementById('fullName').value = c.full_name;
                    document.getElementById('email').value = c.email || '';
                    div.style.display = 'none';
                    updatePreview();
                };
                div.appendChild(btn);
            });
        } else {
            div.style.display = 'block';
            div.innerHTML = '<p style="color:#f59e0b;">ℹ️ New customer</p>';
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

// GENERATE INVOICE
function generateInvoice() {
    const name = document.getElementById('fullName')?.value?.trim();
    const mobile = document.getElementById('mobileNumber')?.value?.trim();
    
    if (!name || !/^\d{10}$/.test(mobile)) {
        alert('⚠️ Enter valid details');
        return;
    }
    
    if (currentServices.length === 0) {
        alert('⚠️ Add services');
        return;
    }
    
    alert('✅ Invoice #' + invoiceNumber + ' created!');
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
    document.getElementById('existingCustomers').style.display = 'none';
    currentServices = [];
    renderServices();
    updatePreview();
}

// PRINT
function printInvoice() {
    window.print();
}

function downloadInvoicePDF() {
    alert('Coming soon');
}

console.log('✓ invoice.js ready');
