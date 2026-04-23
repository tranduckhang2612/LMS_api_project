import api from '../api.js';
import { renderNavbar, showError } from '../app.js';

// Initialize UI
renderNavbar();

async function loadDashboard() {
    try {
        // Try instructor load first
        const courses = await api.getCourses();
        renderCourses(courses);
    } catch (error) {
        // If 403, assume student and load classes
        if (error.message.includes('permission') || error.message.includes('detail') || error.message.includes('credentials') || error.message.includes('API Request Failed') || error.message.includes('Session expired') || error.message.includes('found')) {
            try {
                const classes = await api.getStudentClasses();
                renderClasses(classes);
            } catch (err) {
                showError(err.message, 'error-container');
                document.getElementById('courses-grid').innerHTML = '';
            }
        } else {
            showError(error.message, 'error-container');
            document.getElementById('courses-grid').innerHTML = '';
        }
    }
}

function renderCourses(courses) {
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
}

function renderClasses(classes) {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = '';
    const heading = document.querySelector('h1');
    if (heading) heading.textContent = 'My Classes';
    
    const subtitle = document.querySelector('.text-muted');
    if (subtitle) subtitle.textContent = 'Manage your enrolled classes.';
    
    if (classes.length === 0) {
        grid.innerHTML = '<p class="text-muted">You are not enrolled in any classes.</p>';
        return;
    }

    classes.forEach(cls => {
        grid.innerHTML += `
            <div class="card">
                <span class="badge badge-green mb-4">${cls.semester}</span>
                <h3>${cls.course_title || cls.class_id}</h3>
                <p class="text-muted mb-4">Instructor: ${cls.instructor_name || 'N/A'}</p>
                <a href="class.html?id=${cls.class_id}" class="btn btn-outline" style="width: 100%;">View Class</a>
            </div>
        `;
    });
}

loadDashboard();
