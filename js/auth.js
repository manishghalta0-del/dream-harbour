// js/auth.js - Authentication Handler (Demo Mode - No Database)

console.log('✓ auth.js loaded');

let savedPhone = '';

// HANDLE PHONE FORM SUBMISSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ DOM ready - Setting up form handlers');
    
    const phoneForm = document.getElementById('phoneForm');
    const pinForm = document.getElementById('pinForm');
    
    if (phoneForm) {
        console.log('✓ Found phoneForm - attaching submit handler');
        phoneForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePhoneSubmit();
        });
    } else {
        console.error('❌ phoneForm not found!');
    }
    
    if (pinForm) {
        console.log('✓ Found pinForm - attaching submit handler');
        pinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePinSubmit();
        });
    } else {
        console.error('❌ pinForm not found!');
    }
});

// HANDLE PHONE FORM SUBMISSION
function handlePhoneSubmit() {
    const phone = document.getElementById('phoneNumber').value.trim();
    const errorDiv = document.getElementById('errorMessage');
    
    console.log('📱 Phone form submitted with:', phone);
    
    // Clear error
    errorDiv.textContent = '';
    errorDiv.style.color = 'red';
    
    // Validate
    if (!phone) {
        errorDiv.textContent = '⚠️ Enter phone number';
        return;
    }
    
    if (!/^\d{10}$/.test(phone)) {
        errorDiv.textContent = '⚠️ Enter valid 10-digit phone number';
        return;
    }
    
    // Save phone and show PIN form
    savedPhone = phone;
    console.log('✅ Phone valid, switching to PIN form');
    
    document.getElementById('phoneForm').style.display = 'none';
    document.getElementById('pinForm').style.display = 'block';
    document.getElementById('pinNumber').focus();
}

// HANDLE PIN FORM SUBMISSION (DEMO MODE - No Database Calls)
async function handlePinSubmit() {
    const pin = document.getElementById('pinNumber').value.trim();
    const errorDiv = document.getElementById('errorMessage');
    const spinner = document.getElementById('loadingSpinner');
    
    console.log('🔐 PIN form submitted');
    console.log('Phone:', savedPhone);
    console.log('PIN:', pin);
    
    // Clear error
    errorDiv.textContent = '';
    errorDiv.style.color = 'red';
    
    // Validate
    if (!pin) {
        errorDiv.textContent = '⚠️ Enter PIN';
        return;
    }
    
    if (!/^\d{4,6}$/.test(pin)) {
        errorDiv.textContent = '⚠️ Enter valid PIN (4-6 digits)';
        return;
    }
    
    // Show loading
    if (spinner) spinner.style.display = 'block';
    
    try {
        console.log('📡 Demo mode - Validating credentials (no database)...');
        
        // DEMO: Simple hardcoded validation
        const validUsers = [
            { phone: '9873329494', pin: '474200', name: 'Manish' },
            { phone: '9876543210', pin: '123456', name: 'Test User' }
        ];
        
        // Find user
        const user = validUsers.find(u => u.phone === savedPhone && u.pin === pin);
        
        if (spinner) spinner.style.display = 'none';
        
        if (!user) {
            console.error('❌ Invalid credentials');
            errorDiv.textContent = '❌ Invalid phone or PIN';
            return;
        }
        
        console.log('✅ Login successful!', user);
        
        // Save session
        localStorage.setItem('userSession', 'true');
        localStorage.setItem('userPhone', savedPhone);
        localStorage.setItem('userName', user.name);
        
        // Show success
        errorDiv.style.color = 'green';
        errorDiv.textContent = '✅ Login successful! Redirecting...';
        
        // Redirect after short delay
        setTimeout(() => {
            console.log('🔄 Redirecting to dashboard...');
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (spinner) spinner.style.display = 'none';
        errorDiv.textContent = '❌ Error: ' + error.message;
    }
}

// GO BACK TO PHONE
function backToPhone() {
    console.log('🔙 Going back to phone screen');
    
    document.getElementById('phoneForm').style.display = 'block';
    document.getElementById('pinForm').style.display = 'none';
    document.getElementById('errorMessage').textContent = '';
    document.getElementById('pinNumber').value = '';
    document.getElementById('phoneNumber').focus();
}

console.log('✓ auth.js initialized (demo mode)');