// Main App Logic (UI Rendering Helpers)

export function renderNavbar() {
    const navHTML = `
        <header class="navbar">
            <div class="nav-brand">
                <span class="material-symbols-outlined">school</span>
                EduManager
            </div>
            <div class="nav-links">
                <a href="dashboard.html" class="nav-link">Dashboard</a>
                <a href="#" id="logout-btn" class="nav-link">Logout</a>
            </div>
        </header>
    `;
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = 'index.html';
    });
}

// URL param helper
export function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Display error alert
export function showError(message, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="alert alert-error">${message}</div>`;
    } else {
        alert(message);
    }
}
