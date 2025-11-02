document.addEventListener('DOMContentLoaded', function() {
    document.body.id = 'loginPage';
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    const pinInput = document.getElementById('pin');
    if (pinInput) {
        pinInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
});

async function handleLogin() {
    const phoneInput = document.getElementById('phone');
    const pinInput = document.getElementById('pin');
    const phone = phoneInput.value.trim();
    const pin = pinInput.value.trim();
    
    if (!phone || !pin) {
        alert('Please enter phone number and PIN');
        return;
    }
    
    if (!validatePhoneNumber(phone)) {
        alert('Please enter a valid 10-digit phone number');
        phoneInput.focus();
        return;
    }
    
    if (!validatePIN(pin)) {
        alert('Please enter a valid 4-digit PIN');
        pinInput.focus();
        return;
    }
    
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', phone)
            .eq('pin', pin)
            .single();
        
        if (error || !data) {
            alert('Invalid phone number or PIN');
            return;
        }
        
        if (!data.is_active) {
            alert('This account is inactive. Please contact support.');
            return;
        }
        
        const userData = {
            id: data.id,
            name: data.full_name,
            phone: data.phone_number,
            role: data.role,
            email: data.email
        };
        
        storeSession(userData);
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    } finally {
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}