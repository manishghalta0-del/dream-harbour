// settings.js - Settings Management (modernized, keeps same DB assumptions)

import { supabase } from './common.js';

// Initialize settings page
async function initializeSettings() {
  try {
    const userSession = JSON.parse(localStorage.getItem('userSession'));
    if (!userSession) {
      window.location.href = 'index.html';
      return;
    }

    document.getElementById('userName').textContent = `Welcome, ${userSession.full_name}!`;
    await loadBusinessSettings();
    await loadServiceCategories();
    await loadServiceTypes();

    document.getElementById('businessSettingsForm')?.addEventListener('submit', saveBusinessSettings);
    document.getElementById('addCategoryForm')?.addEventListener('submit', addServiceCategory);
  } catch (error) {
    console.error('Settings init error:', error);
    window.dh && window.dh.showToast ? window.dh.showToast('Error initializing settings', 'error') : alert('Error initializing settings');
  }
}

// Load business settings
async function loadBusinessSettings() {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      document.getElementById('businessName').value = data.business_name || '';
      document.getElementById('gstin').value = data.gstin || '';
      document.getElementById('email').value = data.email || '';
      document.getElementById('phone').value = data.phone || '';
      document.getElementById('address').value = data.address || '';
      document.getElementById('city').value = data.city || '';
      document.getElementById('state').value = data.state || '';
      document.getElementById('pincode').value = data.pincode || '';
      document.getElementById('gstPercentage').value = data.default_gst_percentage || 18;
    }

  } catch (error) {
    console.error('Load settings error:', error);
  }
}

// Save business settings
async function saveBusinessSettings(event) {
  event.preventDefault();

  try {
    const settingsData = {
      business_name: document.getElementById('businessName').value,
      gstin: document.getElementById('gstin').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      pincode: document.getElementById('pincode').value,
      default_gst_percentage: parseFloat(document.getElementById('gstPercentage').value),
      updated_at: new Date().toISOString()
    };

    // Check if settings exist
    const { data: existing } = await supabase
      .from('business_settings')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('business_settings')
        .update(settingsData)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from('business_settings')
        .insert([settingsData]);

      if (error) throw error;
    }

    window.dh && window.dh.showToast ? window.dh.showToast('Business settings saved successfully!', 'success') : alert('Business settings saved successfully!');

  } catch (error) {
    console.error('Save settings error:', error);
    window.dh && window.dh.showError ? window.dh.showError('Error saving settings') : alert('Error saving settings');
  }
}

// Load service categories
async function loadServiceCategories() {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_name');

    if (error) throw error;

    displayServiceCategories(data || []);

  } catch (error) {
    console.error('Load categories error:', error);
  }
}

// Display service categories
function displayServiceCategories(categories) {
  const container = document.getElementById('categoriesList');
  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = '<p class="empty-message">No categories found</p>';
    return;
  }

  container.innerHTML = categories.map(cat => `
    <div class="category-item">
      <div class="category-info">
        <h4>${cat.category_name}</h4>
        <p>Created: ${formatDate(cat.created_at)}</p>
      </div>
      <div class="category-actions">
        <button class="btn btn--sm" data-action="edit" data-id="${cat.id}">Edit</button>
        <button class="btn btn--sm btn--outline" data-action="delete" data-id="${cat.id}">Delete</button>
      </div>
    </div>
  `).join('');

  // delegate events
  container.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', async (e) => {
    const action = e.currentTarget.dataset.action;
    const id = e.currentTarget.dataset.id;
    if (action === 'delete') {
      if (!confirm('Are you sure you want to delete this category?')) return;
      await supabase.from('service_categories').update({ is_active: false }).eq('id', id);
      window.dh && window.dh.showToast ? window.dh.showToast('Category deleted successfully', 'success') : alert('Category deleted');
      await loadServiceCategories();
    } else if (action === 'edit') {
      const newName = prompt('Edit category name:');
      if (!newName) return;
      await supabase.from('service_categories').update({ category_name: newName }).eq('id', id);
      window.dh && window.dh.showToast ? window.dh.showToast('Category updated', 'success') : alert('Category updated');
      await loadServiceCategories();
    }
  }));
}

// Add service category
async function addServiceCategory(event) {
  event.preventDefault();

  try {
    const categoryName = document.getElementById('categoryName').value;

    const { error } = await supabase
      .from('service_categories')
      .insert([{
        category_name: categoryName,
        is_active: true
      }]);

    if (error) throw error;

    window.dh && window.dh.showToast ? window.dh.showToast('Category added successfully!', 'success') : alert('Category added!');
    document.getElementById('categoryName').value = '';
    await loadServiceCategories();

  } catch (error) {
    console.error('Add category error:', error);
    window.dh && window.dh.showError ? window.dh.showError('Error adding category') : alert('Error adding category');
  }
}

// helper formatDate (local fallback)
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Expose init
window.initializeSettings = initializeSettings;
export { initializeSettings, loadBusinessSettings, loadServiceCategories, addServiceCategory };
