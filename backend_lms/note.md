# 1. Tạo User cho Instructor 1: 
inst_user = User.objects.create_user(
    username='giangvien01',
    password='password123', 
    role='instructor',
    first_name='Nguyen Van',
    last_name='A',
    email='nguyenvana.instructor@lms.edu.vn'
)
# Profile Instructor
Instructor.objects.create(
    instructor_id='INST001',
    user=inst_user,
    birthdate=date(1990, 5, 20)
)


# 2. Tạo User cho Student 1:
std_user = User.objects.create_user(
    username='sinhvien01',
    password='newpassword123',
    role='student',
    first_name='Tran Duc',
    last_name='Khang',
    email='duckhang@lms.edu.vn'
)
# Profile Student 
Student.objects.create(
    student_id='STD001',
    user=std_user,
    birthdate=date(2004, 10, 15),
    admission_year=2024
)

# Tạo User cho Student 2:
std_user = User.objects.create_user(
    username='sinhvien02',
    password='Abc123!xyz',
    role='student',
    first_name='Nguyen Van',
    last_name='Minh',
    email='vanminh@lms.edu.vn'
)
# Profile Student
Student.objects.create(
    student_id='STD002',
    user=std_user,
    birthdate=date(2005, 3, 20),
    admission_year=2024
)
