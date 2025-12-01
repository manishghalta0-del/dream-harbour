import { supabase, showToast } from './common.js';
import { q } from './utils.js';

const form = document.getElementById('business-settings-form');

async function loadSettings() {
  try {
    const { data, error } = await supabase.from('business_settings').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') { // not found
      throw error;
    }
    if (data) {
      document.getElementById('business_name').value = data.business_name || '';
      document.getElementById('gst_no').value = data.gst_no || '';
      document.getElementById('currency').value = data.currency || 'INR';
    }
  } catch (err) {
    console.error('loadSettings', err);
    showToast('Failed to load settings', 'error');
  }
}

async function saveSettings(payload) {
  try {
    // upsert the single settings row (assuming unique id or singleton behavior)
    const { data, error } = await supabase.from('business_settings').upsert(payload, { onConflict: 'id' }).select();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('saveSettings', err);
    showToast('Failed to save settings', 'error');
    return null;
  }
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      business_name: document.getElementById('business_name').value,
      gst_no: document.getElementById('gst_no').value,
      currency: document.getElementById('currency').value,
      updated_at: new Date().toISOString()
    };
    const res = await saveSettings(payload);
    if (res) showToast('Settings saved', 'success');
  });
  // initial load
  loadSettings();
}
