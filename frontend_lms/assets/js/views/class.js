import api from '../api.js';
import { renderNavbar, getQueryParam, showError } from '../app.js';

renderNavbar();

const classId = getQueryParam('id');
if (!classId) {
    window.location.href = 'dashboard.html';
}

let isInstructor = false;
let classData = null;
let allSessions = [];

// Helper to format Cloudinary URL
function getDownloadUrl(url, filename) {
    if (!url || !url.includes('/upload/')) return url;
    const safeName = encodeURIComponent(filename || 'download');
    return url.replace('/upload/', `/upload/fl_attachment:${safeName}/`);
}

async function loadClassDetails() {
    try {
        const classes = await api.getStudentClasses().catch(() => []);
        classData = classes.find(c => c.class_id.toLowerCase() === classId.toLowerCase());
        
        document.getElementById('class-title').innerText = `Class ${classId}`;
        document.getElementById('sidebar-class-name').innerText = `Class ${classId}`;
    } catch(e) {
        document.getElementById('class-title').innerText = `Class ${classId}`;
        document.getElementById('sidebar-class-name').innerText = `Class ${classId}`;
    }
}

async function loadSessions() {
    const sidebarMenu = document.getElementById('sidebar-menu');
    sidebarMenu.innerHTML = '<li class="p-4 text-muted">Loading...</li>';
    
    try {
        try {
            allSessions = await api.getInstructorClassSessions(classId);
            isInstructor = true;
            document.getElementById('btn-create-session').classList.remove('hidden');
            document.getElementById('btn-create-assignment').classList.remove('hidden');
            
            // For instructor, fetch assignments for each session
            for(let s of allSessions) {
                s.assignments = await api.getInstructorSessionAssignments(s.session_id).catch(()=>[]);
            }
        } catch (err) {
            allSessions = await api.getStudentClassSessions(classId);
            isInstructor = false;
        }

        renderSidebar();

    } catch (error) {
        showError(error.message, 'error-container');
        sidebarMenu.innerHTML = '<li class="p-4 text-red">Failed to load content</li>';
    }
}

function renderSidebar() {
    const sidebarMenu = document.getElementById('sidebar-menu');
    sidebarMenu.innerHTML = '';
    
    if (allSessions.length === 0) {
        sidebarMenu.innerHTML = '<li class="p-4 text-muted">No content available.</li>';
        return;
    }
    
    allSessions.forEach(session => {
        const li = document.createElement('li');
        
        // Session Header
        const sessionTitle = document.createElement('a');
        sessionTitle.className = 'sidebar-menu-item';
        sessionTitle.innerText = session.session_title || 'Untitled Session';
        sessionTitle.onclick = (e) => renderSessionContent(e, session);
        li.appendChild(sessionTitle);
        
        // Assignments sub-menu
        if (session.assignments && session.assignments.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'sidebar-submenu';
            session.assignments.forEach(assign => {
                const subLi = document.createElement('li');
                const assignLink = document.createElement('a');
                assignLink.className = 'sidebar-submenu-item';
                assignLink.innerText = assign.assignment_title || 'Assignment';
                assignLink.onclick = (e) => renderAssignmentContent(e, assign);
                subLi.appendChild(assignLink);
                ul.appendChild(subLi);
            });
            li.appendChild(ul);
        }
        
        sidebarMenu.appendChild(li);
    });
}

function renderSessionContent(event, session) {
    // highlight sidebar
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');

    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = `
        <h2>${session.session_title || 'Untitled Session'}</h2>
        <p class="text-muted text-sm mb-4">Created: ${new Date(session.created_at).toLocaleDateString()}</p>
        <div class="card p-4 mt-4" style="background: var(--primary-light);">
            <h4 class="mb-2">Session Content:</h4>
            <p>${session.sn_content || 'No specific content available for this session.'}</p>
        </div>
    `;
}

