import api from '../api.js';
import { showError } from '../app.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = 'Signing in...';
    
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
