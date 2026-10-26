import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock,
  DollarSign,
  Building,
  ExternalLink,
  Loader2,
  AlertCircle,
  Linkedin,
  Globe
} from 'lucide-react'

interface RealJob {
  title: string
  company: string
  location: string
  salary: string
  apply_link: string
  description: string
  source: string
  logo: string
  job_type?: string
  posted_date?: number
  is_remote?: boolean
}

const JobSearch = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [jobs, setJobs] = useState<RealJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Handle career match data from location state
  const [careerMatch, setCareerMatch] = useState<any>(null)
  const [isFromCareerMatch, setIsFromCareerMatch] = useState(false)

  // Check if coming from career matches and set initial search
  useEffect(() => {
    if (location.state?.careerMatch) {
      setCareerMatch(location.state.careerMatch)
      setIsFromCareerMatch(true)
      
      // Use career match as initial search term
      const matchTitle = location.state.careerMatch.title || location.state.careerMatch.career || 'Software Engineer'
      setSearchTerm(matchTitle)
      
      // Auto-search for jobs matching the career recommendation
      fetchJobs(matchTitle)
    } else if (location.state?.skills) {
      // Use skills from resume analysis as search term
      const skills = location.state.skills
      const mainSkill = skills[0] || 'Software Developer'
      setSearchTerm(mainSkill)
      fetchJobs(mainSkill)
    } else {
      // Default search
      fetchJobs('Software Engineer')
    }
  }, [location.state])

  // API function to fetch jobs from backend
  const fetchJobs = async (keyword: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`http://127.0.0.1:8000/api/jobs/search/?keyword=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setJobs(data.results || [])
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      fetchJobs(searchTerm.trim())
    }
  }

  // Handle job application
  const handleApply = (applyLink: string) => {
    if (applyLink && applyLink !== '#') {
      window.open(applyLink, '_blank', 'noopener,noreferrer')
    }
  }

  // Get source icon
  const getSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase()
    if (sourceLower.includes('linkedin')) return <Linkedin className="w-4 h-4" />
    return <Globe className="w-4 h-4" />
  }

  // Format posted date
  const formatPostedDate = (timestamp?: number) => {
    if (!timestamp) return 'Recently'
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <div className="min-h-screen bg-theme-bg p-4 lg:p-8">
      {/* Career Match Header */}
      {isFromCareerMatch && careerMatch && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto mb-8 p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Real Jobs for {careerMatch.title || careerMatch.career}
              </h2>
              <p className="text-indigo-200">
                Based on your career assessment, we found real job opportunities matching your profile
              </p>
            </div>
            <button
              onClick={() => navigate('/recommendations')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Back to Career Matches
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Real Job Search
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            Find and apply to real jobs from LinkedIn, Glassdoor, and other job boards
          </p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 focus-within:border-indigo-500 transition-colors">
              <Search className="w-5 h-5 text-slate-400 ml-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for job titles, skills, or companies..."
                className="flex-1 bg-transparent text-white placeholder-slate-400 px-4 py-3 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-r-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mr-3" />
            <span className="text-slate-300">Finding real jobs...</span>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto"
        >
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-red-400 font-semibold mb-2">Unable to fetch jobs</h3>
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => fetchJobs(searchTerm || 'Software Engineer')}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      )}

      {/* Jobs Grid */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-7xl mx-auto"
        >
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No jobs found</h3>
              <p className="text-slate-400">
                Try searching with different keywords or check back later for new opportunities.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Found {jobs.length} Real Jobs
                </h2>
                {searchTerm && (
                  <p className="text-slate-400">
                    for "{searchTerm}"
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden group"
                  >
                    {/* Job Card Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {job.logo ? (
                              <img 
                                src={job.logo} 
                                alt={job.company}
                                className="w-8 h-8 rounded-lg mr-3 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3 flex items-center justify-center">
                                <Building className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {job.title}
                              </h3>
                              <p className="text-slate-400 text-sm">{job.company}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Source Badge */}
                        <div className="flex items-center text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-lg">
                          {getSourceIcon(job.source)}
                          <span className="ml-1">{job.source}</span>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-slate-300 text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                          {job.location}
                        </div>
                        
                        {job.salary && job.salary !== 'Not specified' && (
                          <div className="flex items-center text-slate-300 text-sm">
                            <DollarSign className="w-4 h-4 mr-2 text-slate-500" />
                            {job.salary}
                          </div>
                        )}

                        {job.job_type && (
                          <div className="flex items-center text-slate-300 text-sm">
                            <Briefcase className="w-4 h-4 mr-2 text-slate-500" />
                            {job.job_type}
                          </div>
                        )}

                        {job.posted_date && (
                          <div className="flex items-center text-slate-300 text-sm">
                            <Clock className="w-4 h-4 mr-2 text-slate-500" />
                            {formatPostedDate(job.posted_date)}
                          </div>
                        )}
                      </div>

                      {/* Job Description */}
                      <div className="mb-4">
                        <p className="text-slate-400 text-sm line-clamp-3">
                          {job.description}
                        </p>
                      </div>

                      {/* Remote Badge */}
                      {job.is_remote && (
                        <div className="mb-4">
                          <span className="inline-flex items-center px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg">
                            Remote Available
                          </span>
                        </div>
                      )}

                      {/* Apply Button */}
                      <button
                        onClick={() => handleApply(job.apply_link)}
                        disabled={!job.apply_link || job.apply_link === '#'}
                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                      >
                        <ExternalLink className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                        Apply Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default JobSearch
