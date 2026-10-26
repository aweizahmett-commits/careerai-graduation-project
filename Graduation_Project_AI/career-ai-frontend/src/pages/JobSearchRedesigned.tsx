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

const JobSearchRedesigned = () => {
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

  
  // API function to fetch jobs from backend
  const fetchJobs = async (keyword: string) => {
    setLoading(true)
    setError(null)
    setJobs([])
    
    try {
      // Use the correct API endpoint
      const response = await fetch(`http://127.0.0.1:8000/api/jobs/jobs/?search=${encodeURIComponent(keyword)}&page_size=30`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Check for API error response
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Validate response data - ensure results array exists
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from server')
      }
      
      // Set jobs from the results array
      setJobs(data.results)
      console.log(`Successfully fetched ${data.results.length} jobs`)
      
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
    const searchQuery = buildSearchQuery()
    
    if (searchQuery.trim()) {
      // Fetch jobs - fetchJobs will handle loading state
      fetchJobs(searchQuery.trim())
    }
  }

  // Handle job application
  const handleApply = (applyUrl: string) => {
    if (applyUrl && applyUrl !== '#') {
      window.open(applyUrl, '_blank', 'noopener,noreferrer')
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
    <div className="min-h-screen bg-theme-bg">
      {/* Header Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="px-8 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Real Job Search
          </h1>
          <p className="text-slate-400 text-lg">
            Find and apply to real jobs from LinkedIn, Glassdoor, and other job boards
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20"></div>
                <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-2">
                  <div className="flex items-center">
                    <div className="flex items-center px-4">
                      <Search className="w-6 h-6 text-indigo-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for your dream job..."
                      className="flex-1 bg-transparent text-white placeholder-slate-400 px-2 py-4 focus:outline-none text-lg"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl mr-2 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {/* Job Role Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowJobTitles(!showJobTitles)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                      selectedJobTitle 
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium">
                      {selectedJobTitle || 'Job Role'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showJobTitles ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showJobTitles && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                      <div className="p-3 space-y-1">
                        {jobTitles.slice(0, 12).map((title) => (
                          <button
                            key={title}
                            type="button"
                            onClick={() => handleJobTitleSelect(title)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
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
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                      selectedSkill 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium">
                      {selectedSkill || 'Skills'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSkills ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showSkills && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                      <div className="p-3 space-y-1">
                        {skills.slice(0, 12).map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillSelect(skill)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
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
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                      selectedCompany 
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium">
                      {selectedCompany || 'Company'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCompanies ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCompanies && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                      <div className="p-3 space-y-1">
                        {companies.slice(0, 12).map((company) => (
                          <button
                            key={company}
                            type="button"
                            onClick={() => handleCompanySelect(company)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
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
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                      selectedSalary 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium">
                      {selectedSalary || 'Salary Range'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSalary ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showSalary && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                      <div className="p-3 space-y-1">
                        {salaryRanges.map((salary) => (
                          <button
                            key={salary}
                            type="button"
                            onClick={() => handleSalarySelect(salary)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
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
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                <p className="text-xl text-slate-300">Finding real jobs...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-red-400 font-semibold mb-2">Unable to fetch jobs</h3>
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  onClick={() => fetchJobs(searchTerm || 'Software Engineer')}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Jobs Display */}
            {!loading && !error && jobs.length > 0 && (
              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
                        <p className="text-slate-400 mb-4">{job.company}</p>
                        
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center text-slate-300 text-sm">
                            <MapPin className="w-4 h-4 mr-2" />
                            {job.location}
                          </div>
                          
                          {job.salary && (
                            <div className="flex items-center text-slate-300 text-sm">
                              <DollarSign className="w-4 h-4 mr-2" />
                              {job.salary}
                            </div>
                          )}
                          
                          <div className="flex items-center text-slate-500 text-xs bg-slate-700/50 px-2 py-1 rounded-lg">
                            {getSourceIcon(job.source)}
                            <span className="ml-1">{job.source}</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-400 mb-4 line-clamp-3">
                          {job.description}
                        </p>
                        
                        <button
                          onClick={() => handleApply(job.apply_url)}
                          className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Jobs State */}
            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-20">
                <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No jobs found</h3>
                <p className="text-slate-400">
                  Try searching with different keywords or check back later for new opportunities.
                </p>
              </div>
            )}
          </div>
      </div>
    </div>
  )
}

export default JobSearchRedesigned
