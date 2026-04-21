const BASE_URL = 'http://127.0.0.1:8000/api';

// Helper to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Helper to handle API responses globally
async function handleResponse(response) {
    if (!response.ok) {
        if (response.status === 401) {
            // Token expired or invalid, force logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = 'index.html';
            throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'API Request Failed');
    }
    // Return empty object for 204 No Content
    if (response.status === 204) return {};
    return response.json();
}

// API methods object
const api = {
    // Auth
    async login(username, password) {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await handleResponse(response);
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        return data;
    },

    // Courses
    async getCourses() {
        const response = await fetch(`${BASE_URL}/courses`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async getCourseDetails(courseId) {
        const response = await fetch(`${BASE_URL}/courses/${courseId}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async getCourseClasses(courseId) {
        const response = await fetch(`${BASE_URL}/courses/${courseId}/classes`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Sessions
    async getClassSessions(classId) {
        const response = await fetch(`${BASE_URL}/classes/${classId}/sessions`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async createSession(classId, sessionData) {
        const response = await fetch(`${BASE_URL}/classes/${classId}/sessions`, {
            method: 'POST',
            headers: { 
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sessionData)
        });
        return handleResponse(response);
    },

    // Assignments
    async getSessionAssignments(sessionId) {
        const response = await fetch(`${BASE_URL}/sessions/${sessionId}/assignments`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async createAssignment(sessionId, assignmentData) {
        const response = await fetch(`${BASE_URL}/sessions/${sessionId}/assignments`, {
            method: 'POST',
            headers: { 
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });
        return handleResponse(response);
    },

    async getAssignmentDetails(assignmentId) {
        const response = await fetch(`${BASE_URL}/assignments/${assignmentId}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Submissions
    async getSubmissions(assignmentId) {
        const response = await fetch(`${BASE_URL}/assignments/${assignmentId}/submissions/`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async gradeSubmission(submissionId, score) {
        const response = await fetch(`${BASE_URL}/submissions/${submissionId}/grade`, {
            method: 'PATCH',
            headers: { 
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ score })
        });
        return handleResponse(response);
    }
};

export default api;
