// dashboard.js - runtime for DreamHarbour dashboard
// Designed to be module-friendly and also attach globals for legacy usage.

const dh = window.dh || {};
const supabase = (dh && dh.supabase) ? dh.supabase : (window.supabase ? window.supabase : null);

// Notifications helpers (use existing or fallback)
const notify = {
  success: (msg) => { if (window.showSuccess) return window.showSuccess(msg); if (window.createToast) return window.createToast(msg,'success'); alert(msg); },
  error: (msg)   => { if (window.showError) return window.showError(msg); if (window.createToast) return window.createToast(msg,'error'); alert(msg); },
  info: (msg)    => { if (window.showInfo) return window.showInfo(msg); if (window.createToast) return window.createToast(msg,'info'); alert(msg); },
  confirm: async (title, message) => {
    if (typeof window.showConfirmDialog === 'function') {
      try { return await window.showConfirmDialog(title, message); } catch { return confirm(message); }
    }
    return confirm(message);
  },
  loadingShow: (msg) => { if (window.showLoadingOverlay) return window.showLoadingOverlay(msg); /* no-op fallback */ },
  loadingHide: () => { if (window.hideLoadingOverlay) return window.hideLoadingOverlay(); }
};

// Utility helpers (local)
function q(sel) { return document.querySelector(sel); }
function qAll(sel) { return Array.from(document.querySelectorAll(sel)); }
function setText(sel, text) { const el = q(sel); if (el) el.textContent = text; }
function formatINR(amount = 0) { return (dh.formatCurrency ? dh.formatCurrency(amount) : `₹${Number(amount||0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`); }
function formatDate(d) { if (!d) return 'N/A'; const dt = new Date(d); return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// --- Dashboard Core ---
async function initDashboard() {
  try {
    const user = JSON.parse(localStorage.getItem('userSession') || 'null');
    if (!user) { window.location.href = 'index.html'; return; }

    // header UI
    setText('#userName', user.full_name || 'User');
    setText('#userRole', user.role || '');

    // wire buttons
    q('#btnRefresh')?.addEventListener('click', async () => {
      await loadAll();
      notify.success('Refreshed');
    });
    q('#btnExport')?.addEventListener('click', () => notify.info('Export to PDF coming soon'));
    q('#btnLogout')?.addEventListener('click', async () => {
      const ok = await notify.confirm('Logout', 'Are you sure you want to logout?');
      if (!ok) return;
      localStorage.removeItem('dreamHarbourUser');
      localStorage.removeItem('userSession');
      window.location.href = 'index.html';
    });

    // initial load
    await loadAll();
  } catch (err) {
    console.error('initDashboard error', err);
    notify.error('Unable to initialize dashboard');
  }
}

async function loadAll() {
  notify.loadingShow && notify.loadingShow('Loading dashboard...');
  await Promise.allSettled([loadStats(), loadRecentInvoices(), loadTopServices()]);
  notify.loadingHide && notify.loadingHide();
}

/* ---------- Stats ---------- */
async function loadStats() {
  if (!supabase) { console.warn('Supabase client missing'); return; }
  try {
    // Use aggregate queries where possible (supabase supports .select('count', { count: 'exact' }) for counts)
    // We'll fetch a small payload and compute client-side for simplicity.
    const { data: invoices, error: invErr } = await supabase.from('invoices').select('id, total_amount, payment_status, created_at');
    if (invErr) throw invErr;

    const { data: customers, error: custErr } = await supabase.from('customers').select('id');
    if (custErr) throw custErr;

    const totalInvoices = (invoices || []).length;
    const totalRevenue = (invoices || []).reduce((s, i) => s + (Number(i.total_amount || 0)), 0);
    const pendingCount = (invoices || []).filter(i => (i.payment_status || '').toLowerCase() !== 'paid').length;
    const totalCustomers = (customers || []).length;

    setText('#statInvoices', totalInvoices);
    setText('#statRevenue', formatINR(totalRevenue));
    setText('#statPending', pendingCount);
    setText('#statCustomers', totalCustomers);
  } catch (err) {
    console.error('loadStats error', err);
    notify.error('Failed to load stats');
  }
}

/* ---------- Recent invoices ---------- */
async function loadRecentInvoices(limit = 8) {
  if (!supabase) return;
  try {
    const tbody = q('#recentInvoicesBody');
    if (!tbody) return;

    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, total_gst, payment_status, invoice_date, created_at, customer_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="dh-muted">No recent invoices</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(inv => `
      <tr data-id="${esc(inv.id)}">
        <td>${esc(inv.invoice_number || '-')}</td>
        <td>${formatINR(inv.total_amount)}</td>
        <td>${formatINR(inv.total_gst)}</td>
        <td><span class="dh-badge ${inv.payment_status ? 'dh-badge--' + esc(inv.payment_status.toLowerCase()) : ''}">${esc(inv.payment_status || 'unknown')}</span></td>
        <td>${formatDate(inv.invoice_date || inv.created_at)}</td>
        <td class="td-actions">
          <button class="btn btn--sm" data-action="view" data-id="${esc(inv.id)}">View</button>
          <button class="btn btn--sm btn--outline" data-action="delete" data-id="${esc(inv.id)}">Delete</button>
        </td>
      </tr>
    `).join('');

    // wire actions
    qAll('#recentInvoicesBody [data-action]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const a = e.currentTarget;
        const action = a.dataset.action;
        const id = a.dataset.id;
        if (action === 'view') {
          window.location.href = `invoice_view.html?id=${encodeURIComponent(id)}`;
        } else if (action === 'delete') {
          const ok = await notify.confirm('Delete invoice', 'Are you sure you want to delete this invoice?');
          if (!ok) return;
          try {
            const { error } = await supabase.from('invoices').delete().eq('id', id);
            if (error) throw error;
            notify.success('Invoice deleted');
            await loadRecentInvoices(limit);
            await loadStats();
          } catch (err) {
            console.error('delete invoice', err);
            notify.error('Delete failed');
          }
        }
      });
    });

  } catch (err) {
    console.error('loadRecentInvoices', err);
    notify.error('Unable to load recent invoices');
  }
}

/* ---------- Top services list ---------- */
async function loadTopServices() {
  if (!supabase) return;
  try {
    const el = q('#topServices');
    if (!el) return;
    const { data, error } = await supabase
      .from('service_types')
      .select('id, service_name, base_rate')
      .eq('is_active', true)
      .order('service_name')
      .limit(8);
    if (error) throw error;
    el.innerHTML = (data || []).map(s => `<li>${esc(s.service_name)} <span class="dh-muted">${formatINR(s.base_rate)}</span></li>`).join('') || '<li class="dh-muted">No services</li>';
  } catch (err) {
    console.error('loadTopServices error', err);
  }
}

/* ---------- Expose/auto-init ---------- */
document.addEventListener('DOMContentLoaded', initDashboard);
window.initializeDashboard = initDashboard;
export { initDashboard, loadAll, loadStats, loadRecentInvoices, loadTopServices };