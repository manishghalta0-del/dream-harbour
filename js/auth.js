// ============================================================================
// js/auth.js - Login Authentication (FIXED FOR YOUR SCHEMA)
// ============================================================================
// Uses 'users' table with columns: phone_number, pin, full_name, role, is_active
// ============================================================================

// Load remembered phone on page load
function loadRememberedPhone() {
  const remembered = localStorage.getItem('dreamHarbourRememberedPhone');
  if (remembered) {
    document.getElementById('phoneNumber').value = remembered;
    document.getElementById('rememberMe').checked = true;
    validatePhone();
  }
}

// Save phone if "Remember Me" is checked
function saveRememberedPhone(phone) {
  if (document.getElementById('rememberMe').checked) {
    localStorage.setItem('dreamHarbourRememberedPhone', phone);
  } else {
    localStorage.removeItem('dreamHarbourRememberedPhone');
  }
}

// Validate phone in real-time
function validatePhone() {
  const phone = document.getElementById('phoneNumber').value;
  const feedback = document.getElementById('phoneValidation');
  
  if (!phone) {
    feedback.textContent = '';
    return;
  }
  
  if (phone.length < 10) {
    feedback.className = 'validation-feedback invalid';
    feedback.innerHTML = `❌ ${10 - phone.length} more digits needed`;
  } else if (phone.length === 10 && /^[0-9]{10}$/.test(phone)) {
    feedback.className = 'validation-feedback valid';
    feedback.innerHTML = '✓ Valid phone number';
  } else if (phone.length === 10) {
    feedback.className = 'validation-feedback invalid';
    feedback.innerHTML = '❌ Only numbers allowed';
  }
}

// Validate PIN in real-time
function validatePin() {
  const pin = document.getElementById('pin').value;
  const feedback = document.getElementById('pinValidation');
  
  if (!pin) {
    feedback.textContent = '';
    return;
  }
  
  if (pin.length < 6) {
    feedback.className = 'validation-feedback invalid';
    feedback.innerHTML = `❌ ${6 - pin.length} more digits needed`;
  } else if (pin.length === 6 && /^[0-9]{6}$/.test(pin)) {
    feedback.className = 'validation-feedback valid';
    feedback.innerHTML = '✓ Valid PIN';
  } else if (pin.length === 6) {
    feedback.className = 'validation-feedback invalid';
    feedback.innerHTML = '❌ Only numbers allowed';
  }
}

// Move to PIN step
function nextStep(event) {
  event.preventDefault();
  const phone = document.getElementById('phoneNumber').value;
  const errorDiv = document.getElementById('step1Error');
  errorDiv.classList.remove('show');
  
  if (!phone) {
    errorDiv.classList.add('show');
    errorDiv.innerHTML = `❌ Phone number is required (E001)`;
    return;
  }
  
  if (phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
    errorDiv.classList.add('show');
    errorDiv.innerHTML = `❌ Invalid phone number format (E002)`;
    return;
  }
  
  saveRememberedPhone(phone);
  document.getElementById('step1Form').classList.add('inactive');
  document.getElementById('step2Form').classList.add('active');
  document.getElementById('step1Indicator').classList.add('completed');
  document.getElementById('step2Indicator').classList.add('active');
  document.getElementById('pin').focus();
}

// Go back to phone step
function backStep() {
  document.getElementById('step1Form').classList.remove('inactive');
  document.getElementById('step2Form').classList.remove('active');
  document.getElementById('step1Indicator').classList.remove('completed');
  document.getElementById('step2Indicator').classList.remove('active');
  document.getElementById('step2Error').classList.remove('show');
  document.getElementById('phoneNumber').focus();
}

// Handle login - query 'users' table
async function handleLogin(event) {
  event.preventDefault();
  const phone = document.getElementById('phoneNumber').value;
  const pin = document.getElementById('pin').value;
  const errorDiv = document.getElementById('step2Error');
  const successDiv = document.getElementById('successMessage');
  const button = event.target.querySelector('button[type="submit"]');
  
  errorDiv.classList.remove('show');
  successDiv.classList.remove('show');
  
  // Validation
  if (!pin) {
    errorDiv.classList.add('show');
    errorDiv.innerHTML = `❌ PIN is required (E004)`;
    return;
  }
  
  if (pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
    errorDiv.classList.add('show');
    errorDiv.innerHTML = `❌ PIN must be exactly 6 digits (E005)`;
    return;
  }
  
  // Loading state
  button.disabled = true;
  button.classList.add('loading');
  button.textContent = 'Signing in...';
  
  try {
    // Query users table with phone_number and pin
    const { data, error } = await supabase
      .from('users')
      .select('id, phone_number, full_name, role, is_active')
      .eq('phone_number', phone)
      .eq('pin', pin)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      errorDiv.classList.add('show');
      errorDiv.innerHTML = `❌ Invalid phone or PIN (E006)`;
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = 'Sign In';
      return;
    }
    
    // Success - save user data
    const userData = {
      id: data.id,
      phone: data.phone_number,
      full_name: data.full_name,
      role: data.role || 'user'
    };
    
    localStorage.setItem('dreamHarbourUser', JSON.stringify(userData));
    localStorage.setItem('userSession', JSON.stringify(userData));
    
    successDiv.classList.add('show');
    successDiv.textContent = '✓ Login successful! Redirecting...';
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.classList.add('show');
    errorDiv.innerHTML = `❌ Connection error (E007)`;
  } finally {
    button.disabled = false;
    button.classList.remove('loading');
    button.textContent = 'Sign In';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadRememberedPhone();
});

console.log('✅ auth.js loaded successfully');