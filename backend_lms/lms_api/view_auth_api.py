from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Student, Instructor

class ForgotPasswordAPIView(APIView):
    permission_classes = [] 

    def post(self, request):
        user_id = request.data.get('id')
        email = request.data.get('email')
        new_password = request.data.get('new_password')
        
        if not user_id or not email or not new_password:
            return Response({'error': 'Vui lòng cung cấp id, email và new_password.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user_to_reset = None
        
        student = Student.objects.filter(student_id=user_id).select_related('user').first()
        if student:
            if student.user.email == email:
                user_to_reset = student.user
            else:
                return Response({'error': 'Email không khớp với ID sinh viên.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            instructor = Instructor.objects.filter(instructor_id=user_id).select_related('user').first()
            if instructor:
                if instructor.user.email == email:
                    user_to_reset = instructor.user
                else:
                    return Response({'error': 'Email không khớp với ID giảng viên.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': 'ID không tồn tại trong hệ thống.'}, status=status.HTTP_404_NOT_FOUND)
                
        if user_to_reset:
            user_to_reset.set_password(new_password)
            user_to_reset.save()
            return Response({'message': 'Mật khẩu đã được đặt lại thành công.'}, status=status.HTTP_200_OK)
