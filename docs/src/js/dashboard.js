import { supabase, showToast } from './common.js';
import { q, formatCurrency } from './utils.js';

async function fetchRecentInvoices(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number, customer_id, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchRecentInvoices', err);
    showToast('Failed to load dashboard invoices', 'error');
    return [];
  }
}

function renderRecentInvoices(rows) {
  const tbody = q('#dashboard-invoices-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.invoice_number}</td>
      <td>${r.customer_id || ''}</td>
      <td style="text-align:right">${formatCurrency(r.total_amount)}</td>
      <td>${new Date(r.created_at).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

// initialize page
const dashboardPage = document.getElementById('dashboard-page');
if (dashboardPage) {
  (async () => {
    const rows = await fetchRecentInvoices(10);
    renderRecentInvoices(rows);
  })();
}
