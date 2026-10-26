import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
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
  Filter,
  X,
  Star,
  MapPin
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

// Enhanced company logo mapping
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
  'Twitter': 'https://logo.clearbit.com/twitter.com',
  'Instagram': 'https://logo.clearbit.com/instagram.com',
  'Snapchat': 'https://logo.clearbit.com/snapchat.com',
  'TikTok': 'https://logo.clearbit.com/tiktok.com',
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
  'David Untermann': 'https://ui-avatars.com/api/?name=David%20Untermann&background=0d1117&color=ffffff&size=32&bold=true'
}

const JobSearchUltraCompact = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [jobs, setJobs] = useState<AggregatedJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  
  // Filter states - NO LOCATION
  const [showFilters, setShowFilters] = useState(false)
  const [showJobTitles, setShowJobTitles] = useState(false)
  const [showSkills, setShowSkills] = useState(false)
  const [showCompanies, setShowCompanies] = useState(false)
  const [showSalary, setShowSalary] = useState(false)
  
  // Selected filters
  const [selectedJobTitle, setSelectedJobTitle] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedSalary, setSelectedSalary] = useState('')
  
  // Filter options - REDUCED
  const jobTitles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer', 'Full Stack Developer']
  const skills = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'Docker', 'AWS']
  const companies = ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Tesla', 'Spotify']
  const salaryRanges = ['$0-50k', '$50-75k', '$75-100k', '$100k+']

  // Initialize from location state
  useEffect(() => {
    if (location.state?.careerMatch) {
      const match = location.state.careerMatch
      setSearchTerm(match.recommended_role || match.career_path || '')
      fetchJobs(match.recommended_role || match.career_path || '')
    } else {
      fetchJobs('Software Engineer')
    }
  }, [])

  // Fetch jobs from API
  const fetchJobs = async (search: string) => {
    setLoading(true)
    setError(null)
    setFallbackMessage(null)
    
    try {
      const params = new URLSearchParams()
      params.append('search', search)
      params.append('page_size', '50') // More jobs per page for compact view
      
      if (selectedJobTitle) params.append('job_role', selectedJobTitle)
      if (selectedSkill) params.append('skills', selectedSkill)
      if (selectedCompany) params.append('company', selectedCompany)
      if (selectedSalary) params.append('salary', selectedSalary)
      
      const apiUrl = `/api/jobs/jobs/?${params.toString()}`
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.results) {
        setJobs(data.results)
        if (data.fallback) {
          setFallbackMessage(data.message || 'Showing similar opportunities')
        }
      } else {
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      fetchJobs(searchTerm)
    }
  }

  // Filter handlers
  const handleJobTitleSelect = (title: string) => {
    setSelectedJobTitle(title === selectedJobTitle ? '' : title)
    setShowJobTitles(false)
  }

  const handleSkillSelect = (skill: string) => {
    setSelectedSkill(skill === selectedSkill ? '' : skill)
    setShowSkills(false)
  }

  const handleCompanySelect = (company: string) => {
    setSelectedCompany(company === selectedCompany ? '' : company)
    setShowCompanies(false)
  }

  const handleSalarySelect = (salary: string) => {
    setSelectedSalary(salary === selectedSalary ? '' : salary)
    setShowSalary(false)
  }

  // Apply filters
  const applyFilters = () => {
    fetchJobs(searchTerm || 'Software Engineer')
    setShowFilters(false)
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedJobTitle('')
    setSelectedSkill('')
    setSelectedCompany('')
    setSelectedSalary('')
    setShowFilters(false)
    fetchJobs(searchTerm || 'Software Engineer')
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

  // Clean description - ULTRA COMPACT
  const cleanDescription = (description: string): string => {
    if (!description) return 'No description'
    
    let clean = description.replace(/<[^>]*>/g, '')
    clean = clean.replace(/\s+/g, ' ')
    clean = clean.replace(/[\r\n\t]/g, ' ')
    clean = clean.replace(/&[a-zA-Z0-9#]+;/g, '')
    
    // Ultra short description
    if (clean.length > 80) {
      clean = clean.substring(0, 80) + '...'
    }
    
    return clean.trim()
  }

  // Get source icon
  const getSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase()
    
    if (sourceLower.includes('linkedin')) return { icon: <Linkedin className="w-3 h-3" />, color: 'text-blue-400' }
    if (sourceLower.includes('indeed')) return { icon: <Briefcase className="w-3 h-3" />, color: 'text-blue-300' }
    if (sourceLower.includes('glassdoor')) return { icon: <Building className="w-3 h-3" />, color: 'text-green-400' }
    if (sourceLower.includes('remotive')) return { icon: <Globe className="w-3 h-3" />, color: 'text-emerald-400' }
    if (sourceLower.includes('arbeitnow')) return { icon: <MapPin className="w-3 h-3" />, color: 'text-orange-400' }
    if (sourceLower.includes('jsearch')) return { icon: <Search className="w-3 h-3" />, color: 'text-indigo-400' }
    
    return { icon: <Globe className="w-3 h-3" />, color: 'text-slate-400' }
  }

  // Format posted date - ULTRA COMPACT
  const formatPostedDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return '1d'
      if (diffDays < 7) return `${diffDays}d`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`
      return `${Math.floor(diffDays / 30)}m`
    } catch {
      return 'New'
    }
  }

  // Get company logo
  const getCompanyLogo = (company: string): string => {
    return companyLogos[company] || `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=0d1117&color=ffffff&size=24&bold=true`
  }

  // Ultra Compact Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-2">
      <div className="text-center mb-2">
        <h2 className="text-sm font-bold text-white mb-1">Loading Jobs</h2>
      </div>
      
      {/* Ultra Compact Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {[...Array(10)].map((_, index) => (
          <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-slate-700/50 animate-pulse">
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 bg-slate-700 rounded mr-1"></div>
              <div className="flex-1">
                <div className="h-3 bg-slate-700 rounded mb-1 w-3/4"></div>
                <div className="h-2 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-2 bg-slate-700 rounded mb-1"></div>
            <div className="h-2 bg-slate-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      {/* Ultra Compact Header */}
      <div className="bg-theme-bg/80 backdrop-blur-sm border-b border-slate-800/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-white">Jobs</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-2">
        {/* Ultra Compact Search Bar */}
        <form onSubmit={handleSearch} className="mb-3">
          <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-1.5">
            <div className="flex items-center">
              <div className="flex items-center px-2">
                <Search className="w-3 h-3 text-blue-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search jobs..."
                className="flex-1 bg-transparent text-white placeholder-slate-400 px-1 py-1 focus:outline-none text-xs"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded mr-1 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 text-xs"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Go'}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-2 py-1 bg-slate-700/50 text-white rounded hover:bg-slate-700 transition-all duration-200 text-xs"
              >
                <Filter className="w-3 h-3" />
              </button>
            </div>
          </div>
        </form>

        {/* Ultra Compact Filter Panel */}
        {showFilters && (
          <div className="mb-3 p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-xs">Filters</h3>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              {/* Job Role Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowJobTitles(!showJobTitles)}
                  className={`w-full px-2 py-1 rounded border transition-all duration-200 flex items-center justify-between text-xs ${
                    selectedJobTitle 
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">
                    {selectedJobTitle || 'Role'}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showJobTitles ? 'rotate-180' : ''} flex-shrink-0`} />
                </button>
                
                {showJobTitles && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded shadow-2xl z-50 max-h-32 overflow-y-auto">
                    <div className="p-1 space-y-1">
                      {jobTitles.map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => handleJobTitleSelect(title)}
                          className="w-full text-left px-1 py-0.5 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors truncate"
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
                  className={`w-full px-2 py-1 rounded border transition-all duration-200 flex items-center justify-between text-xs ${
                    selectedSkill 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">
                    {selectedSkill || 'Skills'}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSkills ? 'rotate-180' : ''} flex-shrink-0`} />
                </button>
                
                {showSkills && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded shadow-2xl z-50 max-h-32 overflow-y-auto">
                    <div className="p-1 space-y-1">
                      {skills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillSelect(skill)}
                          className="w-full text-left px-1 py-0.5 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors truncate"
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
                <button
                  type="button"
                  onClick={() => setShowCompanies(!showCompanies)}
                  className={`w-full px-2 py-1 rounded border transition-all duration-200 flex items-center justify-between text-xs ${
                    selectedCompany 
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">
                    {selectedCompany || 'Company'}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showCompanies ? 'rotate-180' : ''} flex-shrink-0`} />
                </button>
                
                {showCompanies && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded shadow-2xl z-50 max-h-32 overflow-y-auto">
                    <div className="p-1 space-y-1">
                      {companies.map((company) => (
                        <button
                          key={company}
                          type="button"
                          onClick={() => handleCompanySelect(company)}
                          className="w-full text-left px-1 py-0.5 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors truncate"
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
                  className={`w-full px-2 py-1 rounded border transition-all duration-200 flex items-center justify-between text-xs ${
                    selectedSalary 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">
                    {selectedSalary || 'Salary'}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSalary ? 'rotate-180' : ''} flex-shrink-0`} />
                </button>
                
                {showSalary && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded shadow-2xl z-50">
                    <div className="p-1 space-y-1">
                      {salaryRanges.map((salary) => (
                        <button
                          key={salary}
                          type="button"
                          onClick={() => handleSalarySelect(salary)}
                          className="w-full text-left px-1 py-0.5 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors truncate"
                        >
                          {salary}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors text-xs font-medium"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-xs"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="text-red-400 font-semibold mb-1 text-sm">Error</h3>
            <p className="text-red-300 mb-3 text-xs">{error}</p>
            <button
              onClick={() => fetchJobs(searchTerm || 'Software Engineer')}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Fallback Message */}
        {fallbackMessage && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mb-3 text-center">
            <p className="text-blue-300 text-xs">{fallbackMessage}</p>
          </div>
        )}

        {/* Ultra Compact Jobs Display */}
        {!loading && !error && jobs.length > 0 && (
          <div className="space-y-3">
            <div className="text-center mb-3">
              <h2 className="text-sm font-bold text-white mb-1">
                {jobs.length} Jobs
              </h2>
              {searchTerm && (
                <p className="text-slate-400 text-xs">
                  for "{searchTerm}"
                </p>
              )}
            </div>
            
            {/* ULTRA COMPACT GRID - 5 columns on large screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group"
                >
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                    {/* Company Logo and Name - ULTRA COMPACT */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-5 h-5 rounded overflow-hidden mr-1 bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={getCompanyLogo(job.company)} 
                            alt={job.company}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=0d1117&color=ffffff&size=20&bold=true`
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-xs truncate">{job.company}</h3>
                          <div className="flex items-center text-slate-400 text-xs">
                            <MapPin className="w-2 h-2 mr-0.5 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Match Score - ULTRA COMPACT */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center">
                          <Star className="w-2 h-2 text-green-400 mr-0.5" />
                          <span className="text-green-400 text-xs font-medium">
                            {calculateMatchScore(job, searchTerm)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Job Title - ULTRA COMPACT */}
                    <h4 className="text-white font-medium text-xs mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {job.title}
                    </h4>
                    
                    {/* Job Description - ULTRA COMPACT */}
                    <p className="text-slate-300 mb-2 text-xs leading-relaxed line-clamp-1">
                      {cleanDescription(job.description)}
                    </p>
                    
                    {/* Job Details - ULTRA COMPACT */}
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      {job.salary && (
                        <div className="flex items-center px-1 py-0.5 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                          <DollarSign className="w-2 h-2 mr-0.5" />
                          {job.salary.length > 10 ? job.salary.substring(0, 10) + '...' : job.salary}
                        </div>
                      )}
                      {job.remote_type === 'True' && (
                        <div className="flex items-center px-1 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30">
                          <Globe className="w-2 h-2 mr-0.5" />
                          Remote
                        </div>
                      )}
                    </div>
                    
                    {/* Footer - ULTRA COMPACT */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {/* Source Badge */}
                        <div className={`px-1 py-0.5 ${getSourceIcon(job.source).color} rounded border border-slate-600/50`}>
                          {getSourceIcon(job.source).icon}
                        </div>
                        
                        {/* Posted Date */}
                        <span className="text-slate-400 text-xs">
                          {formatPostedDate(job.created_at)}
                        </span>
                      </div>
                      
                      {/* Apply Button - ULTRA COMPACT */}
                      <button
                        onClick={() => handleApply(job.apply_url)}
                        className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center text-xs font-medium"
                      >
                        Apply
                        <ExternalLink className="w-2 h-2 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No Jobs State */}
        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No jobs found</h3>
            <p className="text-slate-400 mb-4 text-xs">Try adjusting your search</p>
            <button
              onClick={() => {
                clearFilters()
                setSearchTerm('Software Engineer')
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors text-xs"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobSearchUltraCompact
