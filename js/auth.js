// ============================================================================
// js/auth.js - LOGIN PAGE FUNCTIONS (CORRECTED)
// ============================================================================
// This file handles ONLY login page functions
// Supabase initialization is in js/config.js (imported separately)
// 
// What Changed:
// ❌ REMOVED: Hardcoded Supabase URL & KEY (security risk)
// ❌ REMOVED: Direct supabase.createClient() (duplicate initialization)
// ✅ ADDED: Use getSupabase() from config.js instead
// ✅ KEPT: All 7 login functions (validatePhone, validatePin, nextStep, etc)

// ============================================================================
// Function 1: Load Remembered Phone on Page Load
// ============================================================================
function loadRememberedPhone() {
    const remembered = localStorage.getItem('dreamHarbourRememberedPhone');
    if (remembered) {
        document.getElementById('phoneNumber').value = remembered;
        document.getElementById('rememberMe').checked = true;
        validatePhone();
    }
}

// ============================================================================
// Function 2: Save Phone Number (if "Remember Me" is checked)
// ============================================================================
function saveRememberedPhone(phone) {
    if (document.getElementById('rememberMe').checked) {
        localStorage.setItem('dreamHarbourRememberedPhone', phone);
    } else {
        localStorage.removeItem('dreamHarbourRememberedPhone');
    }
}

// ============================================================================
// Function 3: Validate Phone Number in Real-Time
// ============================================================================
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

// ============================================================================
// Function 4: Validate PIN in Real-Time
// ============================================================================
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

// ============================================================================
// Function 5: Move to PIN Input Step
// ============================================================================
function nextStep(event) {
    event.preventDefault();

    const phone = document.getElementById('phoneNumber').value;
    const errorDiv = document.getElementById('step1Error');

    errorDiv.classList.remove('show');

    if (!phone) {
        errorDiv.classList.add('show');
        errorDiv.innerHTML = `❌ Phone number is required (E001)<br><span class="error-code">Error Code: E001</span>`;
        return;
    }

    if (phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
        errorDiv.classList.add('show');
        errorDiv.innerHTML = `❌ Invalid phone number format (E002)<br><span class="error-code">Error Code: E002</span>`;
        return;
    }

    saveRememberedPhone(phone);

    document.getElementById('step1Form').classList.add('inactive');
    document.getElementById('step2Form').classList.add('active');

    document.getElementById('step1Indicator').classList.add('completed');
    document.getElementById('step2Indicator').classList.add('active');

    document.getElementById('pin').focus();
}

// ============================================================================
// Function 6: Go Back to Phone Input Step
// ============================================================================
function backStep() {
    document.getElementById('step1Form').classList.remove('inactive');
    document.getElementById('step2Form').classList.remove('active');

    document.getElementById('step1Indicator').classList.remove('completed');
    document.getElementById('step2Indicator').classList.remove('active');

    document.getElementById('step2Error').classList.remove('show');
    document.getElementById('phoneNumber').focus();
}

// ============================================================================
// Function 7: Handle Login - Query Supabase and Authenticate
// ============================================================================
async function handleLogin(event) {
    event.preventDefault();

    const phone = document.getElementById('phoneNumber').value;
    const pin = document.getElementById('pin').value;
    const errorDiv = document.getElementById('step2Error');
    const successDiv = document.getElementById('successMessage');
    const button = event.target.querySelector('button[type="submit"]');

    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');

    // ===== VALIDATION: Check PIN is provided =====
    if (!pin) {
        errorDiv.classList.add('show');
        errorDiv.innerHTML = `❌ PIN is required (E004)<br><span class="error-code">Error Code: E004</span>`;
        return;
    }

    // ===== VALIDATION: Check PIN is exactly 6 digits =====
    if (pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
        errorDiv.classList.add('show');
        errorDiv.innerHTML = `❌ PIN must be exactly 6 digits (E005)<br><span class="error-code">Error Code: E005</span>`;
        return;
    }

    // ===== LOADING STATE =====
    button.disabled = true;
    button.classList.add('loading');
    button.textContent = 'Signing in...';

    try {
        // ===== FIXED: Use getSupabase() from config.js instead of hardcoded URL/KEY =====
        const supabase = getSupabase();

        // ===== QUERY SUPABASE: Check if user exists with matching credentials =====
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', phone)
            .eq('pin', pin)
            .eq('is_active', true)
            .single();

        // ===== ERROR CHECK: Invalid credentials =====
        if (error || !data) {
            errorDiv.classList.add('show');
            errorDiv.innerHTML = `❌ Invalid phone or PIN (E006)<br><span class="error-code">Error Code: E006</span>`;
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = 'Sign In';
            return;
        }

        // ===== SUCCESS: Prepare user data =====
        const userData = {
            id: data.id,
            phone: data.phone_number,
            name: data.full_name,
            role: data.role
        };

        // ===== SAVE: Store user data in localStorage =====
        localStorage.setItem('dreamHarbourUser', JSON.stringify(userData));
        localStorage.setItem('userSession', JSON.stringify(userData));

        // ===== SUCCESS MESSAGE =====
        successDiv.classList.add('show');
        successDiv.textContent = '✓ Login successful! Redirecting...';

        // ===== REDIRECT: Go to dashboard after 1.5 seconds =====
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        return;

    } catch (error) {
        // ===== CONNECTION ERROR =====
        errorDiv.classList.add('show');
        errorDiv.innerHTML = `❌ Connection error (E007)<br><span class="error-code">Error Code: E007</span>`;
    } finally {
        // ===== RESET BUTTON STATE =====
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = 'Sign In';
    }
}

// ============================================================================
// INITIALIZATION: Load remembered phone on page load
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadRememberedPhone();
});