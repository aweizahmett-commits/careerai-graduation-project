import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Building, 
  MapPin, 
  Users, 
  Calendar, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  Send, 
  Eye,
  Filter,
  Search
} from 'lucide-react'
import { publicJobApi, jobApplicationApi } from '../services/api'

interface JobPost {
  id: number
  title: string
  description: string
  required_skills: string[]
  number_of_students_needed: number
  institution: string
  department: string
  location: string
  status: string
  created_at: string
  deadline: string
  job_provider_name: string
  applications_count: number
}

interface ApplicationFormData {
  job_post: number
  student_full_name: string
  student_department: string
  student_academic_year: string
  student_number: string
  cover_letter: string
  cv_file?: File
}

const OstimJobs = () => {
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [myApplications, setMyApplications] = useState<any[]>([])
  const [applyTarget,   setApplyTarget]   = useState<JobPost | null>(null)  // job being applied to (separate from detail view)
  const [openingModal,  setOpeningModal]  = useState(false)                 // disables Apply button during modal open transition
  const applyingRef = useRef(false)   // debounce guard — prevents duplicate modal open

  // Application form state
  const [applicationForm, setApplicationForm] = useState<ApplicationFormData>({
    job_post: 0,
    student_full_name: '',
    student_department: '',
    student_academic_year: '',
    student_number: '',
    cover_letter: '',
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await publicJobApi.getActiveJobPosts()
      setJobs(response.data.job_posts)
      
      // Also fetch student's applications to check which jobs they've applied for
      try {
        const appsResponse = await jobApplicationApi.getMyApplications()
        setMyApplications(appsResponse.data.applications || [])
      } catch (appErr) {
        console.log('Could not fetch applications (user may not be logged in)')
        setMyApplications([])
      }
    } catch (err: any) {
      setError('Failed to fetch jobs. Please try again.')
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (job: JobPost, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (applyingRef.current) {
      console.log('[Ostim] duplicate prevented')
      return
    }
    applyingRef.current = true
    setOpeningModal(true)
    console.log('[Ostim] apply clicked')

    // Close detail popup before opening application modal
    setSelectedJob(null)
    console.log('[Ostim] detail closed')

    setApplyTarget(job)
    setApplicationForm(prev => ({ ...prev, job_post: job.id }))
    setShowApplicationModal(true)
    console.log('[Ostim] application modal open')
    console.log('[Ostim] modal z-index fixed')

    setTimeout(() => {
      applyingRef.current = false
      setOpeningModal(false)
    }, 500)
  }

  const closeApplicationModal = () => {
    setShowApplicationModal(false)
    setApplyTarget(null)
  }

  const hasAlreadyApplied = (jobId: number) => {
    return myApplications.some(app => app.job_post === jobId)
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplying(true)
    setError('')
    setSuccessMessage('')
    
    try {
      await jobApplicationApi.applyForJob(applicationForm)
      // Close modal and reset form on success
      closeApplicationModal()
      setApplicationForm({
        job_post: 0,
        student_full_name: '',
        student_department: '',
        student_academic_year: '',
        student_number: '',
        cover_letter: '',
      })
      setSuccessMessage('Application submitted successfully! The employer has been notified.')
      fetchJobs()
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err: any) {
      console.error('Application error:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to submit application'
      setError(errorMessage)
      // Keep modal open on error so user can retry
    } finally {
      setApplying(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

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
          className="mb-8 bg-theme-card backdrop-blur-xl border border-theme rounded-2xl p-8 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-theme-primary flex items-center">
                <Building className="w-8 h-8 mr-3 text-theme-accent-primary" />
                Ostim Jobs
              </h1>
              <p className="text-theme-muted mt-2">Discover job opportunities from Ostim Technical University</p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted" />
            <input
              type="text"
              placeholder="Search jobs by title, description, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-theme-card border border-theme rounded-xl text-theme-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-theme-card border border-theme rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Jobs</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400"
          >
            {successMessage}
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-accent-primary"></div>
          </div>
        ) : (
          /* Jobs Grid */
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
                    <h3 className="text-xl font-semibold text-theme-primary mb-2">{job.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-theme-muted">
                      <div className="flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{job.institution}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border ${getStatusColor(job.status)}`}>
                    {getStatusIcon(job.status)}
                    <span className="text-xs font-medium capitalize">{job.status}</span>
                  </div>
                </div>

                <p className="text-theme-secondary mb-4 line-clamp-3">{job.description}</p>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.required_skills.slice(0, 4).map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-2 py-1 bg-theme-accent-primary/10 text-theme-accent-primary text-xs rounded-lg border border-theme-accent-primary/20"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.required_skills.length > 4 && (
                      <span className="px-2 py-1 bg-theme-card-hover text-theme-muted text-xs rounded-lg">
                        +{job.required_skills.length - 4} more
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
                      <Briefcase className="w-4 h-4" />
                      <span>{job.applications_count} applications</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="p-2 text-theme-muted hover:text-theme-secondary hover:bg-theme-card-hover rounded-lg transition-all duration-200"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {job.status === 'active' && (
                      <>
                        {hasAlreadyApplied(job.id) ? (
                          <button
                            disabled
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-xl cursor-not-allowed opacity-75"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Applied</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleApply(job, e)}
                            disabled={openingModal}
                            className="flex items-center space-x-2 px-4 py-2 bg-theme-accent-primary hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                          >
                            <Send className="w-4 h-4" />
                            <span>Apply</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Jobs Found */}
        {!loading && filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-theme-primary mb-2">No jobs found</h3>
            <p className="text-theme-muted">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No jobs are currently available from Ostim'}
            </p>
          </div>
        )}
      </div>

      {/* Job Detail Modal — never renders simultaneously with application modal */}
      {selectedJob && !showApplicationModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[90]"
          onClick={() => setSelectedJob(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-theme-primary">{selectedJob.title}</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 text-theme-muted hover:text-theme-secondary hover:bg-theme-card-hover rounded-lg transition-all duration-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-theme-muted">Institution</span>
                  <p className="text-theme-primary">{selectedJob.institution}</p>
                </div>
                <div>
                  <span className="text-sm text-theme-muted">Department</span>
                  <p className="text-theme-primary">{selectedJob.department}</p>
                </div>
                <div>
                  <span className="text-sm text-theme-muted">Location</span>
                  <p className="text-theme-primary">{selectedJob.location}</p>
                </div>
                <div>
                  <span className="text-sm text-theme-muted">Deadline</span>
                  <p className="text-theme-primary">{new Date(selectedJob.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-theme-primary mb-2">Description</h4>
                <p className="text-theme-secondary">{selectedJob.description}</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-theme-primary mb-2">Required Skills</h4>
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

              <div className="flex items-center justify-between pt-4 border-t border-theme">
                <div className="flex items-center space-x-4 text-sm text-theme-muted">
                  <span>{selectedJob.number_of_students_needed} positions available</span>
                  <span>{selectedJob.applications_count} applications received</span>
                </div>
                {selectedJob.status === 'active' && (
                  <button
                    onClick={(e) => handleApply(selectedJob, e)}
                    disabled={openingModal}
                    className="flex items-center space-x-2 px-6 py-3 bg-theme-accent-primary hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    <Send className="w-4 h-4" />
                    <span>Apply Now</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Application Modal — sole active modal, solid panel, z-[100] */}
      {showApplicationModal && applyTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]"
          onClick={closeApplicationModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-950 opacity-100 rounded-2xl border border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Apply for {applyTarget.title}</h3>
              <button
                onClick={closeApplicationModal}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all duration-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={applicationForm.student_full_name}
                    onChange={(e) => setApplicationForm({...applicationForm, student_full_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Student Number *</label>
                  <input
                    type="text"
                    required
                    value={applicationForm.student_number}
                    onChange={(e) => setApplicationForm({...applicationForm, student_number: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your student number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Department *</label>
                  <input
                    type="text"
                    required
                    value={applicationForm.student_department}
                    onChange={(e) => setApplicationForm({...applicationForm, student_department: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your department"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Academic Year *</label>
                  <select
                    required
                    value={applicationForm.student_academic_year}
                    onChange={(e) => setApplicationForm({...applicationForm, student_academic_year: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Academic Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                    <option value="Master's">Master's</option>
                    <option value="PhD">PhD</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cover Letter</label>
                <textarea
                  value={applicationForm.cover_letter}
                  onChange={(e) => setApplicationForm({...applicationForm, cover_letter: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Tell us why you're interested in this position..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">CV File (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setApplicationForm({...applicationForm, cv_file: e.target.files?.[0]})}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeApplicationModal}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default OstimJobs
