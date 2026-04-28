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
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = 'index.html';
            throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json().catch(() => ({}));
        
        // Handle DRF serializer validation errors (object with field keys)
        let errMsg = errorData.detail || errorData.error;
        if (!errMsg && Object.keys(errorData).length > 0) {
            // Extract the first validation error message
            const firstKey = Object.keys(errorData)[0];
            const firstErr = errorData[firstKey];
            errMsg = `${firstKey}: ${Array.isArray(firstErr) ? firstErr[0] : firstErr}`;
        }
        
        throw new Error(errMsg || 'API Request Failed');
    }
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

    // Courses (Instructor)
    async getCourses() {
        const response = await fetch(`${BASE_URL}/instructor/courses`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async getCourseDetails(courseId) {
        const courses = await this.getCourses();
        const course = courses.find(c => c.course_id === courseId);
        if (!course) throw new Error('Course not found');
        return course;
    },

    async getCourseClasses(courseId) {
        const response = await fetch(`${BASE_URL}/instructor/courses/${courseId}/classes`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async getClassStudents(classId) {
        const response = await fetch(`${BASE_URL}/instructor/classes/${classId}/students`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Classes (Student)
    async getStudentClasses() {
        const response = await fetch(`${BASE_URL}/student/classes`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Sessions (Both)
    async getInstructorClassSessions(classId) {
        const response = await fetch(`${BASE_URL}/instructor/classes/${classId}/sessions`, { headers: getAuthHeaders() });
        return handleResponse(response);
    },
    async getStudentClassSessions(classId) {
        const response = await fetch(`${BASE_URL}/student/classes/${classId}/sessions`, { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    async createSession(classId, sessionData) {
        const response = await fetch(`${BASE_URL}/instructor/classes/${classId}/sessions`, {
            method: 'POST',
            headers: { 
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sessionData)
        });
        return handleResponse(response);
    },

    async updateSession(sessionId, sessionData) {
        const response = await fetch(`${BASE_URL}/instructor/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sessionData)
        });
        return handleResponse(response);
    },

    async deleteSession(sessionId) {
        const response = await fetch(`${BASE_URL}/instructor/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Assignments (Both)
    async getInstructorSessionAssignments(sessionId) {
        const response = await fetch(`${BASE_URL}/instructor/sessions/${sessionId}/assignments`, { headers: getAuthHeaders() });
        return handleResponse(response);
    },
    async getStudentSessionAssignments(sessionId) {
        const response = await fetch(`${BASE_URL}/student/sessions/${sessionId}/assignments`, { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    async createAssignment(sessionId, payload) {
        const headers = getAuthHeaders();
        const isFormData = payload instanceof FormData;
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${BASE_URL}/instructor/sessions/${sessionId}/assignments`, {
            method: 'POST',
            headers: headers,
            body: isFormData ? payload : JSON.stringify(payload)
        });
        return handleResponse(response);
    },

    async updateAssignment(assignmentId, payload) {
        const headers = getAuthHeaders();
        const isFormData = payload instanceof FormData;
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${BASE_URL}/instructor/assignments/${assignmentId}`, {
            method: 'PATCH',
            headers: headers,
            body: isFormData ? payload : JSON.stringify(payload)
        });
        return handleResponse(response);
    },

    async deleteAssignment(assignmentId) {
        const response = await fetch(`${BASE_URL}/instructor/assignments/${assignmentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async getInstructorAssignmentDetails(assignmentId) {
        const response = await fetch(`${BASE_URL}/instructor/assignments/${assignmentId}`, { headers: getAuthHeaders() });
        return handleResponse(response);
    },
    async getStudentAssignmentDetails(assignmentId) {
        const response = await fetch(`${BASE_URL}/student/assignments/${assignmentId}`, { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    // Submissions
    async getSubmissions(assignmentId) { // Instructor
        const response = await fetch(`${BASE_URL}/instructor/assignments/${assignmentId}/submissions`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    
    async getStudentSubmissions(assignmentId) { // Student
        const response = await fetch(`${BASE_URL}/student/assignments/${assignmentId}/submissions`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    
    async submitAssignment(assignmentId, payload) { // Student
        const headers = getAuthHeaders();
        const isFormData = payload instanceof FormData;
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(`${BASE_URL}/student/assignments/${assignmentId}/submissions`, {
            method: 'POST',
            headers: headers,
            body: isFormData ? payload : JSON.stringify(payload)
        });
        return handleResponse(response);
    },

    async gradeSubmission(submissionId, score) { // Instructor
        const response = await fetch(`${BASE_URL}/instructor/submissions/${submissionId}/grade`, {
            method: 'PATCH',
            headers: { 
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ score })
        });
        return handleResponse(response);
    },

    async deleteSubmission(submissionId) {
        const response = await fetch(`${BASE_URL}/instructor/submissions/${submissionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async forgotPassword(userId, email, newPassword) {
        const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, email, new_password: newPassword })
        });
        return handleResponse(response);
    }
};

export default api;

