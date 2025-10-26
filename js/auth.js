// js/auth.js
// This handles the login process

let currentPhone = '';

// When user enters phone number and clicks Continue
document.getElementById('phoneForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phoneInput = document.getElementById('phoneNumber');
    const phone = phoneInput.value.trim();
    
    // Check if phone number is correct format (10 digits)
    if (!/^\d{10}$/.test(phone)) {
        showError('Please enter a valid 10-digit phone number');
        return;
    }
    
    currentPhone = phone;
    
    // Hide phone form, show PIN form
    document.getElementById('phoneForm').style.display = 'none';
    document.getElementById('pinForm').style.display = 'block';
    document.getElementById('pinNumber').focus();
});

// When user enters PIN and clicks Login
document.getElementById('pinForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pinInput = document.getElementById('pinNumber');
    const pin = pinInput.value.trim();
    
    // Check if PIN is correct format (6 digits)
    if (!/^\d{6}$/.test(pin)) {
        showError('Please enter a valid 6-digit PIN');
        return;
    }
    
    // Verify login with database
    await verifyLogin(currentPhone, pin);
});

// Function to verify login credentials with Supabase
async function verifyLogin(phone, pin) {
    showLoading(true);
    showError('');
    
    try {
        // Search for matching phone and PIN in app_users table
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('phone_number', phone)
            .eq('pin', pin)
            .eq('is_active', true)
            .single();  // Only expect one result
        
        if (error || !data) {
            showError('Invalid phone number or PIN');
            showLoading(false);
            return;
        }
        
        // Login successful! Save user info to browser
        const userData = {
            id: data.id,
            phone: data.phone_number,
            name: data.full_name,
            role: data.role,
            permissions: data.permissions,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('dreamharbour_user', JSON.stringify(userData));
        
        // Go to dashboard page
        window.location.href = 'dashboard.html';
        
    } catch (err) {
        console.error('Login error:', err);
        showError('An error occurred. Please try again.');
        showLoading(false);
    }
}

// Function to go back to phone form
function backToPhone() {
    document.getElementById('pinForm').style.display = 'none';
    document.getElementById('phoneForm').style.display = 'block';
    document.getElementById('phoneNumber').value = currentPhone;
    document.getElementById('pinNumber').value = '';
    showError('');
}

// Function to show error messages
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        errorDiv.style.display = 'none';
    }
}

// Function to show loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

// Check if already logged in when page loads
window.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('dreamharbour_user');
    if (user && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
});
