import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Clock, 
  Star, 
  MapPin, 
  Briefcase, 
  Loader2, 
  DollarSign, 
  AlertCircle,
  ExternalLink,
  Building,
  Users,
  TrendingUp
} from 'lucide-react'

// Define the job interface
interface AggregatedJob {
  id: number
  title: string
  company: string
  location: string
  description: string
  salary: string
  apply_url: string
  source: string
  external_id: string
  job_type: string
  remote_type: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Company logo mapping - Enhanced with more companies
const companyLogos: { [key: string]: string } = {
  'Google': 'https://logo.clearbit.com/google.com',
  'Microsoft': 'https://logo.clearbit.com/microsoft.com',
  'Amazon': 'https://logo.clearbit.com/amazon.com',
  'Apple': 'https://logo.clearbit.com/apple.com',
  'Meta': 'https://logo.clearbit.com/meta.com',
  'Netflix': 'https://logo.clearbit.com/netflix.com',
  'Tesla': 'https://logo.clearbit.com/tesla.com',
  'Spotify': 'https://logo.clearbit.com/spotify.com',
  'Uber': 'https://logo.clearbit.com/uber.com',
  'Airbnb': 'https://logo.clearbit.com/airbnb.com',
  'LinkedIn': 'https://logo.clearbit.com/linkedin.com',
  'Adobe': 'https://logo.clearbit.com/adobe.com',
  'Salesforce': 'https://logo.clearbit.com/salesforce.com',
  'Oracle': 'https://logo.clearbit.com/oracle.com',
  'IBM': 'https://logo.clearbit.com/ibm.com',
  'Intel': 'https://logo.clearbit.com/intel.com',
  'NVIDIA': 'https://logo.clearbit.com/nvidia.com',
  'AMD': 'https://logo.clearbit.com/amd.com',
  'Cisco': 'https://logo.clearbit.com/cisco.com',
  'HP': 'https://logo.clearbit.com/hp.com',
  'Dell': 'https://logo.clearbit.com/dell.com',
  'Samsung': 'https://logo.clearbit.com/samsung.com',
  'Sony': 'https://logo.clearbit.com/sony.com',
  'Bolt': 'https://logo.clearbit.com/bolt.eu',
  'Matera GmbH': 'https://logo.clearbit.com/matera.de',
  'smartkündigen OHG': 'https://logo.clearbit.com/smartkuendigen.de',
  'David Untermann': 'https://ui-avatars.com/api/?name=David%20Untermann&background=0d1117&color=ffffff&size=32&bold=true',
  'K-tronik GmbH': 'https://ui-avatars.com/api/?name=K-tronik&background=2563eb&color=ffffff&size=64&bold=true',
  'K-tronik': 'https://ui-avatars.com/api/?name=K-tronik&background=2563eb&color=ffffff&size=64&bold=true'
}

const JobSearchModern = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [allJobs, setAllJobs] = useState<AggregatedJob[]>([])
  const [displayedJobs, setDisplayedJobs] = useState<AggregatedJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [selectedJobRole, setSelectedJobRole] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedSalary, setSelectedSalary] = useState('')
  
  // Dropdown states
  const [showJobRoleDropdown, setShowJobRoleDropdown] = useState(false)
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [showSalaryDropdown, setShowSalaryDropdown] = useState(false)
  
  // Filter options
  const jobRoles = [
    'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
    'DevOps Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
    'Machine Learning Engineer', 'Data Analyst', 'Marketing Manager', 'Sales Manager'
  ]
  
  const skills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'Go',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis'
  ]
  
  const companies = [
    'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Tesla',
    'Spotify', 'Uber', 'Airbnb', 'Adobe', 'Salesforce', 'Oracle', 'IBM'
  ]
  
  const salaryRanges = [
    '$0-50k', '$50-75k', '$75-100k', '$100-150k', '$150k+'
  ]

  // Initialize from location state
  useEffect(() => {
    fetchJobs("/api/jobs/jobs/?page_size=6")
  }, [])

  // Safe fetch function without AbortSignal
  const fetchJobs = async (url: string) => {
    setLoading(true)
    setError(null)

    try {
      console.log("Fetching:", url)

      const response = await fetch(url)

      console.log("Status:", response.status)

      const data = await response.json()

      const jobs = data.results || data || []

      setAllJobs(jobs)
      setDisplayedJobs(jobs)
      setHasMore(jobs.length >= 6)

    } catch (error) {
      console.error("Error:", error)
      setError("Failed to fetch jobs")
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      fetchJobs(`/api/jobs/jobs/?search=${searchTerm}&page_size=100`)
    }
  }

  // Load more jobs
  const loadMoreJobs = () => {
    const nextPage = currentPage + 1
    const startIndex = (nextPage - 1) * 6
    const nextJobs = allJobs.slice(startIndex, startIndex + 6)
    
    if (nextJobs.length > 0) {
      setDisplayedJobs([...displayedJobs, ...nextJobs])
      setCurrentPage(nextPage)
      setHasMore(nextJobs.length === 6)
    } else {
      setHasMore(false)
    }
  }

  // Filter handlers
  const handleJobRoleSelect = (jobRole: string) => {
    setSelectedJobRole(jobRole === selectedJobRole ? '' : jobRole)
    setShowJobRoleDropdown(false)
  }

  const handleSkillSelect = (skill: string) => {
    setSelectedSkill(skill === selectedSkill ? '' : skill)
    setShowSkillDropdown(false)
  }

  const handleCompanySelect = (company: string) => {
    setSelectedCompany(company === selectedCompany ? '' : company)
    setShowCompanyDropdown(false)
  }

  const handleSalarySelect = (salary: string) => {
    setSelectedSalary(salary === selectedSalary ? '' : salary)
    setShowSalaryDropdown(false)
  }

  // Apply filters
  const applyFilters = () => {
    if (hasSearched || searchTerm) {
      const searchQuery = searchTerm || 'Software Engineer'
      const params = new URLSearchParams()
      params.append('search', searchQuery)
      params.append('page_size', '100')
      
      if (selectedJobRole) params.append('job_role', selectedJobRole)
      if (selectedSkill) params.append('skills', selectedSkill)
      if (selectedCompany) params.append('company', selectedCompany)
      if (selectedSalary) params.append('salary', selectedSalary)
      
      fetchJobs(`/api/jobs/jobs/?${params.toString()}`)
    } else {
      fetchJobs("/api/jobs/jobs/?page_size=6")
    }
    setShowFilters(false)
  }

  // Reset all filters
  const resetFilters = () => {
    setSelectedJobRole('')
    setSelectedSkill('')
    setSelectedCompany('')
    setSelectedSalary('')
    setShowFilters(false)
    
    if (hasSearched || searchTerm) {
      const searchQuery = searchTerm || 'Software Engineer'
      fetchJobs(`/api/jobs/jobs/?search=${searchQuery}&page_size=100`)
    } else {
      fetchJobs("/api/jobs/jobs/?page_size=6")
    }
  }

  // Handle apply to job
  const handleApply = (url: string) => {
    window.open(url, '_blank')
  }

  // Calculate match score
  const calculateMatchScore = (job: AggregatedJob, search: string): number => {
    let score = 0
    
    if (job.title.toLowerCase().includes(search.toLowerCase())) score += 40
    if (job.company.toLowerCase().includes(search.toLowerCase())) score += 30
    if (job.description.toLowerCase().includes(search.toLowerCase())) score += 20
    
    const bigCompanies = ['google', 'amazon', 'microsoft', 'apple', 'meta', 'netflix', 'tesla']
    if (bigCompanies.some(company => company.toLowerCase() === job.company.toLowerCase())) {
      score += 15
    }
    
    return Math.min(score, 100)
  }

  // Get company logo
  const getCompanyLogo = (company: string): string => {
    return companyLogos[company] || `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=2563eb&color=ffffff&size=64&bold=true`
  }

  // Clean and minimize description
  const cleanDescription = (description: string): string => {
    if (!description) return ''
    
    let clean = description.replace(/<[^>]*>/g, '')
    clean = clean.replace(/\s+/g, ' ')
    clean = clean.replace(/[\r\n\t]/g, ' ')
    clean = clean.replace(/&[a-zA-Z0-9#]+;/g, '')
    
    // Very short description for compact view (50 chars max)
    if (clean.length > 50) {
      clean = clean.substring(0, 50) + '...'
    }
    
    return clean.trim()
  }

  // Shorten job title
  const shortenTitle = (title: string): string => {
    if (!title) return ''
    if (title.length > 40) {
      return title.substring(0, 40) + '...'
    }
    return title
  }

  // Format salary
  const formatSalary = (salary: string): string => {
    if (!salary) return 'Salary not specified'
    if (salary.length > 20) return salary.substring(0, 20) + '...'
    return salary
  }

  // Format posted date
  const formatPostedDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return '1d ago'
      if (diffDays < 7) return `${diffDays}d ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
      return `${Math.floor(diffDays / 30)}m ago`
    } catch {
      return 'Recently'
    }
  }

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-white mb-2">Loading Jobs</h2>
        <p className="text-slate-400 text-sm">Finding the best opportunities for you...</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 animate-pulse">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-slate-700 rounded-xl mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-3 bg-slate-700 rounded mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-2/3 mb-3"></div>
            <div className="h-8 bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      {/* Header */}
      <div className="bg-theme-bg/80 backdrop-blur-sm border-b border-slate-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Job Search</h1>
            <div className="flex items-center gap-2">
              {!hasSearched && displayedJobs.length > 0 && (
                <span className="text-sm text-slate-400">Showing {displayedJobs.length} jobs</span>
              )}
              {hasSearched && (
                <span className="text-sm text-slate-400">{displayedJobs.length} results</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl"></div>
                <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-3">
                  <div className="flex items-center">
                    <div className="flex items-center px-4">
                      <Search className="w-5 h-5 text-blue-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for jobs, skills, or companies..."
                      className="flex-1 bg-transparent text-white placeholder-slate-400 px-2 py-3 focus:outline-none text-lg"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl mr-3 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Search'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-4 py-3 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 flex items-center"
                    >
                      <Filter className="w-5 h-5 mr-2" />
                      Filters
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-lg">Filters</h3>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Job Role Filter */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Job Role</label>
                    <button
                      type="button"
                      onClick={() => setShowJobRoleDropdown(!showJobRoleDropdown)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        selectedJobRole 
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                          : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-medium">
                        {selectedJobRole || 'Select Job Role'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showJobRoleDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showJobRoleDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        <div className="p-3 space-y-1">
                          {jobRoles.map((jobRole) => (
                            <button
                              key={jobRole}
                              type="button"
                              onClick={() => handleJobRoleSelect(jobRole)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors"
                            >
                              {jobRole}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Skill Filter */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Skill</label>
                    <button
                      type="button"
                      onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        selectedSkill 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                          : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-medium">
                        {selectedSkill || 'Select Skill'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showSkillDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showSkillDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        <div className="p-3 space-y-1">
                          {skills.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleSkillSelect(skill)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors"
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Company Filter */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                    <button
                      type="button"
                      onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        selectedCompany 
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                          : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-medium">
                        {selectedCompany || 'Select Company'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCompanyDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        <div className="p-3 space-y-1">
                          {companies.map((company) => (
                            <button
                              key={company}
                              type="button"
                              onClick={() => handleCompanySelect(company)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors"
                            >
                              {company}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Salary Filter */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Salary</label>
                    <button
                      type="button"
                      onClick={() => setShowSalaryDropdown(!showSalaryDropdown)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        selectedSalary 
                          ? 'bg-green-500/20 border-green-500 text-green-300' 
                          : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-medium">
                        {selectedSalary || 'Select Salary'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showSalaryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showSalaryDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        <div className="p-3 space-y-1">
                          {salaryRanges.map((salary) => (
                            <button
                              key={salary}
                              type="button"
                              onClick={() => handleSalarySelect(salary)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors"
                            >
                              {salary}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold"
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-all duration-200 font-semibold"
                  >
                    Reset
                  </button>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && <LoadingSkeleton />}

            {/* Error State */}
            {!loading && error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-red-400 font-semibold mb-2 text-lg">Unable to fetch jobs</h3>
                <p className="text-red-300 mb-6">{error}</p>
                <button
                  onClick={() => hasSearched ? fetchJobs(searchTerm || 'Software Engineer') : fetchInitialJobs()}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors font-semibold"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Jobs Display */}
            {!loading && !error && displayedJobs.length > 0 && (
              <div className="space-y-6">
                                
                {/* Job Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {displayedJobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                        {/* Company Logo and Basic Info */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center flex-1">
                            <div className="w-8 h-8 rounded-lg overflow-hidden mr-2 bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <img 
                                src={getCompanyLogo(job.company)} 
                                alt={job.company}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=2563eb&color=ffffff&size=32&bold=true`
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold text-xs truncate">{job.company}</h3>
                            </div>
                          </div>
                          
                          {/* Match Score */}
                          <div className="flex flex-col items-end">
                            <div className="flex items-center">
                              <Star className="w-2 h-2 text-green-400 mr-1" />
                              <span className="text-green-400 font-semibold text-xs">
                                {calculateMatchScore(job, searchTerm)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Job Title */}
                        <h4 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                          {shortenTitle(job.title)}
                        </h4>
                        
                        {/* Short Description */}
                        <div className="text-slate-300 text-xs mb-2 line-clamp-1">
                          {cleanDescription(job.description)}
                        </div>
                        
                        {/* Salary Info */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-xs text-slate-400">
                            <DollarSign className="w-2 h-2 mr-1" />
                            <span className="truncate">{formatSalary(job.salary)}</span>
                          </div>
                          <div className="flex items-center text-xs text-slate-400">
                            <Clock className="w-2 h-2 mr-1" />
                            {formatPostedDate(job.created_at)}
                          </div>
                        </div>
                        
                        {/* Apply Button - Minimized */}
                        <button
                          onClick={() => handleApply(job.apply_url)}
                          className="w-full px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-all duration-200 flex items-center justify-center font-semibold text-xs"
                        >
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Load More Button */}
                {!hasSearched && hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMoreJobs}
                      className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold text-lg"
                    >
                      Load More Jobs
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* No Jobs State */}
            {!loading && !error && displayedJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-24 h-24 text-slate-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-white mb-3">No jobs found</h3>
                <p className="text-slate-400 mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    resetFilters()
                    setSearchTerm('')
                    setHasSearched(false)
                    fetchInitialJobs()
                  }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-semibold"
                >
                  Reset Search
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Stats and Info */}
          <div className="lg:w-80">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sticky top-24">
              <h3 className="text-white font-semibold text-lg mb-4">Job Search Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Briefcase className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="text-slate-300">Total Jobs</span>
                  </div>
                  <span className="text-white font-semibold">{allJobs.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-slate-300">Companies</span>
                  </div>
                  <span className="text-white font-semibold">
                    {new Set(allJobs.map(job => job.company)).size}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-slate-300">Locations</span>
                  </div>
                  <span className="text-white font-semibold">
                    {new Set(allJobs.map(job => job.location)).size}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400 mr-2" />
                    <span className="text-slate-300">Avg Match</span>
                  </div>
                  <span className="text-white font-semibold">
                    {allJobs.length > 0 
                      ? Math.round(allJobs.reduce((acc, job) => acc + calculateMatchScore(job, searchTerm || ''), 0) / allJobs.length)
                      : 0}%
                  </span>
                </div>
              </div>
              
              {/* Quick Tips */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <h4 className="text-white font-semibold mb-3">Quick Tips</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">·</span>
                    Use specific keywords for better results
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">·</span>
                    Filter by location to find local jobs
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">·</span>
                    Set match threshold to focus on relevant jobs
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobSearchModern
