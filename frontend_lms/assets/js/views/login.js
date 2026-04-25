import api from '../api.js';
import { showError } from '../app.js';

// --- LOGIN FORM ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = 'Signing in... <span class="material-symbols-outlined">login</span>';
    
    try {
        await api.login(
            document.getElementById('username').value,
            document.getElementById('password').value
        );
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(error.message, 'login-error');
        btn.disabled = false;
        btn.innerHTML = 'Sign In <span class="material-symbols-outlined">login</span>';
    }
});

// --- TOGGLE TO FORGOT PASSWORD ---
document.getElementById('link-forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('forgot-password-form').classList.remove('hidden');
    document.getElementById('login-subtitle').innerText = 'Reset your password';
    document.getElementById('login-error').innerHTML = '';
    document.getElementById('reset-success').classList.add('hidden');
});

// --- BACK TO LOGIN ---
document.getElementById('link-back-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('forgot-password-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('login-subtitle').innerText = 'Sign in to your account';
    document.getElementById('reset-success').classList.add('hidden');
    document.getElementById('login-error').innerHTML = '';
    document.getElementById('forgot-password-form').reset();
});

// --- FORGOT PASSWORD FORM ---
document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-reset');

    const userId = document.getElementById('reset-id').value.trim();
    const email = document.getElementById('reset-email').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;

    if (newPassword !== confirmPassword) {
        showError('Mật khẩu xác nhận không khớp.', 'login-error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Resetting... <span class="material-symbols-outlined">lock_reset</span>';
    document.getElementById('login-error').innerHTML = '';

    try {
        const result = await api.forgotPassword(userId, email, newPassword);
        document.getElementById('reset-success').innerText = result.message || 'Password reset successfully! Please sign in.';
        document.getElementById('reset-success').classList.remove('hidden');
        document.getElementById('forgot-password-form').reset();

        // Auto-switch back to login after 2s
        setTimeout(() => {
            document.getElementById('forgot-password-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('login-subtitle').innerText = 'Sign in to your account';
        }, 2000);

    } catch (error) {
        showError(error.message, 'login-error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Reset Password <span class="material-symbols-outlined">lock_reset</span>';
    }
});

