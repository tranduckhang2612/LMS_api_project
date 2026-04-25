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
    
    let actionButtons = '';
    if (isInstructor) {
        actionButtons = `
            <div class="flex gap-2">
                <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick='window.editSession(${JSON.stringify(session).replace(/'/g, "&#39;")})'>Edit Session</button>
                <button class="btn btn-outline text-red" style="padding: 4px 8px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deleteSession(${session.session_id})">Delete</button>
            </div>
        `;
    }

    dynamicContent.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <h2>${session.session_title || 'Untitled Session'}</h2>
            ${actionButtons}
        </div>
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
    
    let actionButtons = '';
    if (isInstructor) {
        actionButtons = `
            <div class="flex gap-2 mt-2">
                <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick='window.editAssignment(${JSON.stringify(assignment).replace(/'/g, "&#39;")})'>Edit</button>
                <button class="btn btn-outline text-red" style="padding: 4px 8px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" onclick="window.deleteAssignment(${assignment.assignment_id})">Delete</button>
            </div>
        `;
    }

    // Base layout
    let html = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h2>${assignment.assignment_title || 'Assignment'}</h2>
                ${actionButtons}
            </div>
            ${assignment.deadline ? `<span class="badge badge-blue">Due: ${new Date(assignment.deadline).toLocaleString()}</span>` : ''}
        </div>
        ${assignment.description ? `<p class="mb-4 text-muted">${assignment.description}</p>` : ''}
        ${assignment.assignment_url ? `<p class="mb-4"><a href="${getDownloadUrl(assignment.assignment_url, 'Assignment_File')}" target="_blank" class="font-bold underline text-primary">Download Attached File</a></p>` : ''}
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
                                <button type="button" class="btn btn-outline" style="border-color: var(--danger); color: var(--danger);" onclick="window.deleteSubmission(${sub.submission_id}, ${assignment.assignment_id})">Delete</button>
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
    setupInstructorForms();
}

function setupInstructorForms() {
    const btnSession = document.getElementById('btn-create-session');
    const btnAssign = document.getElementById('btn-create-assignment');
    
    const formSession = document.getElementById('form-create-session');
    const formAssign = document.getElementById('form-create-assignment');
    const formUpdateSession = document.getElementById('form-update-session');
    const formUpdateAssign = document.getElementById('form-update-assignment');
    
    if (!btnSession || !formSession) return;

    btnSession.onclick = () => {
        formSession.classList.remove('hidden');
        formAssign.classList.add('hidden');
        if(formUpdateSession) formUpdateSession.classList.add('hidden');
        if(formUpdateAssign) formUpdateAssign.classList.add('hidden');
    };
    
    document.getElementById('btn-cancel-session').onclick = () => formSession.classList.add('hidden');
    
    btnAssign.onclick = () => {
        formAssign.classList.remove('hidden');
        formSession.classList.add('hidden');
        
        const select = document.getElementById('input-assignment-session');
        select.innerHTML = '';
        if (allSessions.length === 0) {
            select.innerHTML = '<option value="">No sessions available</option>';
        } else {
            allSessions.forEach(s => {
                select.innerHTML += `<option value="${s.session_id}">${s.session_title || 'Untitled'}</option>`;
            });
        }
    };
    
    document.getElementById('btn-cancel-assignment').onclick = () => formAssign.classList.add('hidden');
    
    formSession.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const title = document.getElementById('input-session-title').value;
            const content = document.getElementById('input-session-content').value;
            await api.createSession(classId, { session_title: title, sn_content: content });
            formSession.reset();
            formSession.classList.add('hidden');
            alert('Session created successfully!');
            await loadSessions();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };
    
    formAssign.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const sessionId = document.getElementById('input-assignment-session').value;
            if(!sessionId) return alert('Please create a session first.');
            
            const title = document.getElementById('input-assignment-title').value;
            const desc = document.getElementById('input-assignment-desc').value;
            let deadline = document.getElementById('input-assignment-deadline').value;
            const fileInput = document.getElementById('input-assignment-url');
            
            if (deadline) {
                deadline = new Date(deadline).toISOString();
            } else {
                deadline = null;
            }

            const formData = new FormData();
            formData.append('assignment_title', title);
            if (desc) formData.append('description', desc);
            if (deadline) formData.append('deadline', deadline);
            if (fileInput && fileInput.files.length > 0) {
                formData.append('assignment_url', fileInput.files[0]);
            }

            await api.createAssignment(sessionId, formData);
            formAssign.reset();
            formAssign.classList.add('hidden');
            alert('Assignment created successfully!');
            await loadSessions();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    if (formUpdateSession) {
        document.getElementById('btn-cancel-update-session').onclick = () => formUpdateSession.classList.add('hidden');
        
        formUpdateSession.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const id = document.getElementById('update-session-id').value;
                const title = document.getElementById('update-session-title').value;
                const content = document.getElementById('update-session-content').value;
                await api.updateSession(id, { session_title: title, sn_content: content });
                formUpdateSession.reset();
                formUpdateSession.classList.add('hidden');
                alert('Session updated successfully!');
                await loadSessions();
                
                const updatedSession = allSessions.find(s => s.session_id == id);
                if (updatedSession) renderSessionContent(null, updatedSession);
            } catch (err) {
                alert('Error: ' + err.message);
            }
        };
    }

    if (formUpdateAssign) {
        document.getElementById('btn-cancel-update-assignment').onclick = () => formUpdateAssign.classList.add('hidden');

        formUpdateAssign.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const id = document.getElementById('update-assignment-id').value;
                const title = document.getElementById('update-assignment-title').value;
                const desc = document.getElementById('update-assignment-desc').value;
                let deadline = document.getElementById('update-assignment-deadline').value;
                const fileInput = document.getElementById('update-assignment-url');
                
                if (deadline) {
                    deadline = new Date(deadline).toISOString();
                } else {
                    deadline = null;
                }

                const formData = new FormData();
                if (title) formData.append('assignment_title', title);
                if (desc) formData.append('description', desc);
                if (deadline) formData.append('deadline', deadline);
                if (fileInput && fileInput.files.length > 0) {
                    formData.append('assignment_url', fileInput.files[0]);
                }

                await api.updateAssignment(id, formData);
                formUpdateAssign.reset();
                formUpdateAssign.classList.add('hidden');
                alert('Assignment updated successfully!');
                await loadSessions();

                const updatedAssign = allSessions.flatMap(s => s.assignments || []).find(a => a.assignment_id == id);
                if (updatedAssign) renderAssignmentContent(null, updatedAssign);
            } catch (err) {
                alert('Error: ' + err.message);
            }
        };
    }
}

