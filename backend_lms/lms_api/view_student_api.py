from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Assignment, Submission, Class, Session, Student
from .permissions import IsStudent, CheckClassAccess
from .serializers import ClassSerializer, SessionSerializer, StudentAssignmentSerializer, SubmissionSerializer, StudentSubmissionSerializer, StudentSessionSerializer
import cloudinary.uploader

class StudentClassListAPIView(ListAPIView):
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def get_queryset(self):
        user = self.request.user
        return Class.objects.filter(
            enrolled_students__student__user=user
        ).select_related('course', 'instructor__user')

class StudentSessionListAPIView(ListAPIView):
    serializer_class = StudentSessionSerializer
    permission_classes = [IsAuthenticated, CheckClassAccess] 

    def get_queryset(self):
        cid = self.kwargs.get('class_id')
        return Session.objects.filter(class_ref_id=cid, is_deleted=False).prefetch_related(
            Prefetch('assignments', queryset=Assignment.objects.filter(is_deleted=False))
        )

class StudentAssignmentListAPIView(ListAPIView):
    serializer_class = StudentAssignmentSerializer
    permission_classes = [IsAuthenticated, CheckClassAccess]

    def get_queryset(self):
        session_id = self.kwargs.get('session_id')
        return Assignment.objects.filter(session_ref_id=session_id, is_deleted=False)

class StudentAssignmentDetailAPIView(RetrieveAPIView):
    queryset = Assignment.objects.filter(is_deleted=False)
    serializer_class = StudentAssignmentSerializer
    permission_classes = [IsAuthenticated, CheckClassAccess]
    lookup_field = 'assignment_id'
    lookup_url_kwarg = 'pk' 

class StudentSubmissionAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated, IsStudent, CheckClassAccess]

    def get(self, request, assignment_id):
        student = get_object_or_404(Student, user=request.user)
        submissions = Submission.objects.filter(
            assignment_ref_id=assignment_id, student_ref=student, is_deleted=False
        ).select_related('assignment_ref')
        serializer = StudentSubmissionSerializer(submissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, assignment_id):
        assignment = get_object_or_404(Assignment, pk=assignment_id, is_deleted=False)
        student = get_object_or_404(Student, user=request.user) 

        now = timezone.now()
        is_late = bool(assignment.deadline and now > assignment.deadline)

        submission = Submission.objects.filter(assignment_ref=assignment, student_ref=student, is_deleted=False).first()

        if submission:
            if submission.submission_url:
                try:
                    p_id = submission.submission_url.public_id
                    url = submission.submission_url.url
                    ext = url.split('.')[-1]
                    cloudinary.uploader.destroy(f"{p_id}.{ext}", resource_type='raw')
                except Exception as e:
                    print(f"Lỗi dọn mây: {e}")

            serializer = SubmissionSerializer(submission, data=request.data, partial=True)
            status_code = status.HTTP_200_OK 
        else:
            serializer = SubmissionSerializer(data=request.data)
            status_code = status.HTTP_201_CREATED

        if serializer.is_valid():
            uploaded_file = request.data.get('submission_url')
            file_name = uploaded_file.name if uploaded_file else None
            
            serializer.save(
                assignment_ref=assignment,
                student_ref=student,
                is_late=is_late,
                submitted_at=now,
                is_submitted=True,
                file_name=file_name
            )
            return Response(serializer.data, status=status_code)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
