import api from '../api.js';
import { renderNavbar, getQueryParam, showError } from '../app.js';

renderNavbar();

const courseId = getQueryParam('id');
if (!courseId) window.location.href = 'dashboard.html';

async function loadCourseData() {
    try {
        const [course, classes] = await Promise.all([
            api.getCourseDetails(courseId),
            api.getCourseClasses(courseId)
        ]);

        document.getElementById('course-header').innerHTML = `
            <h1>${course.course_title}</h1>
            <p class="text-muted">Course Code: ${course.course_id} • Credits: ${course.credits}</p>
        `;

        const grid = document.getElementById('classes-grid');
        grid.innerHTML = '';
        
        if (classes.length === 0) {
            grid.innerHTML = '<p class="text-muted">No classes found for this course.</p>';
            return;
        }

        classes.forEach(cls => {
            grid.innerHTML += `
                <div class="card">
                    <div class="flex justify-between items-center mb-4">
                        <h3>${cls.class_id}</h3>
                        <span class="badge badge-green">${cls.semester}</span>
                    </div>
                    <p class="text-muted mb-4">Instructor: ${cls.instructor_name}</p>
                    <a href="class.html?id=${cls.class_id}" class="btn btn-outline" style="width: 100%;">View Sessions</a>
                </div>
            `;
        });
    } catch (error) {
        showError(error.message, 'error-container');
        document.getElementById('classes-grid').innerHTML = '';
    }
}

loadCourseData();
