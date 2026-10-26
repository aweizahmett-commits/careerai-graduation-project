import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const ResumeUpload = () => {
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Restore previously uploaded file info (display only) on mount
  useEffect(() => {
    const savedResumeId = localStorage.getItem('career_ai_resume_id')
    const savedFileName = localStorage.getItem('career_ai_resume_name')
    const savedFileSize = localStorage.getItem('career_ai_resume_size')
    if (savedResumeId && savedFileName) {
      setResumeId(savedResumeId)
      setUploadedFile({ name: savedFileName, size: parseInt(savedFileSize || '0') } as File)
    }
  }, [])

  const clearAll = useCallback(() => {
    setUploadedFile(null)
    setResumeId(null)
    localStorage.removeItem('career_ai_resume_id')
    localStorage.removeItem('career_ai_resume_name')
    localStorage.removeItem('career_ai_resume_size')
    localStorage.removeItem('career_ai_analysis')
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) handleFileUpload(files[0])
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) handleFileUpload(files[0])
  }, [])

  /**
   * Upload + Analyze in ONE call via the axios `api` instance.
   * The axios interceptor in services/api.ts automatically:
   *   1. Attaches the access token
   *   2. Detects 401 → calls /api/token/refresh/ → retries once
   *   3. If refresh fails → redirects to /login
   * No mock data. Clears old cache before every new upload.
   */
  const handleFileUpload = useCallback(async (file: File) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      alert('Please upload a PDF or Word document')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    // Clear stale cache so old results never bleed through
    localStorage.removeItem('career_ai_analysis')
    localStorage.removeItem('career_ai_resume_id')
    localStorage.removeItem('career_ai_resume_name')
    localStorage.removeItem('career_ai_resume_size')

    setUploadedFile(file)
    setIsUploading(true)
    setUploadProgress(10)
    setStatusMsg('Uploading and analyzing resume with AI…')

    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('[ResumeUpload] POST /jobs/resume/analyze/')
      console.log('[ResumeUpload] File:', file.name, file.size, file.type)

      // Use axios api instance — interceptor handles token attach + auto-refresh
      const response = await api.post('/jobs/resume/analyze/', formData, {
        headers: { 'Content-Type': undefined }, // let axios set multipart boundary
      })

      setUploadProgress(70)
      const data = response.data
      console.log('[ResumeUpload] Backend response:', JSON.stringify(data, null, 2))

      if (!data.analysis) {
        throw new Error('Backend did not return analysis data')
      }

      setUploadProgress(100)
      setStatusMsg('Analysis complete! Starting assessment…')

      const returnedResumeId = String(data.resume_id || data.resume?.id || '')

      localStorage.setItem('career_ai_resume_id', returnedResumeId)
      localStorage.setItem('career_ai_resume_name', file.name)
      localStorage.setItem('career_ai_resume_size', String(file.size))
      localStorage.setItem('career_ai_analysis', JSON.stringify(data.analysis))

      setResumeId(returnedResumeId)

      console.log('[ResumeUpload] primary_field:', data.analysis.primary_field)
      console.log('[ResumeUpload] confidence:', data.analysis.confidence)
      console.log('[ResumeUpload] top_skills:', data.analysis.top_skills)

      // Pipeline: go directly to Assessment — no manual stop at analysis-results
      navigate('/assessment', {
        state: { analysis: data.analysis, resumeId: returnedResumeId },
      })
    } catch (error: any) {
      console.error('[ResumeUpload] Error:', error)
      setStatusMsg('')

      // Axios errors carry error.response; network/timeout errors don't
      const status = error.response?.status
      const serverMsg = error.response?.data?.error || error.response?.data?.detail

      let friendlyMsg: string
      if (status === 401 || status === 403) {
        friendlyMsg = 'Your session has expired. Please log in again.'
      } else if (status === 404) {
        friendlyMsg = 'Analysis endpoint not found. Please check the backend is running.'
      } else if (status === 400) {
        friendlyMsg = serverMsg || 'Invalid request. Please try again.'
      } else if (status === 500) {
        friendlyMsg = serverMsg || 'Server error during analysis. Please try again.'
      } else if (error.code === 'ECONNABORTED') {
        friendlyMsg = 'Analysis timed out. Please try again — OpenAI may be slow.'
      } else if (!status) {
        friendlyMsg = 'Cannot reach server. Is the backend running on port 8000?'
      } else {
        friendlyMsg = serverMsg || error.message || 'Unexpected error. Please try again.'
      }

      alert(`Analysis failed: ${friendlyMsg}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [navigate])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="bg-theme-card border border-theme backdrop-blur-md rounded-2xl p-10">
          <h1 className="text-4xl font-bold mb-8 text-center text-theme-primary">
            AI Resume Analysis
          </h1>
          
          <p className="text-center mb-10 text-theme-secondary">
            Upload your resume and let our AI analyze your skills, experience, and suggest career paths
          </p>
          
          {/* Upload Area */}
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300 ${isDragging ? 'border-theme-accent-primary bg-theme-accent-primary/10' : 'border-theme bg-theme-bg'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div style={{ marginBottom: '30px' }}>
                <div >
                  📄
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold mb-4 text-theme-primary">
                    {isDragging ? 'Drop your resume here' : 'Drag and drop your resume here'}
                  </h3>
                  <p className="mb-6 text-theme-muted">or</p>
                  <button
                    onClick={openFileDialog}
                    className="px-8 py-4 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-white font-semibold rounded-xl transition-transform duration-200 hover:scale-105"
                  >
                    Browse Files
                  </button>
                </div>
                
                <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '20px' }}>
                  Supported formats: PDF, DOC, DOCX (Max 10MB)
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            /* Uploaded File Display */
            <div className="bg-theme-bg border border-theme rounded-xl p-8 text-center">
              <div>📄</div>

              <h3 className="text-2xl font-semibold mb-5 text-emerald-500">
                Resume Ready
              </h3>

              <div className="bg-theme-card-hover border border-theme rounded-lg p-5 mb-5 text-left text-theme-primary">
                <div style={{ marginBottom: '15px' }}>
                  <strong>File Name:</strong> {uploadedFile?.name}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>File Size:</strong> {uploadedFile ? formatFileSize(uploadedFile.size) : 'N/A'}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Resume ID:</strong> {resumeId || 'N/A'}
                </div>
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                {resumeId && (
                  <button
                    onClick={() => navigate('/resume-analysis-results', {
                      state: {
                        analysis: JSON.parse(localStorage.getItem('career_ai_analysis') || 'null'),
                        resumeId,
                      }
                    })}
                    className="px-8 py-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    📊 View Results
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-white font-semibold rounded-xl transition-all duration-200 hover:opacity-90"
                >
                  Upload New Resume
                </button>
                <button
                  onClick={clearAll}
                  className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/30 font-semibold rounded-xl transition-all duration-200 hover:bg-red-500/20"
                >
                  Clear
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Processing Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000]">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-10 text-center max-w-[400px]">
            <div className="w-20 h-20 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-lg animate-spin">
              ⏳
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">AI Analyzing Resume</h3>
            <p className="opacity-80 mb-5 text-white">
              {statusMsg || 'Our AI is extracting skills, experience, and generating career suggestions…'}
            </p>
            
            {/* Progress Bar */}
            <div className="bg-white/20 rounded-full h-2 overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm opacity-70 text-white">
              {uploadProgress}% Complete
            </p>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ResumeUpload
