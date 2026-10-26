import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { publicJobApi, jobApplicationApi } from '../services/api'
import { 
  Briefcase, 
  MapPin, 
  Users, 
  Building,
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface Job {
  id: number
  title: string
  description: string
  required_skills: string[]
  number_of_students_needed: number
  institution: string
  department: string
  location: string
  status: 'active' | 'closed' | 'draft'
  created_at: string
  deadline: string
  professor_name?: string
  applications_count: number
  has_applied?: boolean
}

const AvailableJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<Job | null>(null)
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)
  const [applicationNotification, setApplicationNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    student_full_name: '',
    student_department: '',
    student_academic_year: '',
    student_number: '',
    cover_letter: '',
    cv_file: null as File | null
  })

  // Fetch jobs on component mount
  useEffect(() => {
    const fetchJobsAndApplications = async () => {
      try {
        // Fetch jobs
        const jobsResponse = await publicJobApi.getActiveJobPosts()
        const transformedJobs = jobsResponse.data.job_posts.map((job: any) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          required_skills: job.required_skills,
          number_of_students_needed: job.number_of_students_needed,
          institution: job.institution,
          department: job.department,
          location: job.location,
          status: job.status,
          created_at: job.created_at,
          deadline: job.deadline,
          professor_name: job.job_provider_name || 'Professor',
          applications_count: job.applications_count,
          has_applied: false
        }))

        // Fetch student's applications to mark jobs as already applied
        try {
          const applicationsResponse = await jobApplicationApi.getMyApplications()
          const appliedJobIds = applicationsResponse.data.applications.map((app: any) => app.job_post)
          
          // Mark jobs as already applied
          const jobsWithApplicationStatus = transformedJobs.map((job: Job) => ({
            ...job,
            has_applied: appliedJobIds.includes(job.id)
          }))
          
          setJobs(jobsWithApplicationStatus)
        } catch (appError) {
          // If we can't fetch applications, still show jobs but without application status
          console.warn('Could not fetch application status:', appError)
          setJobs(transformedJobs)
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      }
    }
    fetchJobsAndApplications()
  }, [])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.required_skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleApplyClick = (job: Job) => {
    setSelectedJobForApplication(job)
    setShowApplicationModal(true)
    setApplicationForm({
      student_full_name: '',
      student_department: '',
      student_academic_year: '',
      student_number: '',
      cover_letter: '',
      cv_file: null
    })
  }

  const handleApplicationSubmit = async () => {
    if (!selectedJobForApplication) return

    // Form validation
    if (!applicationForm.student_full_name.trim() || 
        !applicationForm.student_department.trim() || 
        !applicationForm.student_academic_year.trim() || 
        !applicationForm.student_number.trim()) {
      setApplicationNotification({
        type: 'error',
        message: 'Please fill in all required fields'
      })
      return
    }

    setIsSubmittingApplication(true)
    setApplicationNotification(null)

    try {
      await jobApplicationApi.applyForJob({
        job_post: selectedJobForApplication.id,
        student_full_name: applicationForm.student_full_name.trim(),
        student_department: applicationForm.student_department.trim(),
        student_academic_year: applicationForm.student_academic_year.trim(),
        student_number: applicationForm.student_number.trim(),
        cover_letter: applicationForm.cover_letter.trim(),
        cv_file: applicationForm.cv_file || undefined
      })

      // Update job to show as applied
      setJobs(prev => prev.map(job => 
        job.id === selectedJobForApplication.id ? { ...job, has_applied: true } : job
      ))

      // Close modal and reset form
      setShowApplicationModal(false)
      setSelectedJobForApplication(null)
      setApplicationForm({
        student_full_name: '',
        student_department: '',
        student_academic_year: '',
        student_number: '',
        cover_letter: '',
        cv_file: null
      })

      // Show success notification
      setApplicationNotification({
        type: 'success',
        message: 'Application submitted successfully!'
      })

    } catch (error: any) {
      console.error('Failed to submit application:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      let errorMessage = 'Failed to submit application. Please try again.'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setApplicationNotification({
        type: 'error',
        message: errorMessage
      })
    } finally {
      setIsSubmittingApplication(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'closed':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'draft':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'closed':
        return <Clock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-theme-primary mb-2">Available Jobs</h1>
              <p className="text-theme-muted">Discover opportunities posted by professors and employers</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted" />
              <input
                type="text"
                placeholder="Search jobs by title, skills, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-theme-card border border-theme rounded-xl text-theme-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-theme-card border border-theme rounded-xl text-theme-secondary hover:bg-theme-card-hover transition-all duration-200"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-theme-card border border-theme rounded-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-2">Department</label>
                  <select className="w-full px-3 py-2 bg-theme-card-hover border border-theme rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Departments</option>
                    <option value="cs">Computer Science</option>
                    <option value="ce">Computer Engineering</option>
                    <option value="ds">Data Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-2">Location</label>
                  <select className="w-full px-3 py-2 bg-theme-card-hover border border-theme rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Locations</option>
                    <option value="ankara">Ankara</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-2">Position Type</label>
                  <select className="w-full px-3 py-2 bg-theme-card-hover border border-theme rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Types</option>
                    <option value="research">Research</option>
                    <option value="internship">Internship</option>
                    <option value="project">Project</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-theme-card rounded-2xl border border-theme p-6 hover:border-theme-accent-primary/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-theme-primary mb-2">{job.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-theme-muted mb-3">
                    <div className="flex items-center space-x-1">
                      <Building className="w-4 h-4" />
                      <span>{job.institution}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <div className="text-sm text-theme-secondary mb-3">
                    <span className="font-medium text-theme-muted">Professor: </span>
                    {job.professor_name}
                  </div>
                </div>
                <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border ${getStatusColor(job.status)}`}>
                  {getStatusIcon(job.status)}
                  <span className="text-xs font-medium capitalize">{job.status}</span>
                </div>
              </div>

              <p className="text-theme-secondary mb-4 line-clamp-2">{job.description}</p>

              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.slice(0, 3).map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-2 py-1 bg-theme-accent-primary/10 text-theme-accent-primary text-xs rounded-lg border border-theme-accent-primary/20"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.required_skills.length > 3 && (
                    <span className="px-2 py-1 bg-theme-card-hover text-theme-muted text-xs rounded-lg">
                      +{job.required_skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-theme">
                <div className="flex items-center space-x-4 text-sm text-theme-muted">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{job.number_of_students_needed} needed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline: {job.deadline}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSelectedJob(job)}
                    className="p-2 text-theme-muted hover:text-theme-secondary hover:bg-theme-card-hover rounded-lg transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {job.has_applied ? (
                    <button 
                      disabled
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl opacity-75 cursor-not-allowed"
                    >
                      Applied
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleApplyClick(job)}
                      className="px-4 py-2 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary hover:from-theme-accent-primary hover:to-theme-accent-secondary text-white font-medium rounded-xl transition-all duration-200"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme-secondary mb-2">No jobs found</h3>
            <p className="text-theme-muted">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedJob(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-theme-card rounded-2xl border border-theme p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-theme-primary">{selectedJob.title}</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 text-theme-muted hover:text-theme-secondary hover:bg-theme-card-hover rounded-lg transition-all duration-200"
              >
                <Clock className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-theme-muted mb-3">Job Information</h4>
                <div className="bg-theme-card-hover rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Institution:</span>
                    <span className="text-theme-primary">{selectedJob.institution}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Department:</span>
                    <span className="text-theme-primary">{selectedJob.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Location:</span>
                    <span className="text-theme-primary">{selectedJob.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Professor:</span>
                    <span className="text-theme-primary">{selectedJob.professor_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Positions Available:</span>
                    <span className="text-theme-primary">{selectedJob.number_of_students_needed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Application Deadline:</span>
                    <span className="text-theme-primary">{selectedJob.deadline}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-theme-muted mb-3">Job Description</h4>
                <div className="bg-theme-card-hover rounded-xl p-4">
                  <p className="text-theme-primary">{selectedJob.description}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-theme-muted mb-3">Required Skills</h4>
                <div className="bg-theme-card-hover rounded-xl p-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-theme-accent-primary/10 text-theme-accent-primary text-sm rounded-lg border border-theme-accent-primary/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4 border-t border-theme">
                {selectedJob.has_applied ? (
                  <div className="flex-1 text-center py-3 bg-green-600/10 border border-green-600/20 rounded-xl">
                    <span className="text-green-400 font-medium">You have already applied to this position</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedJobForApplication(selectedJob)
                      handleApplicationSubmit()
                      setSelectedJob(null)
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary hover:from-theme-accent-primary hover:to-theme-accent-secondary text-white font-medium rounded-xl transition-all duration-200"
                  >
                    Apply for This Position
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Application Notification */}
      {applicationNotification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border ${
          applicationNotification.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center space-x-3">
            {applicationNotification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{applicationNotification.message}</span>
            <button
              onClick={() => setApplicationNotification(null)}
              className="ml-4 text-current hover:opacity-70"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedJobForApplication && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowApplicationModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-theme-card rounded-2xl border border-theme p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-theme-primary">Apply for {selectedJobForApplication.title}</h3>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="p-2 text-theme-muted hover:text-theme-secondary hover:bg-theme-card-hover rounded-lg transition-all duration-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-theme-card-hover rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-theme-muted">Institution:</span>
                <span className="text-theme-primary">{selectedJobForApplication.institution}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-theme-muted">Department:</span>
                <span className="text-theme-primary">{selectedJobForApplication.department}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-muted mb-2">Full Name *</label>
                <input
                  type="text"
                  value={applicationForm.student_full_name}
                  onChange={(e) => setApplicationForm({ ...applicationForm, student_full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-muted mb-2">Student Number *</label>
                <input
                  type="text"
                  value={applicationForm.student_number}
                  onChange={(e) => setApplicationForm({ ...applicationForm, student_number: e.target.value })}
                  className="w-full px-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your student number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-muted mb-2">Department *</label>
                <input
                  type="text"
                  value={applicationForm.student_department}
                  onChange={(e) => setApplicationForm({ ...applicationForm, student_department: e.target.value })}
                  className="w-full px-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-muted mb-2">Academic Year *</label>
                <select
                  value={applicationForm.student_academic_year}
                  onChange={(e) => setApplicationForm({ ...applicationForm, student_academic_year: e.target.value })}
                  className="w-full px-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-muted mb-2">Cover Letter (Optional)</label>
                <textarea
                  value={applicationForm.cover_letter}
                  onChange={(e) => setApplicationForm({ ...applicationForm, cover_letter: e.target.value })}
                  className="w-full px-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Tell us why you're interested in this position..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-muted mb-2">Upload CV (Optional)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setApplicationForm({ ...applicationForm, cv_file: e.target.files?.[0] || null })}
                    className="w-full px-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-theme-accent-primary file:text-white hover:file:bg-indigo-700"
                  />
                  {applicationForm.cv_file && (
                    <div className="mt-2 text-sm text-green-400 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {applicationForm.cv_file.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-6 border-t border-theme mt-6">
              <button
                onClick={() => setShowApplicationModal(false)}
                className="flex-1 py-3 bg-theme-card-hover hover:bg-theme-border text-white font-medium rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApplicationSubmit}
                disabled={isSubmittingApplication}
                className={`flex-1 py-3 font-medium rounded-xl transition-all duration-200 ${
                  isSubmittingApplication
                    ? 'bg-theme-border text-theme-muted cursor-not-allowed'
                    : 'bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary hover:from-theme-accent-primary hover:to-theme-accent-secondary text-white'
                }`}
              >
                {isSubmittingApplication ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default AvailableJobs
