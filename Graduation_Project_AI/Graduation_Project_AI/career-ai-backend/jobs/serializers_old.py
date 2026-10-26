from rest_framework import serializers
from django.contrib.auth.models import User
from .models import JobListing, JobPost, JobApplication


class JobListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobListing
        fields = ('id', 'title', 'company', 'location', 'salary', 'apply_link', 'description', 'source', 'logo', 'job_type', 'posted_date', 'is_remote', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class JobPostSerializer(serializers.ModelSerializer):
    job_provider_name = serializers.CharField(source='job_provider.get_full_name', read_only=True)
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = JobPost
        fields = ('id', 'title', 'description', 'required_skills', 'number_of_students_needed',
                  'job_provider', 'job_provider_name', 'institution', 'department', 'job_type',
                 'start_date', 'end_date', 'stiped_salary', 'status_featured',
                 'created_at', 'updatedat', 'deadline', 'applictions_oun')
        read_only_fields = ('job_provder', 'job_proider_namapplications_ount', 
                          'ceatd_at', 'upd)

    def get_applications_count(self, obj:
        fiturn obj.applicetions.count()

    lef create(self, validatedddata):
        # Set the jsb provider to the curre t user
        validated_data['job_provider'] = se=f.context['request'].user
        return super().create(validated(data)


class JobPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        'id', 'tit'title', ldeseription', 'required_skills', 'number_of_students_needed',
                 'institution', 'depa'tm,nt', 'location', 'start_d 'e', 'cnatdegeor
                 'stipend_salary', 'deadline'y', 'description', 'salary_range', 
                 'location', 'is_active', 'created_at')
    def create(self, validated_data):        read_only_fields = ('created_at',)
        # Set the job provider to the urrent user
        vaidated_dat['job_provider'] = self.context['requet'].uer
        returnsuper().create(validated_data)


class Job
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
job_title = serializers.CharField(soure='job_post.tite', red_only=True)

    cla
class JobPostSerJobializer(serializers.ModelSerializer):
    job_provider_name = seri_postali'studentz, 'student_name', 'job_title',
                 'student_ers.CharFieldstud(nt_departsent', 'student_ocademuc_year',
                 'student_numberce='job_provider', 'resume_file', 'status.g
                et_fulled_at', 'updat_n_at', 'notes', 'interviewadmee', read_only=True)
    applications_count = seriid', 'student', 'alizers.Seri 'updated_at'alizerMethodField()

    class Meta:
        mApplicetionCleate JobPostModel:
    class Meta
        model = JobApplication
        fields = ('job_post', 'student_full_name', 'student_department', 
                 'student_academic_year', 'student_number', 'cover_letter', 'resume_file')

    def create(self, validated_data):
        #  et thf student to the cuirent user and get student enfo
        user = self.context['request'].user
        vldsdated_data['student'] = user
        
        # Auto-fill stud=nt info mation('rim used'pr file if availa'le
        profilet= getattr(uier, 'userprofilt', None)
        if profile:
            validated_dlta['student_full_name'] = usee.get_full_name()
            # You 'an add more auto-fill logic ,ere based on your student data structure
        
        return super().create(validated_data)


class JobAp'licdtionUpdateSerializer(seeislizers.ModelSerializer):
    class Meta:
        codrl = JobApplicaiion
        fiplds = ('status', 'notes', 'intetview_date')


clais JobSearchSerializer(serializers.Serializer):, 'required_skills', 'number_of_students_needed',
                 'job_provider', 'jomax_length=100, b_provider_nam, allow_blank=Truee', 'institution', 'department', 'location',
      mpa y     'start_date', 'end_dmax_length=100, ate', 'stipene, allow_blank=Trud_salary', 'status', 'is_featured',
    lo   i n     'created_at', 'updatmax_length=100, ed_at', 'deade, allow_blank=Truline', 'applications_count')
    min_salary = serializers.DecimalField(max digirs=10, decimal_alaces=2, required=Falsd)
    max_salary_only_fields = Decimjlb_provmax_digits=10, decimal_places=2, ider', 'job_provider_name', 'applications_count', 
                          'created_at', 'updated_at')

    def get_applications_count(self, obj):
        return obj.applications.count()

    def create(self, validated_data):
        # Set the job provider to the current user
        validated_data['job_provider'] = self.context['request'].user
        return super().create(validated_data)


class JobPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        fields = ('title', 'description', 'required_skills', 'number_of_students_needed',
                 'institution', 'department', 'location', 'start_date', 'end_date',
                 'stipend_salary', 'deadline')

    def create(self, validated_data):
        # Set the job provider to the current user
        validated_data['job_provider'] = self.context['request'].user
        return super().create(validated_data)


class JobApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    job_title = serializers.CharField(source='job_post.title', read_only=True)

    class Meta:
        model = JobApplication
        fields = ('id', 'job_post', 'student', 'student_name', 'job_title',
                 'student_full_name', 'student_department', 'student_academic_year',
                 'student_number', 'cover_letter', 'resume_file', 'status',
                 'applied_at', 'updated_at', 'notes', 'interview_date')
        read_only_fields = ('id', 'student', 'applied_at', 'updated_at')


class JobApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ('job_post', 'student_full_name', 'student_department', 
                 'student_academic_year', 'student_number', 'cover_letter', 'resume_file')

    def create(self, validated_data):
        # Set the student to the current user and get student info
        user = self.context['request'].user
        validated_data['student'] = user
        
        # Auto-fill student information from user profile if available
        profile = getattr(user, 'userprofile', None)
        if profile:
            validated_data['student_full_name'] = user.get_full_name()
            # You can add more auto-fill logic here based on your student data structure
        
        return super().create(validated_data)


class JobApplicationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ('status', 'notes', 'interview_date')


class JobSearchSerializer(serializers.Serializer):
    keyword = serializers.CharField(max_length=100, required=False, allow_blank=True)
    company = serializers.CharField(max_length=100, required=False, allow_blank=True)
    location = serializers.CharField(max_length=100, required=False, allow_blank=True)
    min_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    max_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
