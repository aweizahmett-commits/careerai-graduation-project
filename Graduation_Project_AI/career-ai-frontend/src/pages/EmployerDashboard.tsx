import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { 
  Briefcase, 
  Users, 
  User, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Building,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  LogOut
} from 'lucide-react'
import { employerJobApi } from '../services/api'

interface JobPost {
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
  applications_count: number
}

interface JobApplication {
  id: number
  job_post: number
  student_full_name: string
  student_department: string
  student_academic_year: string
  student_number: string
  cover_letter: string
  resume_file?: string
  applied_at: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
}

const EmployerDashboard = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'profile' | 'jobs' | 'applicants'>('jobs')
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch jobs and applications on component mount
  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs()
    } else if (activeTab === 'applicants') {
      fetchApplications()
    }
  }, [activeTab])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await employerJobApi.getMyJobs()
      setJobs(response.data.jobs as JobPost[])
    } catch (err: any) {
      console.error('Error fetching jobs:', err)
      setError('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await employerJobApi.getJobApplications()
      setApplications(response.data.applications as JobApplication[])
    } catch (err: any) {
      console.error('Error fetching applications:', err)
      setError('Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)

  // Create job form state
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    required_skills: '',
    number_of_students_needed: 1,
    department: '',
    location: '',
    deadline: ''
  })

  const handleApplicationStatusUpdate = (applicationId: number, newStatus: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus as any }
          : app
      )
    )
  }

  const handleCreateJob = async () => {
    try {
      const jobData = {
        title: newJob.title,
        description: newJob.description,
        required_skills: newJob.required_skills.split(',').map(skill => skill.trim()).filter(skill => skill.trim()),
        number_of_students_needed: newJob.number_of_students_needed,
        department: newJob.department,
        location: newJob.location,
        deadline: newJob.deadline,
      }
      
      const response = await employerJobApi.createJob(jobData)
      setJobs(prev => [response.data as JobPost, ...prev])
      
      // Reset form
      setNewJob({
        title: '',
        description: '',
        required_skills: '',
        number_of_students_needed: 1,
        department: '',
        location: '',
        deadline: ''
      })
      setShowCreateJobModal(false)
    } catch (error: any) {
      console.error('Error creating job:', error)
      setError('Failed to create job. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'accepted':
        return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'closed':
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'draft':
      case 'withdrawn':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'closed':
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 min-h-screen border-r border-slate-700">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-theme-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Employer Portal</h2>
                <p className="text-xs text-slate-400">Job Provider Dashboard</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-indigo-600 text-theme-primary'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'jobs'
                    ? 'bg-indigo-600 text-theme-primary'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span className="font-medium">Jobs Offered</span>
              </button>

              <button
                onClick={() => setActiveTab('applicants')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'applicants'
                    ? 'bg-indigo-600 text-theme-primary'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Applicants</span>
                <span className="ml-auto bg-indigo-500 text-theme-primary text-xs px-2 py-1 rounded-full">
                  {applications.filter(a => a.status === 'pending').length}
                </span>
              </button>
            </nav>

            {/* Logout Button */}
            <div className="mt-auto pt-8 border-t border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/20"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">
                  {activeTab === 'profile' && 'Profile'}
                  {activeTab === 'jobs' && 'Jobs Offered'}
                  {activeTab === 'applicants' && 'Student Applications'}
                </h1>
                <p className="text-slate-400 mt-1">
                  {activeTab === 'profile' && 'Manage your professional information'}
                  {activeTab === 'jobs' && 'Create and manage your job postings'}
                  {activeTab === 'applicants' && 'Review and manage student applications'}
                </p>
              </div>

              {activeTab === 'jobs' && (
                <button
                  onClick={() => setShowCreateJobModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-theme-primary font-medium rounded-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Job</span>
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-slate-100 mb-6">Professional Information</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                      <input
                        type="text"
                        defaultValue="Prof. Dr. John Smith"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue="john.smith@ostim.edu.tr"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Institution</label>
                      <input
                        type="text"
                        defaultValue="Ostim Technical University"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        defaultValue="+90 312 123 4567"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Professional Description</label>
                    <textarea
                      defaultValue="Professor of Computer Science with 15 years of experience in machine learning and artificial intelligence research."
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-theme-primary font-medium rounded-xl transition-all duration-200">
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Search and Filter */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 transition-all duration-200">
                    <Filter className="w-5 h-5" />
                    <span>Filter</span>
                  </button>
                </div>

                {/* Job Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {jobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * job.id }}
                      className="bg-slate-800 rounded-2xl border border-slate-700 p-6 hover:border-indigo-500/50 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-100 mb-2">{job.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
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

                      <p className="text-slate-300 mb-4 line-clamp-2">{job.description}</p>

                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {job.required_skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-lg border border-indigo-500/20"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.required_skills.length > 3 && (
                            <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-lg">
                              +{job.required_skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{job.number_of_students_needed} needed</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{job.applications_count} applications</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-all duration-200">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Applicants Tab */}
            {activeTab === 'applicants' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Applications Table */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-theme-bg border-b border-slate-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Academic Year
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            CV
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {applications.map((application) => (
                          <tr key={application.id} className="hover:bg-slate-700/50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-slate-100">
                                  {application.student_full_name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {application.student_number}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                              {application.student_department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                              {application.student_academic_year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                              {application.resume_file ? (
                                <a
                                  href={`http://localhost:8000${application.resume_file}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 underline flex items-center space-x-1"
                                >
                                  <span>View CV</span>
                                </a>
                              ) : (
                                <span className="text-slate-500">No CV uploaded</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border ${getStatusColor(application.status)}`}>
                                {getStatusIcon(application.status)}
                                <span className="text-xs font-medium capitalize">{application.status}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setSelectedApplication(application)}
                                  className="p-1 text-slate-400 hover:text-slate-300 hover:bg-slate-600 rounded transition-all duration-200"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {application.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApplicationStatusUpdate(application.id, 'accepted')}
                                      className="p-1 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-all duration-200"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleApplicationStatusUpdate(application.id, 'rejected')}
                                      className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all duration-200"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedApplication(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-100">Application Details</h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-all duration-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Student Information</h4>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-400">Name:</span>
                      <p className="text-slate-100">{selectedApplication.student_full_name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Student Number:</span>
                      <p className="text-slate-100">{selectedApplication.student_number}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Department:</span>
                      <p className="text-slate-100">{selectedApplication.student_department}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Academic Year:</span>
                      <p className="text-slate-100">{selectedApplication.student_academic_year}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Cover Letter</h4>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-100">{selectedApplication.cover_letter}</p>
                </div>
              </div>

              {selectedApplication.status === 'pending' && (
                <div className="flex items-center space-x-4 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => {
                      handleApplicationStatusUpdate(selectedApplication.id, 'accepted')
                      setSelectedApplication(null)
                    }}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-theme-primary font-medium rounded-xl transition-all duration-200"
                  >
                    Accept Application
                  </button>
                  <button
                    onClick={() => {
                      handleApplicationStatusUpdate(selectedApplication.id, 'rejected')
                      setSelectedApplication(null)
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-theme-primary font-medium rounded-xl transition-all duration-200"
                  >
                    Reject Application
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Create Job Modal */}
      {showCreateJobModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateJobModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-100">Create New Job Posting</h3>
              <button
                onClick={() => setShowCreateJobModal(false)}
                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-all duration-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Job Title</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Research Assistant - AI/ML"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Job Description</label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Department</label>
                  <input
                    type="text"
                    value={newJob.department}
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Computer Science"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Number of Students Needed</label>
                  <input
                    type="number"
                    min="1"
                    value={newJob.number_of_students_needed}
                    onChange={(e) => setNewJob({ ...newJob, number_of_students_needed: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Job Administrator</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Name of the job administrator"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Application Deadline</label>
                  <input
                    type="date"
                    value={newJob.deadline}
                    onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Required Skills</label>
                <input
                  type="text"
                  value={newJob.required_skills}
                  onChange={(e) => setNewJob({ ...newJob, required_skills: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Python, Machine Learning, Data Analysis (comma-separated)"
                  required
                />
              </div>

              <div className="flex items-center space-x-4 pt-4 border-t border-slate-700">
                <button
                  onClick={() => setShowCreateJobModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-theme-primary font-medium rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateJob}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-theme-primary font-medium rounded-xl transition-all duration-200"
                >
                  Create Job
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default EmployerDashboard
