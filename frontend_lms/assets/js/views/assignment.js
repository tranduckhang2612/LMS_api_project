import api from '../api.js';
import { renderNavbar, getQueryParam, showError } from '../app.js';

renderNavbar();

const assignmentId = getQueryParam('id');
if (!assignmentId || assignmentId === 'undefined') {
    alert("Invalid Assignment ID. Please access this page through the Session view.");
    window.location.href = 'dashboard.html';
}

// Load Assignment Details
async function loadAssignment() {
    try {
        let assignment;
        try {
            assignment = await api.getInstructorAssignmentDetails(assignmentId);
        } catch (err) {
            assignment = await api.getStudentAssignmentDetails(assignmentId);
        }
        
        const title = assignment.assignment_title || assignment.title || 'Assignment Details';
        const due = assignment.deadline || assignment.due_date;
        const desc = assignment.description || '';

        document.getElementById('assignment-details').innerHTML = `
            <div class="flex justify-between items-start">
                <h2>${title}</h2>
                ${due ? `<span class="badge badge-blue">Due: ${new Date(due).toLocaleString()}</span>` : ''}
            </div>
            ${desc ? `<p class="mt-2">${desc}</p>` : ''}
            ${assignment.assignment_url ? `<p class="mt-3"><a href="${getDownloadUrl(assignment.assignment_url)}" target="_blank" class="font-bold underline text-primary">&#128196; Download Attached File</a></p>` : ''}
        `;
    } catch (error) {
        // ignore
    }
}

// Detect Role
let isInstructor = false; 

// Helper: Thêm fl_attachment vào URL Cloudinary để force download
// (Đã test: fl_attachment không tên hoạt động ổn định với raw files)
function getDownloadUrl(url) {
    if (!url || !url.includes('/upload/')) return url;
    return url.replace('/upload/', '/upload/fl_attachment/');
}

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
            const statusColor = sub.overdue_status && sub.overdue_status.includes('muộn') ? 'text-red' : 'text-green';
            const fileName = sub.file_name || 'Submitted_File';
            const rawUrl = sub.submission_url_full || sub.submission_url || sub.content;
            const downloadUrl = getDownloadUrl(rawUrl, fileName);
            
            list.innerHTML += `
                <div class="card submission-card">
                    <div class="flex justify-between items-center mb-2">
                        <h4>Student ID: ${sub.student || sub.student_id || sub.student_ref || 'Unknown'}</h4>
                        <span class="badge ${sub.score !== null ? 'badge-green' : 'badge-blue'}">Score: ${sub.score !== null ? sub.score : 'Not Graded'}</span>
                    </div>
                    <p class="text-muted mb-2">Content: <a href="${downloadUrl}" target="_blank" class="underline font-bold text-primary">Download: ${fileName}</a></p>
                    <p class="${statusColor} font-bold mb-4">${sub.overdue_status || ''}</p>
                    
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
        // If they can't fetch all submissions, they are a student
        document.getElementById('student-section').classList.remove('hidden');
        try {
            // Show their current submission if they have one
            const mySubmissions = await api.getStudentSubmissions(assignmentId);
            if(mySubmissions && mySubmissions.length > 0) {
                const mySub = mySubmissions[0];
                const infoDiv = document.getElementById('current-submission-info');
                const fileName = mySub.file_name || 'Your_File';
                const downloadUrl = getDownloadUrl(mySub.submission_url, fileName);
                let infoHtml = `<p class="text-blue">You have already submitted: <a href="${downloadUrl}" target="_blank" class="underline font-bold">Download ${fileName}</a></p>`;
                
                if (mySub.overdue_status) {
                    const statusColor = mySub.overdue_status.includes('muộn') ? 'text-red font-bold' : 'text-green font-bold';
                    infoHtml += `<p class="${statusColor} mt-2">${mySub.overdue_status}</p>`;
                }
                
                if(mySub.score !== null) {
                    infoHtml += `<p class="text-green mt-2 font-bold">Graded Score: ${mySub.score}</p>`;
                }
                infoDiv.innerHTML = infoHtml;
                
                // Make the file input optional since they already submitted
                document.getElementById('submission-file').removeAttribute('required');
            }
        } catch(e) {}
    }
}

// Handle Student Submission
document.getElementById('submission-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    
    try {
        const fileInput = document.getElementById('submission-file');
        const formData = new FormData();
        
        if (fileInput.files.length > 0) {
            formData.append('submission_url', fileInput.files[0]);
        }
        
        await api.submitAssignment(assignmentId, formData);
        
        alert("Assignment submitted successfully!");
        loadSubmissions(); // Reload to show the link
    } catch (error) {
        alert('Error submitting: ' + error.message);
    } finally {
        btn.disabled = false;
        document.getElementById('submission-form').reset();
    }
});

loadAssignment();
loadSubmissions();
