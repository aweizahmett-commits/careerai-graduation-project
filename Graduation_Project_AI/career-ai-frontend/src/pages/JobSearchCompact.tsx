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
  Code,
  Users,
  TrendingUp,
  Calendar,
  Award,
  Target,
  Bookmark,
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

// Enhanced company logo mapping with more companies
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
  'David Untermann': 'https://ui-avatars.com/api/?name=David%20Untermann&background=0d1117&color=ffffff&size=64&bold=true'
}

const JobSearchCompact = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [jobs, setJobs] = useState<AggregatedJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  
  // Handle career match data from location state
  const [careerMatch, setCareerMatch] = useState<any>(null)
  const [isFromCareerMatch, setIsFromCareerMatch] = useState(false)
  
  // Filter states - REMOVED LOCATION FILTER
  const [showFilters, setShowFilters] = useState(false)
  const [showJobTitles, setShowJobTitles] = useState(false)
  const [showSkills, setShowSkills] = useState(false)
  const [showCompanies, setShowCompanies] = useState(false)
  const [showSalary, setShowSalary] = useState(false)
  
  // Selected filters - REMOVED LOCATION
  const [selectedJobTitle, setSelectedJobTitle] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedSalary, setSelectedSalary] = useState('')
  
  // Filter options
  const jobTitles = [
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

  // Initialize from location state (career match)
  useEffect(() => {
    if (location.state?.careerMatch) {
      const match = location.state.careerMatch
      setCareerMatch(match)
      setIsFromCareerMatch(true)
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
      console.log('Fetching jobs...')
      console.log('Search term:', search)
      
      // Build query parameters
      const params = new URLSearchParams()
      params.append('search', search)
      params.append('page_size', '30')
      
      // Add selected filters
      if (selectedJobTitle) params.append('job_role', selectedJobTitle)
      if (selectedSkill) params.append('skills', selectedSkill)
      if (selectedCompany) params.append('company', selectedCompany)
      if (selectedSalary) params.append('salary', selectedSalary)
      
      // Construct the API URL - use relative path for Vite proxy
      const apiUrl = `/api/jobs/jobs/?${params.toString()}`
      console.log('Fetching from URL:', apiUrl)
      console.log('Full URL will be:', `http://127.0.0.1:8000${apiUrl}`)
      console.log('Request params:', Object.fromEntries(params))
      
      // Make the API call
      console.log('Making fetch request to:', apiUrl)
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      })
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })

      console.log('Response received!')
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Response data:', data)
      
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
    
    // Title matching
    if (job.title.toLowerCase().includes(search.toLowerCase())) {
      score += 40
    }
    
    // Company matching
    if (job.company.toLowerCase().includes(search.toLowerCase())) {
      score += 30
    }
    
    // Description matching
    if (job.description.toLowerCase().includes(search.toLowerCase())) {
      score += 20
    }
    
    // Skills matching (simplified)
    const commonSkills = ['javascript', 'python', 'react', 'node.js', 'typescript']
    const jobDesc = job.description.toLowerCase()
    commonSkills.forEach(skill => {
      if (jobDesc.includes(skill)) score += 5
    })
    
    // Big company bonus
    const bigCompanies = ['google', 'amazon', 'microsoft', 'apple', 'meta', 'netflix', 'tesla']
    if (bigCompanies.some(company => company.toLowerCase() === job.company.toLowerCase())) {
      score += 15
    }
    
    return Math.min(score, 100)
  }

  // Check if job was posted recently (last 7 days)
  const isRecentlyPosted = (createdAt: string) => {
    const postedDate = new Date(createdAt)
    const daysSincePosted = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysSincePosted <= 7
  }

  // Clean and enhance job description
  const cleanDescription = (description: string): string => {
    if (!description) return 'No description available'
    
    // Remove HTML tags
    let clean = description.replace(/<[^>]*>/g, '')
    
    // Remove excessive whitespace
    clean = clean.replace(/\s+/g, ' ')
    
    // Remove special characters and clean up
    clean = clean.replace(/[\r\n\t]/g, ' ')
    clean = clean.replace(/&[a-zA-Z0-9#]+;/g, '')
    
    // Limit to reasonable length
    if (clean.length > 150) {
      clean = clean.substring(0, 150) + '...'
    }
    
    return clean.trim()
  }

  // Get source icon and color
  const getSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase()
    
    if (sourceLower.includes('linkedin')) {
      return { icon: <Linkedin className="w-3 h-3" />, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30' }
    }
    if (sourceLower.includes('indeed')) {
      return { icon: <Briefcase className="w-3 h-3" />, color: 'text-blue-300', bgColor: 'bg-blue-400/20', borderColor: 'border-blue-400/30' }
    }
    if (sourceLower.includes('glassdoor')) {
      return { icon: <Building className="w-3 h-3" />, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' }
    }
    if (sourceLower.includes('adzuna')) {
      return { icon: <Award className="w-3 h-3" />, color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30' }
    }
    if (sourceLower.includes('remotive')) {
      return { icon: <Globe className="w-3 h-3" />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/30' }
    }
    if (sourceLower.includes('arbeitnow')) {
      return { icon: <MapPin className="w-3 h-3" />, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30' }
    }
    if (sourceLower.includes('jsearch')) {
      return { icon: <Search className="w-3 h-3" />, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', borderColor: 'border-indigo-500/30' }
    }
    
    return { icon: <Globe className="w-3 h-3" />, color: 'text-slate-400', bgColor: 'bg-slate-700/50', borderColor: 'border-slate-600/50' }
  }

  // Format posted date
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

  // Get company logo with fallback
  const getCompanyLogo = (company: string): string => {
    return companyLogos[company] || `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=0d1117&color=ffffff&size=64&bold=true`
  }

  // Loading Skeleton Component - COMPACT VERSION
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-white mb-1">Loading Jobs</h2>
        <p className="text-slate-400 text-sm">Finding opportunities...</p>
      </div>
      
      {/* Compact Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 animate-pulse">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-slate-700 rounded-lg mr-2"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded mb-1 w-3/4"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-3 bg-slate-700 rounded mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      {/* Compact Header */}
      <div className="bg-theme-bg/80 backdrop-blur-sm border-b border-slate-800/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Job Search</h1>
            <div className="flex items-center gap-2">
              {isFromCareerMatch && careerMatch && (
                <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-500/30">
                  Career Match: {careerMatch.career_path}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Compact Search Bar */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2">
              <div className="flex items-center">
                <div className="flex items-center px-3">
                  <Search className="w-4 h-4 text-blue-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search jobs, skills, companies..."
                  className="flex-1 bg-transparent text-white placeholder-slate-400 px-2 py-2 focus:outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg mr-2 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-medium"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 flex items-center text-sm"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Compact Filter Panel - NO LOCATION FILTER */}
          {showFilters && (
            <div className="mt-3 p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">Filter Jobs</h3>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Job Role Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowJobTitles(!showJobTitles)}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 flex items-center justify-between text-sm ${
                      selectedJobTitle 
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                        : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium">
                      {selectedJobTitle || 'Job Role'}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showJobTitles ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showJobTitles && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {jobTitles.slice(0, 8).map((title) => (
                          <button
                            key={title}
                            type="button"
                            onClick={() => handleJobTitleSelect(title)}
                            className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors"
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
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 flex items-center justify-between text-sm ${
                      selectedSkill 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                        : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium">
                      {selectedSkill || 'Skills'}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showSkills ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showSkills && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {skills.slice(0, 8).map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillSelect(skill)}
                            className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors"
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
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 flex items-center justify-between text-sm ${
                      selectedCompany 
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                        : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium">
                      {selectedCompany || 'Company'}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showCompanies ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCompanies && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {companies.slice(0, 8).map((company) => (
                          <button
                            key={company}
                            type="button"
                            onClick={() => handleCompanySelect(company)}
                            className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors"
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
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 flex items-center justify-between text-sm ${
                      selectedSalary 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                        : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium">
                      {selectedSalary || 'Salary'}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showSalary ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showSalary && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-2xl z-50">
                      <div className="p-2 space-y-1">
                        {salaryRanges.map((salary) => (
                          <button
                            key={salary}
                            type="button"
                            onClick={() => handleSalarySelect(salary)}
                            className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white rounded transition-colors"
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
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-red-400 font-semibold mb-2">Unable to fetch jobs</h3>
            <p className="text-red-300 mb-4 text-sm">{error}</p>
            <button
              onClick={() => fetchJobs(searchTerm || 'Software Engineer')}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Fallback Message */}
        {fallbackMessage && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4 text-center">
            <p className="text-blue-300 text-sm">{fallbackMessage}</p>
          </div>
        )}

        {/* Compact Jobs Display */}
        {!loading && !error && jobs.length > 0 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-1">
                {fallbackMessage ? 'Similar Opportunities' : `${jobs.length} Jobs Found`}
              </h2>
              {searchTerm && (
                <p className="text-slate-400 text-sm">
                  {fallbackMessage ? `Related to "${searchTerm}"` : `for "${searchTerm}"`}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                    {/* Company Logo and Name - COMPACT */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 rounded-lg overflow-hidden mr-2 bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={getCompanyLogo(job.company)} 
                            alt={job.company}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=0d1117&color=ffffff&size=32&bold=true`
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm truncate">{job.company}</h3>
                          <div className="flex items-center text-slate-400 text-xs">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Match Score and Badges - COMPACT */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-green-400 mr-1" />
                          <span className="text-green-400 text-xs font-medium">
                            {calculateMatchScore(job, searchTerm)}%
                          </span>
                        </div>
                        
                        {isRecentlyPosted(job.created_at) && (
                          <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                            New
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Job Title - COMPACT */}
                    <h4 className="text-white font-semibold text-sm mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {job.title}
                    </h4>
                    
                    {/* Job Description - COMPACT */}
                    <p className="text-slate-300 mb-3 text-xs leading-relaxed line-clamp-2">
                      {cleanDescription(job.description)}
                    </p>
                    
                    {/* Job Details - COMPACT */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {job.salary && (
                        <div className="flex items-center px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {job.salary}
                        </div>
                      )}
                      {job.job_type && (
                        <div className="flex items-center px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {job.job_type}
                        </div>
                      )}
                      {job.remote_type === 'True' && (
                        <div className="flex items-center px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                          <Globe className="w-3 h-3 mr-1" />
                          Remote
                        </div>
                      )}
                    </div>
                    
                    {/* Footer - COMPACT */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Source Badge */}
                        <div className={`px-2 py-1 ${getSourceIcon(job.source).bgColor} ${getSourceIcon(job.source).borderColor} rounded-full border flex items-center`}>
                          <span className={`${getSourceIcon(job.source).color}`}>
                            {getSourceIcon(job.source).icon}
                          </span>
                        </div>
                        
                        {/* Posted Date */}
                        <span className="text-slate-400 text-xs">
                          {formatPostedDate(job.created_at)}
                        </span>
                      </div>
                      
                      {/* Apply Button - COMPACT */}
                      <button
                        onClick={() => handleApply(job.apply_url)}
                        className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center text-xs font-medium"
                      >
                        Apply
                        <ExternalLink className="w-3 h-3 ml-1" />
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
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
            <p className="text-slate-400 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                clearFilters()
                setSearchTerm('Software Engineer')
              }}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobSearchCompact
