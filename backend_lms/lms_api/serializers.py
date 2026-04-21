from rest_framework import serializers
from .models import Course, Class, Session, Assignment, Submission, Student

class StudentSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Student
        fields = ['student_id', 'first_name', 'last_name', 'email', 'birthdate', 'admission_year']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__' # Lấy toàn bộ các trường (cột) trong bảng Course

class ClassSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()

    class Meta:
        model = Class
        # Trả về các trường cần thiết theo thiết kế API
        fields = ['class_id', 'course', 'instructor', 'instructor_name', 'semester', 'year', 'start_time', 'end_time']

    # Custom field để lấy tên Giảng viên thay vì chỉ lấy mã ID
    def get_instructor_name(self, obj):
        return f"{obj.instructor.user.first_name} {obj.instructor.user.last_name}"
    
class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        # Nhớ bổ sung 'sn_content' vào danh sách này nhé
        fields = ['session_id', 'session_title', 'sn_content', 'created_at']

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['assignment_id', 'session_ref', 'assignment_title', 'description', 'assignment_url', 'deadline', 'created_at']
        read_only_fields = ['session_ref'] # ID bài giảng sẽ lấy từ URL, không bắt người dùng nhập

    def to_representation(self, instance):
        res = super().to_representation(instance)
        # Đảm bảo trả về URL chuỗi của file từ Cloudinary
        if instance.assignment_url:
            res['assignment_url'] = instance.assignment_url.url
        return res
    
class StudentAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        # Chỉ định đúng 3 trường sinh viên được thấy
        fields = ['assignment_title', 'assignment_url', 'deadline']

    def to_representation(self, instance):
        res = super().to_representation(instance)
        # Đảm bảo link Cloudinary hiển thị chuẩn
        if instance.assignment_url:
            res['assignment_url'] = instance.assignment_url.url
        return res

class SubmissionSerializer(serializers.ModelSerializer):
    overdue_status = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            'submission_id', 'assignment_ref', 'student_ref', 
            'submission_url', 'submitted_at', 'score', 
            'is_submitted', 'is_late', 'overdue_status'
        ]
        # Sinh viên CHỈ được gửi mỗi file lên, tất cả các trường còn lại Backend tự lo
        read_only_fields = [
            'submission_id', 'assignment_ref', 'student_ref', 
            'submitted_at', 'score', 'is_late', 'is_submitted'
        ]

    def get_overdue_status(self, obj):
        if not obj.is_late or not obj.assignment_ref.deadline:
            return "Nộp đúng hạn"
        
        delta = obj.submitted_at - obj.assignment_ref.deadline
        days = delta.days
        hours, remainder = divmod(delta.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        return f"Nộp muộn {days} ngày, {hours} giờ, {minutes} phút"
    
class StudentSubmissionSerializer(serializers.ModelSerializer):
    overdue_status = serializers.SerializerMethodField()
    class Meta:
        model = Submission
        # Chỉ định chính xác 5 trường mà bạn muốn cho Sinh viên xem
        fields = [
            'submission_url', 
            'submitted_at', 
            'score', 
            'is_submitted', 
            'overdue_status'
        ]

    def get_overdue_status(self, obj):
        if not obj.is_late or not obj.assignment_ref.deadline:
            return "Nộp đúng hạn"
        
        delta = obj.submitted_at - obj.assignment_ref.deadline
        days = delta.days
        hours, remainder = divmod(delta.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        return f"Nộp muộn {days} ngày, {hours} giờ, {minutes} phút"
    
    
