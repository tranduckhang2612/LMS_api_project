from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .view_auth_api import ForgotPasswordAPIView
from .view_student_api import (
    StudentClassListAPIView,
    StudentSessionListAPIView,
    StudentAssignmentListAPIView,
    StudentAssignmentDetailAPIView,
    StudentSubmissionAPIView,
)
from .view_instructor_api import (
    InstructorCourseListAPIView,
    InstructorClassListByCourseAPIView,
    InstructorClassStudentsAPIView,
    InstructorSessionListCreateAPIView,
    InstructorSessionDetailAPIView,
    InstructorAssignmentListCreateAPIView,
    InstructorAssignmentDetailAPIView,
    InstructorSubmissionListAPIView,
    InstructorSubmissionDeleteAPIView,
    InstructorGradeSubmissionAPIView,
)

urlpatterns = [
    # --- 1. AUTH & COMMON API ---
    path('api/auth/login', TokenObtainPairView.as_view(), name='login'),
    path('api/auth/forgot-password', ForgotPasswordAPIView.as_view(), name='forgot-password'),

    # --- 2. STUDENT API ---
    path('api/student/classes', StudentClassListAPIView.as_view(), name='student-classes'),
    path('api/student/classes/<str:class_id>/sessions', StudentSessionListAPIView.as_view(), name='student-class-sessions'),
    path('api/student/sessions/<int:session_id>/assignments', StudentAssignmentListAPIView.as_view(), name='student-session-assignments'),
    path('api/student/assignments/<int:pk>', StudentAssignmentDetailAPIView.as_view(), name='student-assignment-detail'),
    path('api/student/assignments/<int:assignment_id>/submissions', StudentSubmissionAPIView.as_view(), name='student-submission'),

    # --- 3. INSTRUCTOR API ---
    # Courses & Classes
    path('api/instructor/courses', InstructorCourseListAPIView.as_view(), name='instructor-course-list'),
    path('api/instructor/courses/<str:id>/classes', InstructorClassListByCourseAPIView.as_view(), name='instructor-course-classes'),
    path('api/instructor/classes/<str:class_id>/students', InstructorClassStudentsAPIView.as_view(), name='instructor-class-students'),
    
    # Sessions
    path('api/instructor/classes/<str:class_id>/sessions', InstructorSessionListCreateAPIView.as_view(), name='instructor-class-sessions'),
    path('api/instructor/sessions/<int:session_id>', InstructorSessionDetailAPIView.as_view(), name='instructor-session-detail'),
    
    # Assignments
    path('api/instructor/sessions/<int:session_id>/assignments', InstructorAssignmentListCreateAPIView.as_view(), name='instructor-create-assignment'),
    path('api/instructor/assignments/<int:pk>', InstructorAssignmentDetailAPIView.as_view(), name='instructor-assignment-detail'),
    
    # Submissions and Grading
    path('api/instructor/assignments/<int:assignment_id>/submissions', InstructorSubmissionListAPIView.as_view(), name='instructor-assignment-submissions'),
    path('api/instructor/submissions/<int:submission_id>', InstructorSubmissionDeleteAPIView.as_view(), name='instructor-delete-submission'),
    path('api/instructor/submissions/<int:submission_id>/grade', InstructorGradeSubmissionAPIView.as_view(), name='instructor-grade-submission'),

    # --- SPECTACULAR API ---
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]