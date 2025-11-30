// auth.js - Login Authentication (modern rewrite)
// Uses Supabase 'users' table assumed to have 'hashed_pin' column for comparison.
// If you still store plaintext 'pin' in DB, change the query accordingly (not recommended).

import { supabase, showToast as commonToast } from './common.js'; // for usage in module-aware pages
// but since common.js also attaches window.dh, we can fallback to window.dh.supabase in legacy pages

// Helper: SHA-256 hex (client-side)
async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Save phone if remember checked
function saveRememberedPhone(phone) {
  if (document.getElementById('rememberMe')?.checked) {
    localStorage.setItem('dreamHarbourRememberedPhone', phone);
  } else {
    localStorage.removeItem('dreamHarbourRememberedPhone');
  }
}

function loadRememberedPhone() {
  const remembered = localStorage.getItem('dreamHarbourRememberedPhone');
  if (remembered) {
    document.getElementById('phoneNumber').value = remembered;
    document.getElementById('rememberMe').checked = true;
  }
}

// Real-time validators (attach in init)
function validatePhone() {
  const phone = document.getElementById('phoneNumber')?.value || '';
  const feedback = document.getElementById('phoneValidation');
  if (!feedback) return;
  if (!phone) { feedback.textContent = ''; return; }
  if (phone.length < 10) { feedback.className = 'validation-feedback invalid'; feedback.innerHTML = `❌ ${10 - phone.length} more digits needed`; }
  else if (phone.length === 10 && /^[0-9]{10}$/.test(phone)) { feedback.className = 'validation-feedback valid'; feedback.innerHTML = '✓ Valid phone number'; }
  else if (phone.length === 10) { feedback.className = 'validation-feedback invalid'; feedback.innerHTML = '❌ Only numbers allowed'; }
}

function validatePin() {
  const pin = document.getElementById('pin')?.value || '';
  const feedback = document.getElementById('pinValidation');
  if (!feedback) return;
  if (!pin) { feedback.textContent = ''; return; }
  if (pin.length < 6) { feedback.className = 'validation-feedback invalid'; feedback.innerHTML = `❌ ${6 - pin.length} more digits needed`; }
  else if (pin.length === 6 && /^[0-9]{6}$/.test(pin)) { feedback.className = 'validation-feedback valid'; feedback.innerHTML = '✓ Valid PIN'; }
  else if (pin.length === 6) { feedback.className = 'validation-feedback invalid'; feedback.innerHTML = '❌ Only numbers allowed'; }
}

// Handle login submit
async function handleLogin(event) {
  event.preventDefault();
  const phone = document.getElementById('phoneNumber')?.value?.trim();
  const pin = document.getElementById('pin')?.value?.trim();
  const errorDiv = document.getElementById('step2Error');
  const successDiv = document.getElementById('successMessage');
  const button = event.target.querySelector('button[type=\"submit\"]');

  if (errorDiv) errorDiv.classList.remove('show');
  if (successDiv) successDiv.classList.remove('show');

  if (!pin) {
    if (errorDiv) { errorDiv.classList.add('show'); errorDiv.innerHTML = `❌ PIN is required (E004)`; }
    return;
  }
  if (pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
    if (errorDiv) { errorDiv.classList.add('show'); errorDiv.innerHTML = `❌ PIN must be exactly 6 digits (E005)`; }
    return;
  }

  // loading state
  if (button) { button.disabled = true; button.classList.add('loading'); button.textContent = 'Signing in...'; }

  try {
    const hashed = await sha256Hex(pin);
    // Try module export supabase, else fallback to window.dh.supabase
    const sb = (typeof supabase !== 'undefined') ? supabase : (window.dh && window.dh.supabase);
    const { data, error } = await sb
      .from('users')
      .select('id, phone_number, full_name, role, is_active')
      .eq('phone_number', phone)
      .eq('hashed_pin', hashed)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      if (errorDiv) { errorDiv.classList.add('show'); errorDiv.innerHTML = `❌ Invalid phone or PIN (E006)`; }
      else alert('Invalid phone or PIN');
      if (button) { button.disabled = false; button.classList.remove('loading'); button.textContent = 'Sign In'; }
      return;
    }

    const userData = {
      id: data.id,
      phone: data.phone_number,
      full_name: data.full_name,
      role: data.role || 'user'
    };

    localStorage.setItem('dreamHarbourUser', JSON.stringify(userData));
    localStorage.setItem('userSession', JSON.stringify(userData));

    if (successDiv) { successDiv.classList.add('show'); successDiv.textContent = '✓ Login successful! Redirecting...'; }
    else console.log('Login successful');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  } catch (err) {
    console.error('Login error:', err);
    if (errorDiv) { errorDiv.classList.add('show'); errorDiv.innerHTML = `❌ Unexpected error (E007)`; }
  } finally {
    if (button) { button.disabled = false; button.classList.remove('loading'); button.textContent = 'Sign In'; }
  }
}

// Initialization wiring for the login page
function initAuthPage() {
  loadRememberedPhone();
  document.getElementById('phoneNumber')?.addEventListener('input', validatePhone);
  document.getElementById('pin')?.addEventListener('input', validatePin);
  document.getElementById('step1Form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = document.getElementById('phoneNumber')?.value?.trim();
    if (!phone || phone.length !== 10) {
      const err = document.getElementById('step1Error'); if (err) { err.classList.add('show'); err.innerHTML = '❌ Invalid phone (E002)'; }
      return;
    }
    saveRememberedPhone(phone);
    document.getElementById('step1Form').classList.add('inactive');
    document.getElementById('step2Form').classList.add('active');
    document.getElementById('pin')?.focus();
  });
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
}

// Expose init for pages
window.initAuthPage = initAuthPage;
export { initAuthPage, handleLogin, sha256Hex, validatePhone, validatePin };
