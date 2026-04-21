import api from '../api.js';
import { renderNavbar, getQueryParam, showError } from '../app.js';

renderNavbar();

const classId = getQueryParam('id');
if (!classId) window.location.href = 'dashboard.html';

document.getElementById('class-title').textContent = `Class: ${classId}`;

// Basic check if user might be instructor (based on username format in test env)
// In a real app, the API should return user roles in the login token
const storedToken = localStorage.getItem('access_token');
if (storedToken) {
    try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        // Temporary mock role check logic for UI, backend enforces real security
        if (payload.user_id) { // This is weak, but we just show the button and let API block if unauthorized
            document.getElementById('btn-create-session').classList.remove('hidden');
        }
    } catch(e) {}
}

async function loadSessions() {
    try {
        const sessions = await api.getClassSessions(classId);
        const list = document.getElementById('sessions-list');
        list.innerHTML = '';
        
        if (sessions.length === 0) {
            list.innerHTML = '<p class="text-muted">No sessions scheduled yet.</p>';
            return;
        }

        sessions.forEach(session => {
            list.innerHTML += `
                <div class="card flex justify-between items-center">
                    <div>
                        <h3>Session ${session.session_no}: ${session.topic}</h3>
                        <p class="text-muted">Date: ${session.date || 'TBD'} | Time: ${session.start_time || 'TBD'}</p>
                    </div>
                    <a href="session.html?id=${session.session_id}" class="btn btn-outline">Assignments</a>
                </div>
            `;
        });
    } catch (error) {
        showError(error.message, 'error-container');
        document.getElementById('sessions-list').innerHTML = '';
    }
}

// Form toggle logic
const formDiv = document.getElementById('create-session-form');
document.getElementById('btn-create-session').addEventListener('click', () => formDiv.classList.remove('hidden'));
document.getElementById('btn-cancel-session').addEventListener('click', () => formDiv.classList.add('hidden'));

// Handle create session
document.getElementById('session-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await api.createSession(classId, {
            session_no: document.getElementById('session-no').value,
            topic: document.getElementById('session-topic').value
        });
        formDiv.classList.add('hidden');
        e.target.reset();
        loadSessions(); // Reload
    } catch (error) {
        alert('Error creating session: ' + error.message);
    }
});

loadSessions();
