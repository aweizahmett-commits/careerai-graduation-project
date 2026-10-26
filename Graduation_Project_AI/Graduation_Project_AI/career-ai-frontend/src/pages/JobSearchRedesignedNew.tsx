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
  Target
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

const JobSearchRedesignedNew = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [jobs, setJobs] = useState<AggregatedJob[]>([])
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

  // Production-ready API function to fetch jobs from backend
  const fetchJobs = async (keyword: string) => {
    console.log('Starting fetchJobs with keyword:', keyword)
    
    setLoading(true)
    setError(null)
    setJobs([])
    
    try {
      // Construct the API URL
      const apiUrl = `http://127.0.0.1:8000/api/jobs/jobs/?search=${encodeURIComponent(keyword)}&page_size=30`
      console.log('Fetching from URL:', apiUrl)
      
      // Make the API call
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      console.log('Response status:', response.status)

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
      
    } catch (err) {
      console.error('Error fetching jobs:', err)
      
      let errorMessage = 'Failed to fetch jobs'
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.'
        } else {
          errorMessage = err.message
        }
      }
      
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
    const searchQuery = buildSearchQuery()
    
    console.log('Search submitted with query:', searchQuery)
    
    if (searchQuery.trim()) {
      fetchJobs(searchQuery.trim())
    }
  }

  // Get source icon
  const getSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase()
    if (sourceLower.includes('linkedin')) return <Linkedin className="w-4 h-4" />
    return <Globe className="w-4 h-4" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <div className="bg-slate-800/30 backdrop-blur-md border-b border-slate-700/30">
        <div className="px-8 py-12">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Discover Your Dream Job
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Explore opportunities from top companies worldwide. Find the perfect match for your skills and aspirations.
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-xl"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-3">
                <div className="flex items-center">
                  <div className="flex items-center px-6">
                    <Search className="w-7 h-7 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for your dream job..."
                    className="flex-1 bg-transparent text-white placeholder-slate-400 px-2 py-5 focus:outline-none text-xl"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl mr-3 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {/* Job Role Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowJobTitles(!showJobTitles)}
                  className={`w-full px-6 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                    selectedJobTitle 
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="font-medium">
                    {selectedJobTitle || 'Job Role'}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showJobTitles ? 'rotate-180' : ''}`} />
                </button>
                
                {showJobTitles && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {jobTitles.slice(0, 12).map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => handleJobTitleSelect(title)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-colors"
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Skills Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSkills(!showSkills)}
                  className={`w-full px-6 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                    selectedSkill 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="font-medium">
                    {selectedSkill || 'Skills'}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showSkills ? 'rotate-180' : ''}`} />
                </button>
                
                {showSkills && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {skills.slice(0, 12).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillSelect(skill)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-colors"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Company Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCompanies(!showCompanies)}
                  className={`w-full px-6 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                    selectedCompany 
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="font-medium">
                    {selectedCompany || 'Company'}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showCompanies ? 'rotate-180' : ''}`} />
                </button>
                
                {showCompanies && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {companies.slice(0, 12).map((company) => (
                        <button
                          key={company}
                          type="button"
                          onClick={() => handleCompanySelect(company)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-colors"
                        >
                          {company}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Salary Range Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSalary(!showSalary)}
                  className={`w-full px-6 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                    selectedSalary 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="font-medium">
                    {selectedSalary || 'Salary Range'}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showSalary ? 'rotate-180' : ''}`} />
                </button>
                
                {showSalary && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {salaryRanges.map((salary) => (
                        <button
                          key={salary}
                          type="button"
                          onClick={() => handleSalarySelect(salary)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-colors"
                        >
                          {salary}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-6" />
              <p className="text-2xl text-slate-300 font-medium">Finding amazing opportunities...</p>
            </div>
          )}

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

          {/* Jobs Display */}
          {!loading && !error && jobs.length > 0 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {jobs.length} Jobs Found
                </h2>
                {searchTerm && (
                  <p className="text-slate-400 text-lg">
                    for "{searchTerm}"
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
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                      {/* Company Logo and Name */}
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden mr-3 bg-slate-700 flex items-center justify-center">
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
                          <h3 className="text-white font-semibold text-lg">{job.company}</h3>
                          <div className="flex items-center text-slate-400 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.location}
                          </div>
                        </div>
                      </div>
                      
                      {/* Job Title */}
                      <h4 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                        {job.title}
                      </h4>
                      
                      {/* Job Description */}
                      <p className="text-slate-300 mb-4 line-clamp-3 text-sm leading-relaxed">
                        {cleanDescription(job.description)}
                      </p>
                      
                      {/* Job Details */}
                      <div className="flex items-center gap-3 mb-4">
                        {job.salary && (
                          <div className="flex items-center text-emerald-400 text-xs bg-emerald-400/10 px-3 py-1 rounded-full">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {job.salary}
                          </div>
                        )}
                        
                        <div className="flex items-center text-slate-500 text-xs bg-slate-700/50 px-3 py-1 rounded-full">
                          {getSourceIcon(job.source)}
                          <span className="ml-1">{job.source}</span>
                        </div>
                        
                        <div className="flex items-center text-slate-500 text-xs bg-slate-700/50 px-3 py-1 rounded-full">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatPostedDate(job.created_at)}
                        </div>
                      </div>
                      
                      {/* Job Type Badge */}
                      {job.job_type && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {job.job_type.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No Jobs State */}
          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-20">
              <Briefcase className="w-20 h-20 text-slate-600 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-slate-300 mb-3">No jobs found</h3>
              <p className="text-slate-400 text-lg max-w-md mx-auto">
                Try searching with different keywords or check back later for new opportunities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobSearchRedesignedNew
