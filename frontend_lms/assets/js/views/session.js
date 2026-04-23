import api from '../api.js';
import { renderNavbar, getQueryParam, showError } from '../app.js';

renderNavbar();

const sessionId = getQueryParam('id');
if (!sessionId) window.location.href = 'dashboard.html';

document.getElementById('session-title').textContent = `Session Tasks`;

// Remove old token check logic since we check by API now

async function loadAssignments() {
    try {
        let assignments;
        try {
            assignments = await api.getInstructorSessionAssignments(sessionId);
            document.getElementById('btn-create-assignment').classList.remove('hidden');
        } catch (err) {
            assignments = await api.getStudentSessionAssignments(sessionId);
        }
        
        const list = document.getElementById('assignments-list');
        list.innerHTML = '';
        
        if (assignments.length === 0) {
            list.innerHTML = '<p class="text-muted">No assignments for this session.</p>';
            return;
        }

        assignments.forEach(assignment => {
            const title = assignment.assignment_title || assignment.title || 'Untitled';
            const due = assignment.deadline || assignment.due_date;
            const desc = assignment.description || '';
            
            list.innerHTML += `
                <div class="card">
                    <div class="flex justify-between items-start mb-2">
                        <h3>${title}</h3>
                        <span class="badge badge-blue">Due: ${due ? new Date(due).toLocaleString() : 'No deadline'}</span>
                    </div>
                    ${desc ? `<p class="text-muted mb-4">${desc}</p>` : ''}
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
            assignment_title: document.getElementById('assignment-title').value,
            description: document.getElementById('assignment-desc').value,
            deadline: document.getElementById('assignment-due').value
        });
        formDiv.classList.add('hidden');
        e.target.reset();
        loadAssignments(); 
    } catch (error) {
        alert('Error creating assignment: ' + error.message);
    }
});

loadAssignments();
