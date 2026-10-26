import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign,
  Building,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronDown,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react'

interface Job {
  title: string
  company: string
  location: string
  salary: string
  url: string  // Changed from apply_link to url
  description: string
  source: string
  job_type?: string
  remote_type?: string
  posted_date?: string
}

interface SearchResponse {
  count: number
  next: string | null
  previous: string | null
  results: Job[]
}

const JobSearchOptimized = () => {
  const location = useLocation()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Filter states
  const [selectedJobType, setSelectedJobType] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedSalary, setSelectedSalary] = useState('')
  
  // Dropdown states
  const [showJobTypes, setShowJobTypes] = useState(false)
  const [showLocations, setShowLocations] = useState(false)
  const [showSalaries, setShowSalaries] = useState(false)
  
    
  // Job types filter
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Remote',
    'Hybrid'
  ]
  
  // Locations filter
  const locations = [
    'Remote',
    'New York, NY',
    'San Francisco, CA',
    'Seattle, WA',
    'Austin, TX',
    'Boston, MA',
    'Chicago, IL'
  ]
  
  // Salary ranges
  const salaryRanges = [
    '$50,000 - $80,000',
    '$80,000 - $120,000',
    '$120,000 - $160,000',
    '$160,000 - $200,000',
    '$200,000+'
  ]

  // Preload jobs on component mount
  useEffect(() => {
    preloadJobs()
    
    // Handle career match data from location state
    if (location.state?.careerTitle) {
      const matchTitle = location.state.careerTitle
      setSearchTerm(matchTitle)
      performSearch(matchTitle)
    } else if (location.state?.skills) {
      const skills = location.state.skills
      const mainSkill = skills[0] || 'Software Developer'
      setSearchTerm(mainSkill)
      performSearch(mainSkill)
    } else {
      // Default search
      performSearch('Software Engineer')
    }
  }, [location.state])

  // Preload popular searches in background
  const preloadJobs = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      
      await fetch('http://localhost:8000/api/jobs/preload/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.log('Preload failed (non-critical):', error)
    }
  }

  // Optimized search function using database API
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    setHasSearched(true)
    
    try {
      // Build search URL with filters
      const searchParams = new URLSearchParams({
        keyword: query.trim(),
      })
      
      if (selectedLocation) searchParams.append('location', selectedLocation)
      
      const response = await fetch(`http://localhost:8000/api/jobs/search/?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data: SearchResponse = await response.json()
      
      // Update state with results
      setJobs(data.results)
      setSearchResponse({
        count: data.count,
        next: data.next,
        previous: data.previous,
        results: data.results
      })
      
    } catch (err) {
      console.error('Search error:', err)
      console.error('Error details:', err instanceof Error ? err.message : err)
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace')
      
      // Handle different error types
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Search timed out. Please try again.')
        } else if (err.message.includes('Failed to fetch')) {
          setError('Network error. Please check your connection.')
        } else if (err.message.includes('Server error: 500')) {
          setError('Server error. Please try again later.')
        } else {
          setError(`Search failed: ${err.message}`)
        }
      } else {
        setError('An unexpected error occurred.')
      }
      
      // Don't clear jobs on error - keep previous results if available
    } finally {
      setLoading(false)
    }
  }, [selectedLocation])

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(searchTerm)
  }

  
  // Clear all filters
  const clearAllFilters = () => {
    setSelectedJobType('')
    setSelectedLocation('')
    setSelectedSalary('')
    setSearchTerm('')
  }

  // Filter handlers
  const handleJobTypeSelect = (jobType: string) => {
    setSelectedJobType(jobType)
    setShowJobTypes(false)
    if (searchTerm) performSearch(searchTerm)
  }
  
  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location)
    setShowLocations(false)
    if (searchTerm) performSearch(searchTerm)
  }
  
  const handleSalarySelect = (salary: string) => {
    setSelectedSalary(salary)
    setShowSalaries(false)
    if (searchTerm) performSearch(searchTerm)
  }

  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Job Search</h1>
              <p className="text-slate-400 mt-1">Find your perfect career opportunity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Main Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for jobs, companies, or skills..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search Jobs</span>
                  </>
                )}
              </button>
            </div>
          </form>

          
          {/* Filters */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              <button
                onClick={clearAllFilters}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Job Type Filter */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-400 mb-2">Job Type</label>
                <button
                  onClick={() => setShowJobTypes(!showJobTypes)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-left flex items-center justify-between"
                >
                  <span>{selectedJobType || 'All Types'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showJobTypes && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                    {jobTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleJobTypeSelect(type)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Filter */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-400 mb-2">Location</label>
                <button
                  onClick={() => setShowLocations(!showLocations)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-left flex items-center justify-between"
                >
                  <span>{selectedLocation || 'All Locations'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showLocations && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                    {locations.map((location) => (
                      <button
                        key={location}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors"
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Salary Filter */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-400 mb-2">Salary Range</label>
                <button
                  onClick={() => setShowSalaries(!showSalaries)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-left flex items-center justify-between"
                >
                  <span>{selectedSalary || 'All Salaries'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showSalaries && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                    {salaryRanges.map((salary) => (
                      <button
                        key={salary}
                        onClick={() => handleSalarySelect(salary)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors"
                      >
                        {salary}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div>
            {/* Results Header */}
            {hasSearched && (
              <div className="mb-6">
                {searchResponse && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {searchResponse.count} Jobs Found
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Showing results from database
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-4" />
                <p className="text-slate-400">Searching for jobs...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <h3 className="text-red-400 font-semibold">Search Issue</h3>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {!loading && !error && jobs.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {jobs.map((job, index) => (
                  <motion.div
                    key={`${job.company}-${job.title}-${index}`}
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-slate-400 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        {job.location}
                      </div>
                      <div className="flex items-center text-slate-400 text-sm">
                        <DollarSign className="w-4 h-4 mr-2" />
                        {job.salary}
                      </div>
                      {job.job_type && (
                        <div className="flex items-center text-slate-400 text-sm">
                          <Briefcase className="w-4 h-4 mr-2" />
                          {job.job_type}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-slate-400 text-xs">
                          Actively recruiting
                        </span>
                      </div>
                      <a
                        href={job.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                      >
                        <span>Apply Now</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && !error && hasSearched && jobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Jobs Found</h3>
                <p className="text-slate-400">
                  Try adjusting your search terms or filters to find more opportunities.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default JobSearchOptimized