async function renderAssignmentContent(event, assignment) {
    // highlight sidebar
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');

    const dynamicContent = document.getElementById('dynamic-content');
    
    // Base layout
    let html = `
        <div class="flex justify-between items-start mb-4">
            <h2>${assignment.assignment_title || 'Assignment'}</h2>
            ${assignment.deadline ? `<span class="badge badge-blue">Due: ${new Date(assignment.deadline).toLocaleString()}</span>` : ''}
        </div>
        ${assignment.description ? `<p class="mb-4 text-muted">${assignment.description}</p>` : ''}
        <div class="card p-4 mb-4" style="background: #fdfbf7; border: 1px solid #e0dcd3;">
            <p><strong>Assignment Details:</strong> Please submit your work before the deadline.</p>
        </div>
    `;

    dynamicContent.innerHTML = html + `<p>Loading submission info...</p>`;

    try {
        if (isInstructor) {
            const submissions = await api.getSubmissions(assignment.assignment_id);
            let subHtml = `<h3 class="mt-6 mb-4 border-t pt-4">Student Submissions</h3>`;
            if(submissions.length === 0) {
                subHtml += `<p class="text-muted">No submissions yet.</p>`;
            } else {
                subHtml += `<div class="grid grid-cols-1">`;
                submissions.forEach(sub => {
                    const statusColor = sub.overdue_status && sub.overdue_status.includes('muộn') ? 'text-red' : 'text-green';
                    const fileName = sub.file_name || 'Submitted_File';
                    const rawUrl = sub.submission_url_full || sub.submission_url || sub.content;
                    const downloadUrl = getDownloadUrl(rawUrl, fileName);
                    
                    subHtml += `
                        <div class="card submission-card mb-2">
                            <div class="flex justify-between items-center mb-2">
                                <h4>Student: ${sub.student || sub.student_ref || 'Unknown'}</h4>
                                <span class="badge ${sub.score !== null ? 'badge-green' : 'badge-blue'}">Score: ${sub.score !== null ? sub.score : 'Not Graded'}</span>
                            </div>
                            <p class="text-muted mb-2"><a href="${downloadUrl}" target="_blank" class="underline font-bold text-primary">Download: ${fileName}</a></p>
                            <p class="${statusColor} font-bold mb-4">${sub.overdue_status || ''}</p>
                            
                            <form class="grade-form flex gap-2 items-center" data-id="${sub.submission_id}">
                                <input type="number" class="form-input" style="width: 100px" min="0" max="10" placeholder="0-10" required>
                                <button type="submit" class="btn btn-outline">Grade</button>
                            </form>
                        </div>
                    `;
                });
                subHtml += `</div>`;
            }
            dynamicContent.innerHTML = html + subHtml;
            
            // Attach grade handlers
            document.querySelectorAll('.grade-form').forEach(form => {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const score = e.target.querySelector('input').value;
                    const subId = e.target.getAttribute('data-id');
                    try {
                        await api.gradeSubmission(subId, score);
                        alert('Graded successfully!');
                        renderAssignmentContent(null, assignment); // Reload
                    } catch (err) {
                        alert('Error grading: ' + err.message);
                    }
                });
            });

        } else {
            const mySubmissions = await api.getStudentSubmissions(assignment.assignment_id);
            let subHtml = `<h3 class="mt-6 mb-4 border-t pt-4">Your Submission</h3>`;
            
            let hasSubmitted = false;
            if(mySubmissions && mySubmissions.length > 0) {
                hasSubmitted = true;
                const mySub = mySubmissions[0];
                const fileName = mySub.file_name || 'Your_File';
                const downloadUrl = getDownloadUrl(mySub.submission_url, fileName);
                subHtml += `<div class="card p-4 mb-4" style="border-left: 4px solid var(--success);">
                    <p class="text-blue"><a href="${downloadUrl}" target="_blank" class="underline font-bold">Download: ${fileName}</a></p>`;
                
                if (mySub.overdue_status) {
                    const statusColor = mySub.overdue_status.includes('muộn') ? 'text-red font-bold' : 'text-green font-bold';
                    subHtml += `<p class="${statusColor} mt-2">${mySub.overdue_status}</p>`;
                }
                if(mySub.score !== null) {
                    subHtml += `<p class="text-green mt-2 font-bold">Graded Score: ${mySub.score}</p>`;
                }
                subHtml += `</div>`;
            }

            subHtml += `
                <form id="submission-form" class="card mt-4 p-4">
                    <h4 class="mb-4">${hasSubmitted ? 'Update Submission' : 'Submit Assignment'}</h4>
                    <div class="form-group">
                        <label class="form-label">Upload File</label>
                        <input type="file" id="submission-file" class="form-input" ${hasSubmitted ? '' : 'required'} accept=".pdf,.doc,.docx,.zip,.rar,image/*">
                    </div>
                    <button type="submit" class="btn btn-primary" id="btn-submit">Submit</button>
                </form>
            `;
            
            dynamicContent.innerHTML = html + subHtml;

            // Attach student submit handler
            document.getElementById('submission-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('btn-submit');
                btn.disabled = true;
                btn.innerText = 'Uploading...';
                try {
                    const fileInput = document.getElementById('submission-file');
                    const formData = new FormData();
                    if (fileInput.files.length > 0) {
                        formData.append('submission_url', fileInput.files[0]);
                    }
                    await api.submitAssignment(assignment.assignment_id, formData);
                    alert('Submitted successfully!');
                    renderAssignmentContent(null, assignment); // Reload
                } catch (err) {
                    alert('Error submitting: ' + err.message);
                    btn.disabled = false;
                    btn.innerText = 'Submit';
                }
            });
        }
    } catch(e) {
        dynamicContent.innerHTML = html + `<p class="text-red">Error loading submission info: ${e.message}</p>`;
    }
}

async function init() {
    await loadClassDetails();
    await loadSessions();
}

init();
