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
  Globe,
  ChevronDown,
  Code,
  Users,
  TrendingUp
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
  
  // Dropdown states
  const [showJobTitles, setShowJobTitles] = useState(false)
  const [showSkills, setShowSkills] = useState(false)
  const [showCompanies, setShowCompanies] = useState(false)
  const [showSalary, setShowSalary] = useState(false)
  
  // Selected filters
  const [selectedJobTitle, setSelectedJobTitle] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedSalary, setSelectedSalary] = useState('')
  
  // Predefined options
  const jobTitles = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Mobile Developer', 'DevOps Engineer', 'Data Scientist', 'Machine Learning Engineer',
    'Product Manager', 'UX Designer', 'UI Designer', 'QA Engineer', 'Security Engineer',
    'Cloud Engineer', 'Database Administrator', 'Network Engineer', 'Systems Engineer',
    'AI Engineer', 'Blockchain Developer', 'Game Developer', 'Web Developer'
  ]
  
  const skills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript', 'Angular', 'Vue.js',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'MongoDB', 'PostgreSQL',
    'MySQL', 'Redis', 'GraphQL', 'REST API', 'Git', 'CI/CD', 'Agile', 'Scrum',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Analysis',
    'Statistics', 'R', 'SQL', 'NoSQL', 'Microservices', 'Serverless', 'Testing'
  ]
  
  const companies = [
    'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Tesla', 'Spotify',
    'Uber', 'Airbnb', 'LinkedIn', 'Twitter', 'Instagram', 'Snapchat', 'TikTok',
    'Adobe', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'NVIDIA', 'AMD', 'Cisco',
    'HP', 'Dell', 'Samsung', 'Sony', 'Nintendo', 'Epic Games', 'Unity', 'Roblox'
  ]
  
  const salaryRanges = [
    '$50k-70k', '$70k-90k', '$90k-110k', '$110k-130k', '$130k-150k',
    '$150k-170k', '$170k-190k', '$190k-210k', '$210k-250k', '$250k+'
  ]

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

  // Helper functions for dropdown selections
  const handleJobTitleSelect = (title: string) => {
    setSelectedJobTitle(title)
    setSearchTerm(title)
    setShowJobTitles(false)
  }
  
  const handleSkillSelect = (skill: string) => {
    setSelectedSkill(skill)
    setSearchTerm(skill)
    setShowSkills(false)
  }
  
  const handleCompanySelect = (company: string) => {
    setSelectedCompany(company)
    setShowCompanies(false)
  }
  
  const handleSalarySelect = (salary: string) => {
    setSelectedSalary(salary)
    setShowSalary(false)
  }
  
  const clearAllFilters = () => {
    setSelectedJobTitle('')
    setSelectedSkill('')
    setSelectedCompany('')
    setSelectedSalary('')
    setSearchTerm('')
  }
  
  const buildSearchQuery = () => {
    const parts = []
    if (selectedJobTitle) parts.push(selectedJobTitle)
    if (selectedSkill) parts.push(selectedSkill)
    if (selectedCompany) parts.push(selectedCompany)
    if (selectedSalary) parts.push(selectedSalary)
    if (searchTerm && !selectedJobTitle && !selectedSkill) parts.push(searchTerm)
    return parts.join(' ') || 'Software Engineer'
  }

  // Check server connection before making requests
  const checkServerConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/health/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000) // 2 second timeout
      })
      return response.ok
    } catch (error) {
      console.error('Server connection check failed:', error)
      return false
    }
  }

  // API function to fetch jobs from backend with retry mechanism
  const fetchJobs = async (keyword: string, retryCount = 0) => {
    setLoading(true)
    setError(null)
    
    const maxRetries = 3
    const retryDelay = 1000 // 1 second between retries
    
    // Clear optimistic jobs first
    setJobs([])
    
    try {
      // First check if server is available
      const isServerAvailable = await checkServerConnection()
      if (!isServerAvailable && retryCount === 0) {
        throw new Error('Server is not responding. Please check your connection.')
      }
      
      // Add timeout for ultra-fast UX
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout
      
      const response = await fetch(`http://127.0.0.1:8000/api/search/?keyword=${encodeURIComponent(keyword)}&page_size=30`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Validate response data
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from server')
      }
      
      setJobs(data.results)
      
    } catch (err) {
      console.error(`Error fetching jobs (attempt ${retryCount + 1}):`, err)
      
      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const backoffDelay = retryDelay * Math.pow(2, retryCount) // Exponential backoff
        console.log(`Retrying job search in ${backoffDelay}ms... (${retryCount + 1}/${maxRetries})`)
        setTimeout(() => {
          fetchJobs(keyword, retryCount + 1)
        }, backoffDelay)
        return // Don't set loading to false yet
      }
      
      // Final attempt failed - show error
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
      }
      setJobs([])
    } finally {
      if (retryCount >= maxRetries) {
        setLoading(false)
      }
    }
  }

  // Handle search submission with optimistic UI
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const searchQuery = buildSearchQuery()
    
    if (searchQuery.trim()) {
      // Show instant loading state
      setLoading(true)
      setError(null)
      
      // Fetch real results immediately (no optimistic UI for better experience)
      fetchJobs(searchQuery.trim())
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
    <div className="min-h-screen bg-transparent p-4 lg:p-8">
      {/* Career Match Header */}
      {isFromCareerMatch && careerMatch && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto mb-8 p-6 bg-gradient-to-r from-theme-accent-primary/10 to-theme-accent-secondary/10 rounded-xl border border-theme-accent-primary/20"
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
          <h1 className="text-3xl lg:text-4xl font-bold text-theme-primary mb-4">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Real Job Search
            </span>
          </h1>
          <p className="text-theme-muted text-lg">
            Find and apply to real jobs from LinkedIn, Glassdoor, and other job boards
          </p>
        </div>

        {/* Modern Search Interface */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-5xl mx-auto"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Main Search Bar */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-theme-accent-primary via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              <div className="relative bg-theme-card backdrop-blur-sm border border-theme/50 rounded-2xl p-1">
                <div className="flex items-center">
                  <div className="flex items-center px-4 py-3">
                    <Search className="w-5 h-5 text-theme-accent-primary" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for your dream job..."
                    className="flex-1 bg-transparent text-white placeholder-slate-400 px-2 py-3 focus:outline-none text-lg"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary text-white rounded-xl mr-1 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Job Titles Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowJobTitles(!showJobTitles)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                    selectedJobTitle 
                      ? 'bg-theme-accent-primary/20 border-theme-accent-primary text-indigo-300' 
                      : 'bg-theme-card border-theme/50 text-theme-secondary hover:bg-theme-card-hover hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    <span className="font-medium">
                      {selectedJobTitle || 'Job Role'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showJobTitles ? 'rotate-180' : ''}`} />
                </button>
                
                {showJobTitles && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-theme-card/95 backdrop-blur-sm border border-theme/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-3 space-y-1">
                      {jobTitles.slice(0, 12).map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => handleJobTitleSelect(title)}
                          className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-card-hover hover:text-white rounded-lg transition-colors"
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Skills Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSkills(!showSkills)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                    selectedSkill 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                      : 'bg-theme-card border-theme/50 text-theme-secondary hover:bg-theme-card-hover hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    <span className="font-medium">
                      {selectedSkill || 'Skills'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSkills ? 'rotate-180' : ''}`} />
                </button>
                
                {showSkills && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-theme-card/95 backdrop-blur-sm border border-theme/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-3 space-y-1">
                      {skills.slice(0, 12).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillSelect(skill)}
                          className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-card-hover hover:text-white rounded-lg transition-colors"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Companies Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCompanies(!showCompanies)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                    selectedCompany 
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                      : 'bg-theme-card border-theme/50 text-theme-secondary hover:bg-theme-card-hover hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    <span className="font-medium">
                      {selectedCompany || 'Company'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCompanies ? 'rotate-180' : ''}`} />
                </button>
                
                {showCompanies && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-theme-card/95 backdrop-blur-sm border border-theme/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-3 space-y-1">
                      {companies.slice(0, 12).map((company) => (
                        <button
                          key={company}
                          type="button"
                          onClick={() => handleCompanySelect(company)}
                          className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-card-hover hover:text-white rounded-lg transition-colors"
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
                <button
                  type="button"
                  onClick={() => setShowSalary(!showSalary)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                    selectedSalary 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                      : 'bg-theme-card border-theme/50 text-theme-secondary hover:bg-theme-card-hover hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span className="font-medium">
                      {selectedSalary || 'Salary Range'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSalary ? 'rotate-180' : ''}`} />
                </button>
                
                {showSalary && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-theme-card/95 backdrop-blur-sm border border-theme/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-3 space-y-1">
                      {salaryRanges.map((salary) => (
                        <button
                          key={salary}
                          type="button"
                          onClick={() => handleSalarySelect(salary)}
                          className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-card-hover hover:text-white rounded-lg transition-colors"
                        >
                          {salary}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {(selectedJobTitle || selectedSkill || selectedCompany || selectedSalary) && (
              <div className="flex flex-wrap items-center gap-3 p-4 bg-theme-card/30 rounded-xl border border-theme/30">
                <span className="text-theme-muted text-sm font-medium">Active Filters:</span>
                {selectedJobTitle && (
                  <span className="inline-flex items-center px-3 py-1 bg-theme-accent-primary/20 text-indigo-300 text-sm rounded-full border border-theme-accent-primary/30">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {selectedJobTitle}
                    <button
                      type="button"
                      onClick={() => setSelectedJobTitle('')}
                      className="ml-2 text-theme-accent-primary hover:text-indigo-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedSkill && (
                  <span className="inline-flex items-center px-3 py-1 bg-emerald-500/20 text-emerald-300 text-sm rounded-full border border-emerald-500/30">
                    <Code className="w-3 h-3 mr-1" />
                    {selectedSkill}
                    <button
                      type="button"
                      onClick={() => setSelectedSkill('')}
                      className="ml-2 text-emerald-400 hover:text-emerald-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCompany && (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30">
                    <Building className="w-3 h-3 mr-1" />
                    {selectedCompany}
                    <button
                      type="button"
                      onClick={() => setSelectedCompany('')}
                      className="ml-2 text-blue-400 hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedSalary && (
                  <span className="inline-flex items-center px-3 py-1 bg-amber-500/20 text-amber-300 text-sm rounded-full border border-amber-500/30">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {selectedSalary}
                    <button
                      type="button"
                      onClick={() => setSelectedSalary('')}
                      className="ml-2 text-amber-400 hover:text-amber-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-theme-muted hover:text-white text-sm font-medium transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
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
            <Loader2 className="w-8 h-8 text-theme-accent-primary animate-spin mr-3" />
            <span className="text-theme-secondary">Finding real jobs...</span>
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
              <h3 className="text-xl font-semibold text-theme-secondary mb-2">No jobs found</h3>
              <p className="text-theme-muted">
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
                  <p className="text-theme-muted">
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
                    className="bg-theme-card rounded-xl border border-theme hover:border-theme-accent-primary/50 transition-all duration-300 overflow-hidden group"
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
                              <div className="w-8 h-8 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary rounded-lg mr-3 flex items-center justify-center">
                                <Building className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-white group-hover:text-theme-accent-primary transition-colors line-clamp-1">
                                {job.title}
                              </h3>
                              <p className="text-theme-muted text-sm">{job.company}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Source Badge */}
                        <div className="flex items-center text-xs text-theme-primary0 bg-theme-card-hover px-2 py-1 rounded-lg">
                          {getSourceIcon(job.source)}
                          <span className="ml-1">{job.source}</span>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-theme-secondary text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-theme-primary0" />
                          {job.location}
                        </div>
                        
                        {job.salary && job.salary !== 'Not specified' && (
                          <div className="flex items-center text-theme-secondary text-sm">
                            <DollarSign className="w-4 h-4 mr-2 text-theme-primary0" />
                            {job.salary}
                          </div>
                        )}

                        {job.job_type && (
                          <div className="flex items-center text-theme-secondary text-sm">
                            <Briefcase className="w-4 h-4 mr-2 text-theme-primary0" />
                            {job.job_type}
                          </div>
                        )}

                        {job.posted_date && (
                          <div className="flex items-center text-theme-secondary text-sm">
                            <Clock className="w-4 h-4 mr-2 text-theme-primary0" />
                            {formatPostedDate(job.posted_date)}
                          </div>
                        )}
                      </div>

                      {/* Job Description */}
                      <div className="mb-4">
                        <p className="text-theme-muted text-sm line-clamp-3">
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
                        className="w-full py-3 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
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
