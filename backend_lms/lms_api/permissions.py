from rest_framework import permissions
from django.shortcuts import get_object_or_404
from .models import Class, Session, Assignment, Enrollment, Submission

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'student')

class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'instructor')

class CheckClassAccess(permissions.BasePermission):
    """
    Middleware/Permission kiểm tra quyền truy cập lớp học.
    """
    message = "403 Forbidden: Bạn không có quyền truy cập lớp học này hoặc chưa đăng ký lớp."

    # def has_permission(self, request, view):
    #     # 1. Đảm bảo user đã đăng nhập và là sinh viên
    #     if not (request.user and request.user.is_authenticated and hasattr(request.user, 'student_profile')):
    #         return False
            
    #     student = request.user.student_profile
    #     class_id_to_check = None

    #     # 2. Bắt các parameters từ URL
    #     if 'class_id' in view.kwargs:
    #         class_id_to_check = view.kwargs['class_id']
            
    #     elif 'session_id' in view.kwargs:
    #         session = get_object_or_404(Session, pk=view.kwargs['session_id'])
    #         class_id_to_check = session.class_ref.class_id
            
    #     elif 'id' in view.kwargs: # ID của assignment từ endpoint /api/assignments/{id}/submissions
    #         assignment = get_object_or_404(Assignment, pk=view.kwargs['id'])
    #         # Truy vấn ngược: Assignment -> Session -> Class
    #         class_id_to_check = assignment.session.class_ref.class_id

    #     # 3. Đối soát với bảng Enrollment
    #     if class_id_to_check:
    #         is_enrolled = Enrollment.objects.filter(
    #             student=student, 
    #             class_ref_id=class_id_to_check
    #         ).exists()
    #         return is_enrolled
            
    #     return False
    
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
            
        # Admin có quyền tối cao
        if user.role == 'admin':
            return True

        # Lấy class_id từ URL (phụ thuộc vào tên biến bạn đặt trong urls.py)
        class_id = view.kwargs.get('class_id') or view.kwargs.get('id')
        
        # Nếu URL là /api/sessions/{session_id}, cần truy vấn ngược để tìm class_id
        if not class_id and 'session_id' in view.kwargs:
            try:
                session = Session.objects.select_related('class_ref').get(pk=view.kwargs['session_id'])
                class_id = session.class_ref.class_id
            except Session.DoesNotExist:
                return False 

        # Nếu URL là /api/assignments/{assignment_id}/submissions/
        if not class_id and 'assignment_id' in view.kwargs:
            try:
                assignment = Assignment.objects.select_related('session_ref__class_ref').get(pk=view.kwargs['assignment_id'])
                class_id = assignment.session_ref.class_ref.class_id
            except Assignment.DoesNotExist:
                return False

        # --- LOGIC PHÂN QUYỀN ---
        if user.role == 'instructor':
            # Kiểm tra xem giảng viên này có phải là người dạy lớp này không
            return Class.objects.filter(class_id=class_id, instructor__user=user).exists()

        if user.role == 'student':
            # Kiểm tra xem sinh viên này có đăng ký lớp này không
            return Enrollment.objects.filter(class_ref_id=class_id, student__user=user).exists()

        return False

class IsInstructorAndClassOwner(permissions.BasePermission):
    """
    Middleware: Chỉ Admin hoặc Giảng viên phụ trách lớp mới được Thêm/Sửa/Xóa.
    """
    message = "403 Forbidden: Bạn không có quyền thực hiện hành động này. Chỉ Giảng viên của lớp hoặc Admin mới được phép."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Admin có quyền tối cao (bypass)
        if user.role == 'admin':
            return True

        # Nếu không phải admin mà cũng không phải instructor thì chặn luôn (Ví dụ: student)
        if getattr(user, 'role', '') != 'instructor':
            return False

        # 1. Dành cho API POST (Thêm bài giảng): URL có dạng /api/classes/<class_id>/sessions
        class_id = view.kwargs.get('class_id')
        if class_id:
            return Class.objects.filter(class_id=class_id, instructor__user=user).exists()

        # 2. Dành cho API PUT, DELETE (Sửa/Xóa) HOẶC POST Bài tập: 
        # URL có dạng /api/sessions/<session_id> hoặc /api/sessions/<session_id>/assignments
        session_id = view.kwargs.get('session_id') 
        if session_id:
            try:
                # Tìm xem bài giảng này thuộc lớp nào, và lớp đó do ai dạy
                session = Session.objects.select_related('class_ref__instructor__user').get(pk=session_id)
                return session.class_ref.instructor.user == user
            except Session.DoesNotExist:
                return False
        
        # 3. API: Sửa/Xóa Bài tập HOẶC Lấy danh sách bài nộp
        assignment_id = view.kwargs.get('pk') or view.kwargs.get('assignment_id')
        if assignment_id:
            try:
                # Tìm bài tập -> Truy ngược ra Bài giảng -> Lớp học -> Giảng viên
                assignment = Assignment.objects.select_related('session_ref__class_ref__instructor__user').get(pk=assignment_id)
                return assignment.session_ref.class_ref.instructor.user == user
            except Assignment.DoesNotExist:
                return False

        # 4. API: Chấm điểm bài nộp (/api/submissions/<submission_id>/grade)
        submission_id = view.kwargs.get('submission_id')
        if submission_id:
            try:
                submission = Submission.objects.select_related('assignment_ref__session_ref__class_ref__instructor__user').get(pk=submission_id)
                return submission.assignment_ref.session_ref.class_ref.instructor.user == user
            except Submission.DoesNotExist:
                return False

        return False
