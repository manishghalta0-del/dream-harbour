import { supabase, showToast } from './common.js';

const form = document.getElementById('login-form');
if (form) {
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Signed in', 'success');
      // redirect
      window.location.href = '/dashboard.html';
    } catch (err) {
      console.error('signIn', err);
      showToast(err.message || 'Sign in failed', 'error');
    }
  });
}
