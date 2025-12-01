import { supabase, showToast } from './common.js';
import { q, formatCurrency } from './utils.js';

let currentPage = 1;
const pageSize = 25;

export async function fetchInvoices(page = 1) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id,invoice_number,customer_id,subtotal,total_gst,total_amount,payment_status,created_at')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchInvoices', err);
    showToast('Failed to load invoices', 'error');
    return [];
  }
}

export function renderInvoices(rows) {
  const tbody = q('#invoices-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.invoice_number}</td>
      <td>${r.customer_id || ''}</td>
      <td style="text-align:right">${formatCurrency(r.subtotal)}</td>
      <td style="text-align:right">${formatCurrency(r.total_gst)}</td>
      <td style="text-align:right">${formatCurrency(r.total_amount)}</td>
      <td>${r.payment_status || ''}</td>
      <td>${new Date(r.created_at).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

// attach to page if present
const invoicesPage = document.getElementById('invoices-page');
if (invoicesPage) {
  async function load() {
    const rows = await fetchInvoices(currentPage);
    renderInvoices(rows);
  }
  document.getElementById('inv-next')?.addEventListener('click', async () => {
    currentPage += 1; await load();
  });
  document.getElementById('inv-prev')?.addEventListener('click', async () => {
    if (currentPage > 1) currentPage -= 1; await load();
  });
  load();
}
