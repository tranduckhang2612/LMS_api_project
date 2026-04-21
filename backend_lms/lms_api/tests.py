from django.test import TestCase
from rest_framework.test import APIClient
from .models import User, Student

# 1. TEST DATABASE (MODEL)
class BasicModelTestCase(TestCase):
    def setUp(self):
        """
        Hàm setUp() sẽ tự động chạy TRƯỚC MỖI hàm test bên dưới.
        Thường dùng để tạo dữ liệu giả (mock data) để test.
        """
        self.user = User.objects.create_user(
            username='test_student',
            password='testpassword123',
            email='student@test.com',
            role='student',
            first_name='Nguyen',
            last_name='Van A'
        )
        self.student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            birthdate='2000-01-01',
            admission_year=2020
        )

    def test_user_creation(self):
        """Kiểm tra xem User có được tạo và lưu đúng vào DB chưa"""
        # Lấy user từ DB lên
        user_in_db = User.objects.get(username='test_student')
        
        # Dùng các hàm assert... để so sánh (kỳ vọng vs thực tế)
        self.assertEqual(user_in_db.email, 'student@test.com')
        self.assertEqual(user_in_db.role, 'student')
        
        # Đảm bảo mật khẩu đã được mã hóa chứ không lưu text thường
        self.assertNotEqual(user_in_db.password, 'testpassword123')

    def test_student_linked_to_user(self):
        """Kiểm tra xem sinh viên có được liên kết đúng với User không"""
        self.assertEqual(self.student.user.first_name, 'Nguyen')
        self.assertEqual(self.student.student_id, 'STU001')


# 2. TEST API (VIEW/ROUTER)
class BasicAPITestCase(TestCase):
    def setUp(self):
        # APIClient() hoạt động giống như một chiếc Postman ảo trong code
        self.client = APIClient()
        
        # Tạo sẵn 1 tài khoản để test đăng nhập
        self.user = User.objects.create_user(
            username='test_api_user',
            password='correct_password_123'
        )

    def test_login_api_success(self):
        """Test trường hợp đăng nhập THÀNH CÔNG"""
        
        # Dùng client để gọi API POST (như đang dùng Postman)
        response = self.client.post('/api/auth/login', {
            'username': 'test_api_user',
            'password': 'correct_password_123'
        })
        
        # Mong đợi HTTP Status Code trả về là 200 OK
        self.assertEqual(response.status_code, 200)
        
        # Mong đợi trong cục JSON trả về phải chứa key 'access' (Access Token)
        self.assertIn('access', response.data)

    def test_login_api_wrong_password(self):
        """Test trường hợp đăng nhập THẤT BẠI (sai mật khẩu)"""
        
        response = self.client.post('/api/auth/login', {
            'username': 'test_api_user',
            'password': 'wrong_password_!!!'
        })
        
        # Mong đợi HTTP Status Code trả về là 401 Unauthorized
        self.assertEqual(response.status_code, 401)
        self.assertNotIn('access', response.data)
