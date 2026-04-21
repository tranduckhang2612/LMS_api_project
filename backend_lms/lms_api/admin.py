from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Instructor, Student, Course, Class, Enrollment, Session, Assignment, Submission
# Register your models here.

# 1. Tạo một class Admin tùy chỉnh cho User
class CustomUserAdmin(UserAdmin):
    # Kế thừa form mặc định và nhét thêm trường 'role', 'card_id' vào
    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin phân quyền LMS', {'fields': ('role', 'card_id')}),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(Instructor)
admin.site.register(Student)
admin.site.register(Course)
admin.site.register(Class)
admin.site.register(Enrollment)
admin.site.register(Session)
admin.site.register(Assignment)
admin.site.register(Submission)