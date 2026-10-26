import { useState, useEffect } from 'react'

interface Job {
  id: number
  title: string
  company: string
  location: string
  source: string
}

const JobSearchDebug = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Test API call on component mount
    testApiCall()
  }, [])

  const testApiCall = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Testing API call...')
      const response = await fetch('http://127.0.0.1:8000/api/jobs/jobs/?page_size=5')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API Response:', data)
      
      setJobs(data.results || [])
      console.log('Jobs set:', data.results?.length || 0)
      
    } catch (err) {
      console.error('API Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-theme-bg p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Job Search Debug</h1>
      
      {loading && (
        <div className="text-white">Loading...</div>
      )}
      
      {error && (
        <div className="text-red-500 mb-4">Error: {error}</div>
      )}
      
      <div className="mb-4">
        <button 
          onClick={testApiCall}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Test API Call
        </button>
      </div>
      
      <div className="text-white">
        <h2 className="text-xl mb-4">Results: {jobs.length} jobs found</h2>
        
        {jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-slate-800 p-4 rounded">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <p className="text-slate-400">{job.company}</p>
                <p className="text-slate-400">{job.location}</p>
                <p className="text-sm text-slate-500">Source: {job.source}</p>
              </div>
            ))}
          </div>
        )}
        
        {jobs.length === 0 && !loading && !error && (
          <div className="text-slate-400">No jobs found. Click "Test API Call" to try again.</div>
        )}
      </div>
    </div>
  )
}

export default JobSearchDebug
