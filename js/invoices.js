// ============================================================================
// js/invoices.js - Invoice Management (FIXED FOR YOUR SCHEMA)
// ============================================================================
// Uses: invoices, invoice_items, customers, service_types tables
// ============================================================================

let currentUser = null;
let currentInvoiceId = null;

// Initialize invoices page
async function initializeInvoices() {
  try {
    const userSession = JSON.parse(localStorage.getItem('userSession'));
    if (!userSession) {
      window.location.href = 'index.html';
      return;
    }
    
    currentUser = userSession;
    document.getElementById('userName').textContent = `Welcome, ${currentUser.full_name}!`;
    document.getElementById('userRole').textContent = currentUser.role;
    
    await loadInvoices();
    await loadServiceTypes();
    
  } catch (error) {
    console.error('Invoices init error:', error);
    showToast('Error initializing invoices', 'error');
  }
}

// Load all invoices
async function loadInvoices() {
  try {
    const { data, error } = await supabase
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
    
    if (error) throw error;
    
    displayInvoicesList(data || []);
    
  } catch (error) {
    console.error('Load invoices error:', error);
    showToast('Error loading invoices', 'error');
  }
}

// Display invoices list
function displayInvoicesList(invoices) {
  const tbody = document.getElementById('invoicesTableBody') || 
                document.querySelector('table tbody');
  
  if (!tbody) {
    console.warn('Table body not found');
    return;
  }
  
  if (invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No invoices found</p></td></tr>';
    return;
  }
  
  tbody.innerHTML = invoices.map(inv => `
    <tr>
      <td>${inv.invoice_number}</td>
      <td>${formatCurrency(inv.subtotal)}</td>
      <td>${formatCurrency(inv.total_gst)}</td>
      <td>${formatCurrency(inv.total_amount)}</td>
      <td><span class="status-badge status-${inv.payment_status}">${inv.payment_status}</span></td>
      <td>
        <button class="btn btn--sm" onclick="editInvoice('${inv.id}')">Edit</button>
        <button class="btn btn--sm" onclick="deleteInvoice('${inv.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Load service types for dropdown
async function loadServiceTypes() {
  try {
    const { data, error } = await supabase
      .from('service_types')
      .select('id, service_name, rate, gst_percentage')
      .eq('is_active', true);
    
    if (error) throw error;
    
    populateServiceDropdown(data || []);
    
  } catch (error) {
    console.error('Load services error:', error);
  }
}

// Populate service dropdown
function populateServiceDropdown(services) {
  const select = document.getElementById('serviceSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Select Service --</option>' + 
    services.map(s => `<option value="${s.id}" data-rate="${s.rate}" data-gst="${s.gst_percentage}">${s.service_name}</option>`).join('');
}

// Create new invoice
async function createInvoice(event) {
  event.preventDefault();
  
  try {
    const customerPhone = document.getElementById('customerPhone').value;
    const invoiceDate = new Date().toISOString();
    
    // Get or create customer
    let customerId;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('mobile_no', customerPhone)
      .single();
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          mobile_no: customerPhone,
          full_name: document.getElementById('customerName').value,
          email: document.getElementById('customerEmail').value
        }])
        .select()
        .single();
      
      if (customerError) throw customerError;
      customerId = newCustomer.id;
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Calculate totals
    const items = [];
    const serviceSelect = document.getElementById('serviceSelect');
    if (serviceSelect.value) {
      const rate = parseFloat(serviceSelect.selectedOptions[0].dataset.rate);
      const gstPercent = parseFloat(serviceSelect.selectedOptions[0].dataset.gst);
      const quantity = parseFloat(document.getElementById('quantity').value) || 1;
      const amount = rate * quantity;
      const gst = (amount * gstPercent) / 100;
      
      items.push({
        description: serviceSelect.selectedOptions[0].text,
        rate: rate,
        quantity: quantity,
        gst_percentage: gstPercent,
        amount: amount
      });
    }
    
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const totalGst = items.reduce((s, i) => s + (i.amount * i.gst_percentage / 100), 0);
    const totalAmount = subtotal + totalGst;
    
    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        invoice_number: invoiceNumber,
        customer_id: customerId,
        created_by: currentUser.id,
        invoice_date: invoiceDate,
        subtotal: subtotal,
        total_gst: totalGst,
        total_amount: totalAmount,
        payment_status: 'pending'
      }])
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    // Add invoice items
    for (const item of items) {
      await supabase.from('invoice_items').insert([{
        invoice_id: invoice.id,
        description: item.description,
        rate: item.rate,
        quantity: item.quantity,
        gst_percentage: item.gst_percentage,
        amount: item.amount
      }]);
    }
    
    showToast('Invoice created successfully!', 'success');
    document.getElementById('invoiceForm').reset();
    await loadInvoices();
    
  } catch (error) {
    console.error('Create invoice error:', error);
    showToast('Error creating invoice', 'error');
  }
}

// Edit invoice
function editInvoice(invoiceId) {
  currentInvoiceId = invoiceId;
  showToast('Edit functionality coming soon', 'info');
}

// Delete invoice
async function deleteInvoice(invoiceId) {
  if (!confirm('Are you sure you want to delete this invoice?')) return;
  
  try {
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);
    
    if (itemsError) throw itemsError;
    
    const { error: invoiceError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);
    
    if (invoiceError) throw invoiceError;
    
    showToast('Invoice deleted successfully', 'success');
    await loadInvoices();
    
  } catch (error) {
    console.error('Delete invoice error:', error);
    showToast('Error deleting invoice', 'error');
  }
}

// Search invoices
async function searchInvoices(query) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .ilike('invoice_number', `%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    displayInvoicesList(data || []);
    
  } catch (error) {
    console.error('Search error:', error);
  }
}

// Export for HTML
window.createInvoice = createInvoice;
window.editInvoice = editInvoice;
window.deleteInvoice = deleteInvoice;
window.searchInvoices = searchInvoices;
window.logout = logout;
window.initializeInvoices = initializeInvoices;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeInvoices();
});

console.log('✅ invoices.js loaded successfully');