// --- GLOBAL FUNCTIONS FOR INSTRUCTOR ACTIONS ---

window.editSession = function(session) {
    const formSession = document.getElementById('form-update-session');
    document.getElementById('form-create-session').classList.add('hidden');
    document.getElementById('form-create-assignment').classList.add('hidden');
    document.getElementById('form-update-assignment').classList.add('hidden');
    
    formSession.classList.remove('hidden');
    
    document.getElementById('update-session-id').value = session.session_id;
    document.getElementById('update-session-title').value = session.session_title || '';
    document.getElementById('update-session-content').value = session.sn_content || '';
    window.scrollTo(0, 0);
};

window.deleteSession = async function(sessionId) {
    if (confirm('Are you sure you want to delete this session? This will soft delete the session.')) {
        try {
            await api.deleteSession(sessionId);
            alert('Session deleted successfully.');
            await loadSessions();
            document.getElementById('dynamic-content').innerHTML = '<div class="text-center text-muted mt-8"><span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 1rem;">menu_book</span><p>Select a topic from the sidebar to view content.</p></div>';
        } catch (err) {
            alert('Error deleting session: ' + err.message);
        }
    }
};

window.editAssignment = function(assignment) {
    const formAssign = document.getElementById('form-update-assignment');
    document.getElementById('form-create-session').classList.add('hidden');
    document.getElementById('form-create-assignment').classList.add('hidden');
    document.getElementById('form-update-session').classList.add('hidden');
    
    formAssign.classList.remove('hidden');
    
    document.getElementById('update-assignment-id').value = assignment.assignment_id;
    document.getElementById('update-assignment-title').value = assignment.assignment_title || '';
    document.getElementById('update-assignment-desc').value = assignment.description || '';
    
    if (assignment.deadline) {
        // Format for datetime-local: YYYY-MM-DDThh:mm
        const d = new Date(assignment.deadline);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        document.getElementById('update-assignment-deadline').value = d.toISOString().slice(0,16);
    } else {
        document.getElementById('update-assignment-deadline').value = '';
    }
    window.scrollTo(0, 0);
};

window.deleteAssignment = async function(assignmentId) {
    if (confirm('Are you sure you want to delete this assignment? This will soft delete the assignment.')) {
        try {
            await api.deleteAssignment(assignmentId);
            alert('Assignment deleted successfully.');
            await loadSessions();
            document.getElementById('dynamic-content').innerHTML = '<div class="text-center text-muted mt-8"><span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 1rem;">menu_book</span><p>Select a topic from the sidebar to view content.</p></div>';
        } catch (err) {
            alert('Error deleting assignment: ' + err.message);
        }
    }
};

window.deleteSubmission = async function(submissionId, assignmentId) {
    if (confirm('Are you sure you want to delete this student submission? This is a soft delete.')) {
        try {
            await api.deleteSubmission(submissionId);
            // Xóa trực tiếp card của submission khỏi DOM, không cần reload toàn bộ
            const deleteBtn = document.querySelector(`button[onclick="window.deleteSubmission(${submissionId}, ${assignmentId})"]`);
            if (deleteBtn) {
                const card = deleteBtn.closest('.submission-card');
                if (card) card.remove();
            }
        } catch (err) {
            alert('Error deleting submission: ' + err.message);
        }
    }
};

init();
