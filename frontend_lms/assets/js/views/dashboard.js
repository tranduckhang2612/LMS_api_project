import api from '../api.js';
import { renderNavbar, showError } from '../app.js';

// Initialize UI
renderNavbar();

async function loadCourses() {
    try {
        const courses = await api.getCourses();
        const grid = document.getElementById('courses-grid');
        grid.innerHTML = '';
        
        if (courses.length === 0) {
            grid.innerHTML = '<p class="text-muted">No courses available.</p>';
            return;
        }

        courses.forEach(course => {
            grid.innerHTML += `
                <div class="card">
                    <span class="badge badge-blue mb-4">${course.course_id}</span>
                    <h3>${course.course_title}</h3>
                    <p class="text-muted mb-4">Credits: ${course.credits}</p>
                    <a href="course.html?id=${course.course_id}" class="btn btn-outline" style="width: 100%;">View Details</a>
                </div>
            `;
        });
    } catch (error) {
        showError(error.message, 'error-container');
        document.getElementById('courses-grid').innerHTML = '';
    }
}

loadCourses();
