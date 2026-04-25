from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, ListCreateAPIView, DestroyAPIView
from rest_framework.permissions import IsAuthenticated
from .models import Assignment, Submission, Course, Class, Session, Student
from .permissions import IsInstructor, IsInstructorAndClassOwner
from .serializers import CourseSerializer, ClassSerializer, SessionSerializer, AssignmentSerializer, SubmissionSerializer, StudentSerializer

class InstructorCourseListAPIView(ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsInstructor]

    def get_queryset(self):
        user = self.request.user
        queryset = Course.objects.filter(classes__instructor__user=user).distinct()
        search_name = self.request.query_params.get('search_name', None)
        if search_name:
            queryset = queryset.filter(course_title__icontains=search_name)
        return queryset

class InstructorClassListByCourseAPIView(ListAPIView):
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated, IsInstructor]

    def get_queryset(self):
        course_id = self.kwargs['id']
        return Class.objects.filter(course__course_id=course_id, instructor__user=self.request.user)

class InstructorClassStudentsAPIView(ListAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsInstructorAndClassOwner]

    def get_queryset(self):
        class_id = self.kwargs.get('class_id')
        return Student.objects.filter(enrollments__class_ref_id=class_id)

class InstructorSessionListCreateAPIView(ListCreateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsInstructorAndClassOwner]

    def get_queryset(self):
        class_id = self.kwargs['class_id']
        return Session.objects.filter(class_ref__class_id=class_id, is_deleted=False)

    def perform_create(self, serializer):
        class_id = self.kwargs['class_id']
        class_obj = get_object_or_404(Class, pk=class_id)
        serializer.save(class_ref=class_obj)

class InstructorSessionDetailAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsInstructorAndClassOwner]
    lookup_field = 'session_id' 
    lookup_url_kwarg = 'session_id'     

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_by = self.request.user 
        instance.save()

class InstructorAssignmentListCreateAPIView(ListCreateAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsInstructorAndClassOwner]
    lookup_url_kwarg = 'session_id'

    def get_queryset(self):
        session_id = self.kwargs.get('session_id')
        return Assignment.objects.filter(session_ref_id=session_id, is_deleted=False)

    def perform_create(self, serializer):
        sid = self.kwargs.get('session_id')
        session_instance = get_object_or_404(Session, pk=sid)
        serializer.save(session_ref=session_instance)

class InstructorAssignmentDetailAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsInstructorAndClassOwner]
    lookup_field = 'assignment_id'
    lookup_url_kwarg = 'pk' 

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_by = self.request.user
        instance.save()

class InstructorSubmissionListAPIView(ListAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated, IsInstructorAndClassOwner]

    def get_queryset(self):
        assignment_id = self.kwargs['assignment_id']
        return Submission.objects.filter(assignment_ref_id=assignment_id, is_deleted=False)

class InstructorSubmissionDeleteAPIView(DestroyAPIView):
    queryset = Submission.objects.filter(is_deleted=False)
    permission_classes = [IsAuthenticated, IsInstructorAndClassOwner] 
    lookup_url_kwarg = 'submission_id' 

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_by = self.request.user
        instance.save()

class InstructorGradeSubmissionAPIView(APIView):
    permission_classes = [IsAuthenticated, IsInstructorAndClassOwner]

    def patch(self, request, submission_id):
        submission = get_object_or_404(Submission, pk=submission_id)
        score = request.data.get('score')

        if score is None:
            return Response({'error': 'Vui lòng cung cấp điểm số (score).'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            score = float(score)
            if score < 0 or score > 10:
                return Response({'error': 'Điểm số phải nằm trong khoảng từ 0 đến 10.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Điểm số không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)

        submission.score = score
        submission.save()

        serializer = SubmissionSerializer(submission)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, submission_id):
        return self.patch(request, submission_id)
