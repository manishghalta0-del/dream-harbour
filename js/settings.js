// ============================================================================
// js/settings.js - Settings Management (FIXED FOR YOUR SCHEMA)
// ============================================================================
// Uses: business_settings, service_types, service_categories tables
// ============================================================================

let currentUser = null;

// Initialize settings page
async function initializeSettings() {
  try {
    const userSession = JSON.parse(localStorage.getItem('userSession'));
    if (!userSession) {
      window.location.href = 'index.html';
      return;
    }
    
    currentUser = userSession;
    document.getElementById('userName').textContent = `Welcome, ${currentUser.full_name}!`;
    document.getElementById('userRole').textContent = currentUser.role;
    
    await loadBusinessSettings();
    await loadServiceCategories();
    await loadServiceTypes();
    
  } catch (error) {
    console.error('Settings init error:', error);
    showToast('Error initializing settings', 'error');
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
    
    showToast('Business settings saved successfully!', 'success');
    
  } catch (error) {
    console.error('Save settings error:', error);
    showToast('Error saving settings', 'error');
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
        <button class="btn btn--sm" onclick="editCategory('${cat.id}')">Edit</button>
        <button class="btn btn--sm btn--outline" onclick="deleteCategory('${cat.id}')">Delete</button>
      </div>
    </div>
  `).join('');
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
    
    showToast('Category added successfully!', 'success');
    document.getElementById('categoryName').value = '';
    await loadServiceCategories();
    
  } catch (error) {
    console.error('Add category error:', error);
    showToast('Error adding category', 'error');
  }
}

// Delete service category
async function deleteCategory(categoryId) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  
  try {
    const { error } = await supabase
      .from('service_categories')
      .update({ is_active: false })
      .eq('id', categoryId);
    
    if (error) throw error;
    
    showToast('Category deleted successfully', 'success');
    await loadServiceCategories();
    
  } catch (error) {
    console.error('Delete category error:', error);
    showToast('Error deleting category', 'error');
  }
}

// Load service types
async function loadServiceTypes() {
  try {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('service_name');
    
    if (error) throw error;
    
    displayServiceTypes(data || []);
    
  } catch (error) {
    console.error('Load services error:', error);
  }
}

// Display service types
function displayServiceTypes(services) {
  const container = document.getElementById('servicesList');
  if (!container) return;
  
  if (services.length === 0) {
    container.innerHTML = '<p class="empty-message">No services found</p>';
    return;
  }
  
  container.innerHTML = services.map(svc => `
    <div class="service-item">
      <div class="service-info">
        <h4>${svc.service_name}</h4>
        <p>Rate: ${formatCurrency(svc.base_rate)} | GST: ${svc.gst_percentage}%</p>
        <p>SAC: ${svc.sac_code || 'N/A'}</p>
      </div>
      <div class="service-actions">
        <button class="btn btn--sm" onclick="editService('${svc.id}')">Edit</button>
        <button class="btn btn--sm btn--outline" onclick="deleteService('${svc.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// Add service type
async function addServiceType(event) {
  event.preventDefault();
  
  try {
    const { error } = await supabase
      .from('service_types')
      .insert([{
        service_name: document.getElementById('serviceName').value,
        sac_code: document.getElementById('sacCode').value,
        base_rate: parseFloat(document.getElementById('serviceRate').value),
        gst_percentage: parseFloat(document.getElementById('serviceGst').value),
        is_active: true
      }]);
    
    if (error) throw error;
    
    showToast('Service added successfully!', 'success');
    document.getElementById('serviceForm').reset();
    await loadServiceTypes();
    
  } catch (error) {
    console.error('Add service error:', error);
    showToast('Error adding service', 'error');
  }
}

// Delete service type
async function deleteService(serviceId) {
  if (!confirm('Are you sure you want to delete this service?')) return;
  
  try {
    const { error } = await supabase
      .from('service_types')
      .update({ is_active: false })
      .eq('id', serviceId);
    
    if (error) throw error;
    
    showToast('Service deleted successfully', 'success');
    await loadServiceTypes();
    
  } catch (error) {
    console.error('Delete service error:', error);
    showToast('Error deleting service', 'error');
  }
}

// Utility functions
function editCategory(categoryId) {
  showToast('Edit category coming soon', 'info');
}

function editService(serviceId) {
  showToast('Edit service coming soon', 'info');
}

// Export for HTML
window.saveBusinessSettings = saveBusinessSettings;
window.addServiceCategory = addServiceCategory;
window.deleteCategory = deleteCategory;
window.editCategory = editCategory;
window.addServiceType = addServiceType;
window.deleteService = deleteService;
window.editService = editService;
window.logout = logout;
window.initializeSettings = initializeSettings;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeSettings();
});

console.log('✅ settings.js loaded successfully');