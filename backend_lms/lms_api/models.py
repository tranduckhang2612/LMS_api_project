from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from cloudinary.models import CloudinaryField
import cloudinary.uploader
from django.utils import timezone
from django.conf import settings
# --- AUTH & USERS ---
class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('instructor', 'Instructor'),
        ('student', 'Student'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    # Django mặc định đã băm mật khẩu bằng thuật toán an toàn (PBKDF2/Bcrypt) trước khi lưu.

class Instructor(models.Model):
    instructor_id = models.CharField(max_length=50, primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='instructor_profile')
    birthdate = models.DateField()

class Student(models.Model):
    student_id = models.CharField(max_length=50, primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    birthdate = models.DateField()
    admission_year = models.IntegerField()

# --- ACADEMIC STRUCTURE ---
class Course(models.Model):
    course_id = models.CharField(max_length=50, primary_key=True)
    course_title = models.CharField(max_length=255)
    credits = models.IntegerField()
    prerequisite = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)

class Class(models.Model):
    class_id = models.CharField(max_length=50, primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='classes')
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE, related_name='teaching_classes')
    semester = models.CharField(max_length=20)
    year = models.IntegerField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

class Enrollment(models.Model):
    enrollment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='enrolled_students') # Đăng ký vào lớp cụ thể
    enroll_at = models.DateTimeField(auto_now_add=True)

# --- LEARNING MATERIALS ---
class Session(models.Model):
    session_id = models.AutoField(primary_key=True)
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sessions')
    session_title = models.CharField(max_length=255)
    sn_content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="session_deleted_by" 
    )

class Assignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    session_ref = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='assignments')
    assignment_title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assignment_url =CloudinaryField('raw', resource_type='raw', null=True, blank=True)
    deadline = models.DateTimeField(blank= True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="assignment_deleted_by"  
    )

class Submission(models.Model):
    submission_id = models.AutoField(primary_key=True)
    assignment_ref = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student_ref = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='submissions')
    submission_url = CloudinaryField('raw', resource_type= 'raw', folder='lms_submissions/') 
    file_name = models.CharField(max_length=255, null=True, blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    score = models.FloatField(null=True, blank=True)
    is_submitted = models.BooleanField(default=True)
    is_late = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="submission_deleted_by"  
    )

