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
  TrendingUp,
  Calendar,
  Award,
  Target,
  Bookmark,
  Filter,
  X
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

// Company logo mapping
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
}

const JobSearchProduction = () => {
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
  
  // Filter states
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
  const [selectedLocation, setSelectedLocation] = useState('')
  
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
  
  const locations = [
    'Remote', 'New York', 'San Francisco', 'London', 'Berlin', 'Paris', 'Tokyo',
    'Toronto', 'Sydney', 'Amsterdam', 'Barcelona', 'Singapore', 'Dubai', 'Hong Kong'
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
  
  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location)
    setShowLocation(false)
  }
  
  const handleSalarySelect = (salary: string) => {
    setSelectedSalary(salary)
    setShowSalary(false)
  }
  
  const clearAllFilters = () => {
    setSelectedJobTitle('')
    setSelectedSkill('')
    setSelectedCompany('')
    setSelectedLocation('')
    setSelectedSalary('')
    setSearchTerm('')
  }

  // Production-ready API function to fetch jobs from backend
  const fetchJobs = async (keyword: string = '') => {
    console.log('Starting fetchJobs with keyword:', keyword)
    
    setLoading(true)
    setError(null)
    setJobs([])
    setFallbackMessage(null)
    
    try {
      // Build URL with proper URLSearchParams
      const params = new URLSearchParams()
      
      // Add search term
      if (keyword.trim()) {
        params.append('search', keyword.trim())
      }
      
      // Add filters
      if (selectedJobTitle.trim()) {
        params.append('job_role', selectedJobTitle.trim())
      }
      
      if (selectedCompany.trim()) {
        params.append('company', selectedCompany.trim())
      }
      
      if (selectedLocation.trim()) {
        params.append('location', selectedLocation.trim())
      }
      
      if (selectedSkill.trim()) {
        params.append('skills', selectedSkill.trim())
      }
      
      // Add pagination
      params.append('page_size', '30')
      
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
      console.log('API Response data:', data)
      
      // Check for API error response
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Validate response data - ensure results array exists
      if (!data.results || !Array.isArray(data.results)) {
        console.error('Invalid response format:', data)
        throw new Error('Invalid response format from server - missing results array')
      }
      
      // Set jobs from the results array
      setJobs(data.results)
      console.log(`Successfully fetched ${data.results.length} jobs`)
      
      // Check for fallback message
      if (data.fallback && data.message) {
        setFallbackMessage(data.message)
        console.log('Fallback mode:', data.message)
        console.log('Fallback type:', data.fallback_type)
      }
      
      // Log debug info if available
      if (data.debug_info) {
        console.log('Debug info:', data.debug_info)
      }
      
      // Log first few jobs for debugging
      if (data.results.length > 0) {
        console.log('First job:', data.results[0])
      }
      
    } catch (err) {
      console.error('Error fetching jobs:', err)
      console.error('Error type:', err.constructor.name)
      console.error('Error message:', err.message)
      
      let errorMessage = 'Failed to fetch jobs'
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.'
        } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Network error - unable to connect to server. Please check if the backend is running on http://127.0.0.1:8000'
        } else if (err.message.includes('CORS')) {
          errorMessage = 'CORS error - please check backend CORS configuration'
        } else if (err.message.includes('404')) {
          errorMessage = 'API endpoint not found - please check the URL'
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error - please try again later'
        } else {
          errorMessage = err.message
        }
      }
      
      console.error('Final error message:', errorMessage)
      setError(errorMessage)
      setJobs([])
    } finally {
      setLoading(false)
      console.log('fetchJobs completed, loading set to false')
    }
  }

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const searchQuery = searchTerm || selectedJobTitle || selectedSkill || 'Software Engineer'
    
    console.log('Search submitted with query:', searchQuery)
    
    if (searchQuery.trim()) {
      fetchJobs(searchQuery.trim())
    }
  }

  // Handle job application
  const handleApply = (applyUrl: string) => {
    console.log('Applying to job:', applyUrl)
    if (applyUrl && applyUrl !== '#') {
      window.open(applyUrl, '_blank', 'noopener,noreferrer')
    } else {
      console.warn('Invalid apply URL:', applyUrl)
    }
  }

  // Get company logo URL
  const getCompanyLogo = (companyName: string): string => {
    // First try exact match
    if (companyLogos[companyName]) {
      return companyLogos[companyName]
    }
    
    // Try to find partial match
    const companyLower = companyName.toLowerCase()
    for (const [key, url] of Object.entries(companyLogos)) {
      if (companyLower.includes(key.toLowerCase()) || key.toLowerCase().includes(companyLower)) {
        return url
      }
    }
    
    // Fallback to generic company logo
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=0d1117&color=ffffff&size=64&bold=true`
  }

  // Calculate match score based on search relevance
  const calculateMatchScore = (job: AggregatedJob, searchTerm: string) => {
    if (!searchTerm) return 85 // Default score for no search
    
    const searchTerms = searchTerm.toLowerCase().split(' ')
    const title = job.title.toLowerCase()
    const description = job.description.toLowerCase()
    const company = job.company.toLowerCase()
    
    let score = 0
    
    // Title matches are most important
    searchTerms.forEach(term => {
      if (title.includes(term)) score += 30
      if (description.includes(term)) score += 15
      if (company.includes(term)) score += 10
    })
    
    // Boost for recent jobs
    const postedDate = new Date(job.created_at)
    const daysSincePosted = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSincePosted <= 7) score += 10
    
    // Boost for big companies
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
    if (clean.length > 300) {
      clean = clean.substring(0, 300) + '...'
    }
    
    return clean.trim()
  }

  // Get source icon and color
  const getSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase()
    
    if (sourceLower.includes('linkedin')) {
      return { icon: <Linkedin className="w-4 h-4" />, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30' }
    }
    if (sourceLower.includes('indeed')) {
      return { icon: <Briefcase className="w-4 h-4" />, color: 'text-blue-300', bgColor: 'bg-blue-400/20', borderColor: 'border-blue-400/30' }
    }
    if (sourceLower.includes('glassdoor')) {
      return { icon: <Building className="w-4 h-4" />, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' }
    }
    if (sourceLower.includes('adzuna')) {
      return { icon: <Award className="w-4 h-4" />, color: 'text-theme-accent-secondary', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30' }
    }
    if (sourceLower.includes('remotive')) {
      return { icon: <Globe className="w-4 h-4" />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/30' }
    }
    if (sourceLower.includes('arbeitnow')) {
      return { icon: <MapPin className="w-4 h-4" />, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30' }
    }
    if (sourceLower.includes('jsearch')) {
      return { icon: <Search className="w-4 h-4" />, color: 'text-theme-accent-primary', bgColor: 'bg-theme-accent-primary/20', borderColor: 'border-theme-accent-primary/30' }
    }
    
    return { icon: <Globe className="w-4 h-4" />, color: 'text-theme-muted', bgColor: 'bg-theme-card-hover', borderColor: 'border-theme/50' }
  }

  // Format posted date
  const formatPostedDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return '1 day ago'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return `${Math.floor(diffDays / 30)} months ago`
    } catch {
      return 'Recently'
    }
  }

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-theme-primary mb-2">Loading Opportunities</h2>
        <p className="text-theme-muted">Finding the best matches for you...</p>
      </div>
      
      {/* Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-theme-card backdrop-blur-sm rounded-2xl p-6 border border-theme/50 animate-pulse">
            {/* Skeleton Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 bg-theme-card-hover rounded-lg mb-2 w-3/4"></div>
                <div className="h-4 bg-theme-card-hover rounded-lg w-1/2"></div>
              </div>
              <div className="w-10 h-10 bg-theme-card-hover rounded-lg"></div>
            </div>
            
            {/* Skeleton Location */}
            <div className="flex items-center mb-4">
              <div className="w-4 h-4 bg-theme-card-hover rounded mr-2"></div>
              <div className="h-4 bg-theme-card-hover rounded-lg w-1/3"></div>
            </div>
            
            {/* Skeleton Description */}
            <div className="mb-4">
              <div className="h-3 bg-theme-card-hover rounded-lg mb-2"></div>
              <div className="h-3 bg-theme-card-hover rounded-lg mb-2"></div>
              <div className="h-3 bg-theme-card-hover rounded-lg w-2/3"></div>
            </div>
            
            {/* Skeleton Tags */}
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-theme-card-hover rounded-full w-16"></div>
              <div className="h-6 bg-theme-card-hover rounded-full w-20"></div>
              <div className="h-6 bg-theme-card-hover rounded-full w-14"></div>
            </div>
            
            {/* Skeleton Button */}
            <div className="h-10 bg-theme-card-hover rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header Section */}
      <div className="bg-theme-card/30 backdrop-blur-md border-b border-theme/30">
        <div className="px-8 py-12">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-theme-primary mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Find Your Perfect Job
            </h1>
                      </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-xl"></div>
              <div className="relative bg-theme-card backdrop-blur-sm border border-theme/50 rounded-3xl p-3">
                <div className="flex items-center">
                  <div className="flex items-center px-6">
                    <Search className="w-7 h-7 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for jobs, skills, or companies..."
                    className="flex-1 bg-transparent text-theme-primary placeholder-theme-muted px-2 py-5 focus:outline-none text-xl"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-5 bg-gradient-to-r from-blue-500 to-theme-accent-secondary text-white rounded-2xl mr-3 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-6 py-5 bg-theme-card-hover text-white rounded-2xl hover:bg-theme-card-hover transition-all duration-200 flex items-center"
                  >
                    <Filter className="w-5 h-5 mr-2" />
                    Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-6 p-6 bg-theme-card backdrop-blur-sm border border-theme/50 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-theme-primary font-semibold">Filter Jobs</h3>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="text-theme-muted hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Job Role Filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowJobTitles(!showJobTitles)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        selectedJobTitle 
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                          : 'bg-theme-card-hover border-theme/50 text-theme-secondary hover:bg-theme-card-hover'
                      }`}
                    >
                      <span className="font-medium">
                        {selectedJobTitle || 'Job Role'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showJobTitles ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showJobTitles && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-theme-card/95 backdrop-blur-sm border border-theme/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        <div className="p-3 space-y-1">
                          {jobTitles.slice(0, 10).map((title) => (
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
                          : 'bg-theme-card-hover border-theme/50 text-theme-secondary hover:bg-theme-card-hover'
                      }`}
                    >
                      <span className="font-medium">
                        {selectedSkill || 'Skills'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showSkills ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showSkills && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-theme-card/95 backdrop-blur-sm border border-theme/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        <div className="p-3 space-y-1">
                          {skills.slice(0, 10).map((skill) => (
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

                  {/* Company Filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCompanies(!showCompanies)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        selectedCompany 
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                          : 'bg-theme-card-hover border-theme/50 text-theme-secondary hover:bg-theme-card-hover'
                      }`}
                    >
                      <span className="font-medium">
                        {selectedCompany || 'Company'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCompanies ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCompanies && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-theme-card/95 backdrop-blur-sm border border-theme/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        <div className="p-3 space-y-1">
                          {companies.slice(0, 10).map((company) => (
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

                  {/* Location Filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSelectedLocation(!selectedLocation)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        selectedLocation 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                          : 'bg-theme-card-hover border-theme/50 text-theme-secondary hover:bg-theme-card-hover'
                      }`}
                    >
                      <span className="font-medium">
                        {selectedLocation || 'Location'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${selectedLocation ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {selectedLocation && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-theme-card/95 backdrop-blur-sm border border-theme/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                        <div className="p-3 space-y-1">
                          {locations.map((location) => (
                            <button
                              key={location}
                              type="button"
                              onClick={() => handleLocationSelect(location)}
                              className="w-full text-left px-3 py-2 text-sm text-theme-secondary hover:bg-theme-card-hover hover:text-white rounded-lg transition-colors"
                            >
                              {location}
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
                          ? 'bg-green-500/20 border-green-500 text-green-300' 
                          : 'bg-theme-card-hover border-theme/50 text-theme-secondary hover:bg-theme-card-hover'
                      }`}
                    >
                      <span className="font-medium">
                        {selectedSalary || 'Salary Range'}
                      </span>
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

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="w-full px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl hover:bg-red-500/30 transition-all duration-200"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Loading State */}
          {loading && <LoadingSkeleton />}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-red-400 font-semibold mb-2 text-lg">Unable to fetch jobs</h3>
              <p className="text-red-300 mb-6">{error}</p>
              <button
                onClick={() => fetchJobs(searchTerm || 'Software Engineer')}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Fallback Message */}
          {fallbackMessage && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6 text-center">
              <p className="text-blue-300">{fallbackMessage}</p>
            </div>
          )}

          {/* Jobs Display */}
          {!loading && !error && jobs.length > 0 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-theme-primary mb-2">
                  {fallbackMessage ? 'Similar Opportunities' : `${jobs.length} Jobs Found`}
                </h2>
                {searchTerm && (
                  <p className="text-theme-muted text-lg">
                    {fallbackMessage ? `Related to "${searchTerm}"` : `for "${searchTerm}"`}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="bg-theme-card backdrop-blur-sm border border-theme/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                      {/* Company Logo and Name */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center flex-1">
                          <div className="w-12 h-12 rounded-xl overflow-hidden mr-3 bg-theme-card-hover flex items-center justify-center">
                            <img 
                              src={getCompanyLogo(job.company)} 
                              alt={job.company}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=0d1117&color=ffffff&size=48&bold=true`
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-theme-primary font-semibold text-lg">{job.company}</h3>
                          <div className="flex items-center text-theme-muted text-sm">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location}
                            </div>
                          </div>
                        </div>
                        
                        {/* Match Score and Recently Posted Badge */}
                        <div className="flex flex-col items-end gap-2">
                          {/* Match Score */}
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            <span className="text-green-400 text-sm font-medium">
                              {calculateMatchScore(job, searchTerm)}% match
                            </span>
                          </div>
                          
                          {/* Recently Posted Badge */}
                          {isRecentlyPosted(job.created_at) && (
                            <div className="flex items-center px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1"></span>
                              Posted recently
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Job Title */}
                      <h4 className="text-xl font-bold text-theme-primary mb-3 group-hover:text-blue-400 transition-colors">
                        {job.title}
                      </h4>
                      
                      {/* Job Description */}
                      <p className="text-theme-secondary mb-4 line-clamp-3 text-sm leading-relaxed">
                        {cleanDescription(job.description)}
                      </p>
                      
                      {/* Job Details */}
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        {job.salary && (
                          <div className="flex items-center text-emerald-400 text-xs bg-emerald-400/10 px-3 py-1 rounded-full">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {job.salary}
                          </div>
                        )}
                        
                        <div className={`flex items-center text-xs px-3 py-1 rounded-full border ${getSourceIcon(job.source).bgColor} ${getSourceIcon(job.source).color} ${getSourceIcon(job.source).borderColor}`}>
                          {getSourceIcon(job.source).icon}
                          <span className="ml-1 font-medium">{job.source}</span>
                        </div>
                        
                        <div className="flex items-center text-theme-primary0 text-xs bg-theme-card-hover px-3 py-1 rounded-full">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatPostedDate(job.created_at)}
                        </div>
                      </div>
                      
                      {/* Job Type Badge */}
                      {job.job_type && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-4">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {job.job_type.replace('_', ' ')}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApply(job.apply_url)}
                          disabled={!job.apply_url || job.apply_url === '#'}
                          className={`flex-1 px-4 py-2 rounded-xl transition-all duration-200 flex items-center justify-center text-sm font-medium ${
                            job.apply_url && job.apply_url !== '#'
                              ? 'bg-gradient-to-r from-blue-500 to-theme-accent-secondary text-white hover:from-blue-600 hover:to-purple-700'
                              : 'bg-theme-card-hover text-theme-primary0 cursor-not-allowed'
                          }`}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Apply Now
                        </button>
                        
                        <button
                          className="px-3 py-2 bg-theme-card-hover text-theme-secondary rounded-xl hover:bg-theme-card-hover transition-all duration-200"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Always show jobs - fallback to random jobs if no results */}
          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
                <p className="text-blue-300">Showing popular opportunities</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobSearchProduction
