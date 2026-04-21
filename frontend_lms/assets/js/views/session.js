import api from '../api.js';
import { renderNavbar, getQueryParam, showError } from '../app.js';

renderNavbar();

const sessionId = getQueryParam('id');
if (!sessionId) window.location.href = 'dashboard.html';

document.getElementById('session-title').textContent = `Session Tasks`;

const storedToken = localStorage.getItem('access_token');
if (storedToken) {
    try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.user_id) { 
            document.getElementById('btn-create-assignment').classList.remove('hidden');
        }
    } catch(e) {}
}

async function loadAssignments() {
    try {
        const assignments = await api.getSessionAssignments(sessionId);
        const list = document.getElementById('assignments-list');
        list.innerHTML = '';
        
        if (assignments.length === 0) {
            list.innerHTML = '<p class="text-muted">No assignments for this session.</p>';
            return;
        }

        assignments.forEach(assignment => {
            list.innerHTML += `
                <div class="card">
                    <div class="flex justify-between items-start mb-2">
                        <h3>${assignment.title}</h3>
                        <span class="badge badge-blue">Due: ${new Date(assignment.due_date).toLocaleString()}</span>
                    </div>
                    <p class="text-muted mb-4">${assignment.description}</p>
                    <a href="assignment.html?id=${assignment.assignment_id}" class="btn btn-primary">View & Submit</a>
                </div>
            `;
        });
    } catch (error) {
        showError(error.message, 'error-container');
        document.getElementById('assignments-list').innerHTML = '';
    }
}

// Form toggle logic
const formDiv = document.getElementById('create-assignment-form');
document.getElementById('btn-create-assignment').addEventListener('click', () => formDiv.classList.remove('hidden'));
document.getElementById('btn-cancel-assignment').addEventListener('click', () => formDiv.classList.add('hidden'));

// Handle create
document.getElementById('assignment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await api.createAssignment(sessionId, {
            title: document.getElementById('assignment-title').value,
            description: document.getElementById('assignment-desc').value,
            due_date: document.getElementById('assignment-due').value
        });
        formDiv.classList.add('hidden');
        e.target.reset();
        loadAssignments(); 
    } catch (error) {
        alert('Error creating assignment: ' + error.message);
    }
});

loadAssignments();
