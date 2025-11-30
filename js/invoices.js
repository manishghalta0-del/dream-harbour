// invoices.js - Invoice Management (rewritten, .js module-friendly)

import { supabase } from './common.js';

// State
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
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRole');
    if (nameEl) nameEl.textContent = `Welcome, ${currentUser.full_name}!`;
    if (roleEl) roleEl.textContent = currentUser.role;

    await loadServiceTypes();
    await loadInvoices();

    document.getElementById('invoiceForm')?.addEventListener('submit', createInvoice);
  } catch (error) {
    console.error('Invoices init error:', error);
    window.dh && window.dh.showError ? window.dh.showError('Error initializing invoices', 'error') : alert('Error initializing invoices');
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
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    displayInvoicesList(data || []);

  } catch (error) {
    console.error('Load invoices error:', error);
    window.dh && window.dh.showError ? window.dh.showError('Error loading invoices', 'error') : alert('Error loading invoices');
  }
}

// Display invoices list
function displayInvoicesList(invoices) {
  const tbody = document.getElementById('invoicesTableBody') || document.querySelector('table tbody');

  if (!tbody) {
    console.warn('Table body not found');
    return;
  }

  if (invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No invoices found</p></td></tr>';
    return;
  }

  tbody.innerHTML = invoices.map(inv => `
    <tr data-id="${inv.id}">
      <td>${inv.invoice_number}</td>
      <td>${formatCurrency(inv.subtotal)}</td>
      <td>${formatCurrency(inv.total_gst)}</td>
      <td>${formatCurrency(inv.total_amount)}</td>
      <td><span class="status-badge status-${inv.payment_status}">${inv.payment_status}</span></td>
      <td>
        <button class="btn btn--sm" data-action="edit" data-id="${inv.id}">Edit</button>
        <button class="btn btn--sm" data-action="delete" data-id="${inv.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', async (e) => {
    const action = e.currentTarget.dataset.action;
    const id = e.currentTarget.dataset.id;
    if (action === 'delete') {
      if (!confirm('Are you sure you want to delete this invoice?')) return;
      await deleteInvoice(id);
    } else if (action === 'edit') {
      editInvoice(id);
    }
  }));
}

// Load service types for dropdown
async function loadServiceTypes() {
  try {
    const { data, error } = await supabase
      .from('service_types')
      .select('id, service_name, base_rate, gst_percentage')
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
    services.map(s => `<option value="${s.id}" data-rate="${s.base_rate}" data-gst="${s.gst_percentage}">${s.service_name}</option>`).join('');
}

// Create new invoice
async function createInvoice(event) {
  event.preventDefault();

  try {
    const customerPhone = document.getElementById('customerPhone')?.value;
    const invoiceDate = new Date().toISOString();

    if (!customerPhone) {
      window.dh && window.dh.showWarning ? window.dh.showWarning('Customer phone required') : alert('Customer phone required');
      return;
    }

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
          full_name: document.getElementById('customerName')?.value,
          email: document.getElementById('customerEmail')?.value
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
    if (serviceSelect && serviceSelect.value) {
      const rate = parseFloat(serviceSelect.selectedOptions[0].dataset.rate) || 0;
      const gstPercent = parseFloat(serviceSelect.selectedOptions[0].dataset.gst) || 0;
      const quantity = parseFloat(document.getElementById('quantity')?.value) || 1;
      const amount = +(rate * quantity).toFixed(2);
      const gst = +((amount * gstPercent) / 100).toFixed(2);

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
    const totalAmount = +(subtotal + totalGst).toFixed(2);

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

    window.dh && window.dh.showSuccess ? window.dh.showSuccess('Invoice created successfully!') : alert('Invoice created successfully!');
    document.getElementById('invoiceForm')?.reset();
    await loadInvoices();

  } catch (error) {
    console.error('Create invoice error:', error);
    window.dh && window.dh.showError ? window.dh.showError('Error creating invoice') : alert('Error creating invoice');
  }
}

// Edit invoice
function editInvoice(invoiceId) {
  currentInvoiceId = invoiceId;
  window.dh && window.dh.showInfo ? window.dh.showInfo('Edit functionality coming soon', 'info') : alert('Edit coming soon');
}

// Delete invoice
async function deleteInvoice(invoiceId) {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
    window.dh && window.dh.showSuccess ? window.dh.showSuccess('Invoice deleted') : alert('Invoice deleted');
    await loadInvoices();
  } catch (err) {
    console.error('Delete invoice error:', err);
    window.dh && window.dh.showError ? window.dh.showError('Error deleting invoice') : alert('Error deleting invoice');
  }
}

// Helper formatCurrency local fallback
function formatCurrency(amount) {
  return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Expose init for pages
window.initializeInvoices = initializeInvoices;
export { initializeInvoices, loadInvoices, createInvoice };
