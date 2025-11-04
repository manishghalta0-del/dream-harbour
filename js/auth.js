<script>
        const SUPABASE_URL = 'https://lqrewteclbexiknvhenk.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8';

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        document.addEventListener('DOMContentLoaded', () => {
            loadRememberedPhone();
        });

        function loadRememberedPhone() {
            const remembered = localStorage.getItem('dreamHarbourRememberedPhone');
            if (remembered) {
                document.getElementById('phoneNumber').value = remembered;
                document.getElementById('rememberMe').checked = true;
                validatePhone();
            }
        }

        function saveRememberedPhone(phone) {
            if (document.getElementById('rememberMe').checked) {
                localStorage.setItem('dreamHarbourRememberedPhone', phone);
            } else {
                localStorage.removeItem('dreamHarbourRememberedPhone');
            }
        }

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

        function backStep() {
            document.getElementById('step1Form').classList.remove('inactive');
            document.getElementById('step2Form').classList.remove('active');

            document.getElementById('step1Indicator').classList.remove('completed');
            document.getElementById('step2Indicator').classList.remove('active');

            document.getElementById('step2Error').classList.remove('show');
            document.getElementById('phoneNumber').focus();
        }

        async function handleLogin(event) {
            event.preventDefault();

            const phone = document.getElementById('phoneNumber').value;
            const pin = document.getElementById('pin').value;
            const errorDiv = document.getElementById('step2Error');
            const successDiv = document.getElementById('successMessage');
            const button = event.target.querySelector('button[type="submit"]');

            errorDiv.classList.remove('show');
            successDiv.classList.remove('show');

            if (!pin) {
                errorDiv.classList.add('show');
                errorDiv.innerHTML = `❌ PIN is required (E004)<br><span class="error-code">Error Code: E004</span>`;
                return;
            }

            if (pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
                errorDiv.classList.add('show');
                errorDiv.innerHTML = `❌ PIN must be exactly 6 digits (E005)<br><span class="error-code">Error Code: E005</span>`;
                return;
            }

            button.disabled = true;
            button.classList.add('loading');
            button.textContent = 'Signing in...';

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone_number', phone)
                    .eq('pin', pin)
                    .eq('is_active', true)
                    .single();

                if (error || !data) {
                    errorDiv.classList.add('show');
                    errorDiv.innerHTML = `❌ Invalid phone or PIN (E006)<br><span class="error-code">Error Code: E006</span>`;
                    button.disabled = false;
                    button.classList.remove('loading');
                    button.textContent = 'Sign In';
                    return;
                }

                const userData = {
                    id: data.id,
                    phone: data.phone_number,
                    name: data.full_name,
                    role: data.role
                };

                localStorage.setItem('dreamHarbourUser', JSON.stringify(userData));
                localStorage.setItem('userSession', JSON.stringify(userData));

                successDiv.classList.add('show');
                successDiv.textContent = '✓ Login successful! Redirecting...';

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
                return;

            } catch (error) {
                errorDiv.classList.add('show');
                errorDiv.innerHTML = `❌ Connection error (E007)<br><span class="error-code">Error Code: E007</span>`;
            } finally {
                button.disabled = false;
                button.classList.remove('loading');
                button.textContent = 'Sign In';
            }
        }
    </script>