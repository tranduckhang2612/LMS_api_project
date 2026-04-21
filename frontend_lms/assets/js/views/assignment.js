import api from '../api.js';
import { renderNavbar, getQueryParam, showError } from '../app.js';

renderNavbar();

const assignmentId = getQueryParam('id');
if (!assignmentId) window.location.href = 'dashboard.html';

// Load Assignment Details
async function loadAssignment() {
    try {
        // Assuming we have an endpoint, or we just rely on submissions
        const assignment = await api.getAssignmentDetails(assignmentId).catch(() => ({ title: "Assignment Details", description: "Loading specifics...", due_date: null }));
        
        document.getElementById('assignment-details').innerHTML = `
            <div class="flex justify-between items-start">
                <h2>${assignment.title || 'Assignment Details'}</h2>
                ${assignment.due_date ? `<span class="badge badge-blue">Due: ${new Date(assignment.due_date).toLocaleString()}</span>` : ''}
            </div>
            <p class="mt-2">${assignment.description || ''}</p>
        `;
    } catch (error) {
        // ignore
    }
}

// Detect Role (Simulated via token presence, ideally use real role claim)
const storedToken = localStorage.getItem('access_token');
let isInstructor = false; 
// A hack for the current test setup: Try to fetch submissions. If it succeeds, they are likely an instructor or owner.
// If it returns 403, they are a student.

async function loadSubmissions() {
    try {
        const submissions = await api.getSubmissions(assignmentId);
        isInstructor = true; // Assume instructor if they can fetch all submissions
        document.getElementById('instructor-section').classList.remove('hidden');
        
        const list = document.getElementById('submissions-list');
        list.innerHTML = '';
        
        if (submissions.length === 0) {
            list.innerHTML = '<p class="text-muted">No submissions yet.</p>';
            return;
        }

        submissions.forEach(sub => {
            list.innerHTML += `
                <div class="card submission-card">
                    <div class="flex justify-between items-center mb-2">
                        <h4>Student ID: ${sub.student || sub.student_id || 'Unknown'}</h4>
                        <span class="badge ${sub.score !== null ? 'badge-green' : 'badge-blue'}">Score: ${sub.score !== null ? sub.score : 'Not Graded'}</span>
                    </div>
                    <p class="text-muted mb-4">Content: ${sub.content || sub.file_url || 'Submitted'}</p>
                    
                    <form class="grade-form flex gap-2 items-center" data-id="${sub.submission_id}">
                        <input type="number" class="form-input" style="width: 100px" min="0" max="10" placeholder="0-10" required>
                        <button type="submit" class="btn btn-outline">Grade</button>
                    </form>
                </div>
            `;
        });

        // Attach grading handlers
        document.querySelectorAll('.grade-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const score = e.target.querySelector('input').value;
                const subId = e.target.getAttribute('data-id');
                try {
                    await api.gradeSubmission(subId, score);
                    alert('Graded successfully!');
                    loadSubmissions(); // Reload
                } catch (err) {
                    alert('Error grading: ' + err.message);
                }
            });
        });

    } catch (error) {
        // If they can't fetch submissions, they are a student
        document.getElementById('student-section').classList.remove('hidden');
    }
}

// Handle Student Submission
document.getElementById('submission-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    
    try {
        // The backend API might expect a file or text content. Sending a basic payload.
        // Depending on the exact API implementation, this might need adjustments.
        const response = await fetch(`http://127.0.0.1:8000/api/assignments/${assignmentId}/submissions/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                content: document.getElementById('submission-content').value,
                // file_url: "...", etc
            })
        });
        
        if(!response.ok) throw new Error("Failed to submit");
        
        alert("Assignment submitted successfully!");
        e.target.reset();
    } catch (error) {
        alert('Error submitting: ' + error.message);
    } finally {
        btn.disabled = false;
    }
});

loadAssignment();
loadSubmissions();
