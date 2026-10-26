import { useState, useEffect } from 'react'

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

const JobSearchTest = () => {
  const [jobs, setJobs] = useState<AggregatedJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Test the API call on component mount
    testApiCall()
  }, [])

  const testApiCall = async () => {
    setLoading(true)
    setError(null)
    setJobs([])
    
    try {
      console.log('Testing API call to: http://127.0.0.1:8000/api/jobs/jobs/')
      
      const response = await fetch('http://127.0.0.1:8000/api/jobs/jobs/?page_size=5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('API Response structure:', data)
      
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

  return (
    <div className="min-h-screen bg-theme-bg p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Job Search Test</h1>
      
      <div className="mb-6">
        <button 
          onClick={testApiCall}
          disabled={loading}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API Call'}
        </button>
      </div>
      
      {loading && (
        <div className="text-white mb-4">Loading jobs...</div>
      )}
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <h3 className="text-red-400 font-semibold mb-2">Error</h3>
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      <div className="text-white">
        <h2 className="text-xl mb-4">Results: {jobs.length} jobs found</h2>
        
        {jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-2">{job.title}</h3>
                <p className="text-slate-400 mb-2">{job.company}</p>
                <p className="text-slate-400 mb-2">{job.location}</p>
                <p className="text-sm text-slate-500 mb-2">Source: {job.source}</p>
                <p className="text-sm text-slate-400 line-clamp-2">{job.description}</p>
                <button
                  onClick={() => window.open(job.apply_url, '_blank')}
                  className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
        
        {jobs.length === 0 && !loading && !error && (
          <div className="text-slate-400 bg-slate-800 p-8 rounded-lg text-center">
            <p>No jobs found. Click "Test API Call" to try again.</p>
            <p className="text-sm mt-2">Make sure the backend is running on http://127.0.0.1:8000</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobSearchTest
