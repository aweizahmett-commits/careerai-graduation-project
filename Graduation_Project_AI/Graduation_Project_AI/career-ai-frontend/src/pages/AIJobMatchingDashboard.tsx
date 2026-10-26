import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, FileText, Brain, TrendingUp, Briefcase, MapPin, DollarSign, 
  Clock, Star, ThumbsUp, ThumbsDown, Bookmark, ExternalLink, RefreshCw,
  Settings, User, Target, Award, ChevronDown, ChevronUp, X, CheckCircle,
  AlertCircle, Info, Zap, BarChart3, Lightbulb, Filter, Search, Play
} from 'lucide-react'
import { resumeApi, ResumeAnalysis, JobRecommendation } from '../services/api'

interface UserSkill {
  id: number
  skill_name: string
  proficiency_level: number
  category: string
  years_experience?: number
  is_preferred: boolean
}

interface MatchingCriteria {
  preferred_job_types: string[]
  preferred_locations: string[]
  salary_min?: number
  salary_max?: number
  remote_preference: string
  preferred_industries: string[]
  company_sizes: string[]
  skill_match_weight: number
  experience_match_weight: number
  education_match_weight: number
  location_match_weight: number
  salary_match_weight: number
}

const AIJobMatchingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'resume' | 'recommendations' | 'skills' | 'settings'>('resume')
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [userSkills, setUserSkills] = useState<UserSkill[]>([])
  const [matchingCriteria, setMatchingCriteria] = useState<MatchingCriteria | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedJob, setSelectedJob] = useState<JobRecommendation | null>(null)
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<number>>(new Set())
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Load initial data
  useEffect(() => {
    loadUserSkills()
    loadMatchingCriteria()
    loadRecommendations()
  }, [])

  const loadUserSkills = async () => {
    try {
      const response = await fetch('/api/jobs/skills/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      const data = await response.json()
      setUserSkills(data.skills)
    } catch (error) {
      console.error('Error loading skills:', error)
    }
  }

  const loadMatchingCriteria = async () => {
    try {
      const response = await fetch('/api/jobs/criteria/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      const data = await response.json()
      setMatchingCriteria(data)
    } catch (error) {
      console.error('Error loading criteria:', error)
    }
  }

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/jobs/recommendations/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      const data = await response.json()
      setRecommendations(data.recommendations)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setLoading(true)
    setUploadProgress(0)

    try {
      // Create a wrapper to track upload progress
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/jobs/resume/analyze/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume')
      }
      
      // Handle successful analysis
      if (data.analysis) {
        setResumeAnalysis(data.analysis)
        
        // Load recommendations after analysis
        await loadRecommendations()
        
        setActiveTab('recommendations')
        
        // Show success message
        console.log('Resume analyzed successfully!')
        console.log('Analysis:', data.analysis)
        console.log('Resume ID:', data.resume_id)
        
        // Show user-friendly success message
        alert('Resume uploaded and analyzed successfully! Check the recommendations tab for job matches.')
      }
    } catch (error: any) {
      console.error('Error uploading/analyzing resume:', error)
      
      // Show user-friendly error message
      let errorMessage = 'Failed to upload and analyze resume. Please try again.'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.error || 'Invalid file format. Please upload a PDF or DOCX file.'
        } else if (error.response.status === 401) {
          errorMessage = 'You need to be logged in to analyze your resume.'
        } else if (error.response.status === 500) {
          errorMessage = 'Server error during analysis. Please try again later.'
        }
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const handleJobFeedback = async (jobId: number, feedbackType: string, feedbackScore?: number) => {
    try {
      await fetch('/api/jobs/feedback/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recommendation_id: jobId,
          feedback_type: feedbackType,
          feedback_score: feedbackScore
        })
      })

      // Update local state
      setRecommendations(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, is_saved: feedbackType === 'saved', is_applied: feedbackType === 'applied' }
          : job
      ))

      if (feedbackType === 'applied') {
        await trackApplication(jobId)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const trackApplication = async (jobId: number) => {
    try {
      const job = recommendations.find(j => j.id === jobId)
      if (job) {
        await fetch('/api/jobs/applications/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            job_id: job.id.toString()
          })
        })
      }
    } catch (error) {
      console.error('Error tracking application:', error)
    }
  }

  const refreshRecommendations = async () => {
    setLoading(true)
    try {
      await fetch('/api/jobs/recommendations/refresh/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      await loadRecommendations()
    } catch (error) {
      console.error('Error refreshing recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRecommendationExpansion = (jobId: number) => {
    setExpandedRecommendations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getProficiencyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert']
    return labels[level] || 'Unknown'
  }

  return (
    <div className="min-h-screen bg-theme-bg text-slate-100">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-indigo-500" />
              <h1 className="text-xl font-bold">AI Career Matching</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshRecommendations}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'resume', label: 'Resume Analysis', icon: FileText },
              { id: 'recommendations', label: 'Job Matches', icon: Briefcase },
              { id: 'skills', label: 'Skills Profile', icon: User },
              { id: 'settings', label: 'Preferences', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Resume Analysis Tab */}
          {activeTab === 'resume' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Upload Section */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Upload Your Resume</h2>
                  <p className="text-slate-400 mb-6">
                    AI will automatically analyze your resume to extract skills, experience, and suggest career paths
                  </p>
                  
                  <div className="max-w-md mx-auto">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">PDF or DOCX (MAX. 10MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={handleResumeUpload}
                        disabled={loading}
                      />
                    </label>
                    
                    {/* Loading State */}
                    {loading && (
                      <div className="mt-6 text-center">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Uploading and analyzing resume... {uploadProgress}%
                        </p>
                      </div>
                    )}
                    
                    {/* Uploaded File Display */}
                    {uploadedFile && !loading && (
                      <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-indigo-400 mr-2" />
                            <span className="text-sm text-slate-300">{uploadedFile.name}</span>
                          </div>
                          <button
                            onClick={() => setUploadedFile(null)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Analysis Results */}
              {resumeAnalysis && (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-indigo-500" />
                      AI Analysis Results
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">Skills Found</span>
                          <Target className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="text-2xl font-bold">{resumeAnalysis.skills.length}</div>
                      </div>
                      
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">Experience</span>
                          <Briefcase className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold">{resumeAnalysis.experience_years} yrs</div>
                      </div>
                      
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">Education</span>
                          <Award className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="text-lg font-bold">{resumeAnalysis.education_level}</div>
                      </div>
                      
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">Confidence</span>
                          <Zap className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="text-2xl font-bold">{Math.round(resumeAnalysis.confidence_score * 100)}%</div>
                      </div>
                    </div>

                    {/* Skills by Category */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3">Skills by Category</h4>
                      <div className="space-y-2">
                        {Object.entries(resumeAnalysis.skill_categories).map(([category, skills]) => (
                          <div key={category} className="bg-slate-700/30 rounded-lg p-3">
                            <div className="font-medium text-sm text-indigo-400 mb-1">
                              {category.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill: string) => (
                                <span
                                  key={skill}
                                  className="px-2 py-1 bg-slate-600 rounded text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Career Suggestions */}
                    <div>
                      <h4 className="font-semibold mb-3">Career Suggestions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resumeAnalysis.career_suggestions.map((suggestion, index) => (
                          <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{suggestion.title}</h5>
                              <span className={`text-sm font-bold ${getMatchScoreColor(suggestion.match_score)}`}>
                                {suggestion.match_score}%
                              </span>
                            </div>
                            <div className="text-sm text-slate-400 mb-2">
                              Matched: {suggestion.matched_skills.join(', ')}
                            </div>
                            {suggestion.missing_skills.length > 0 && (
                              <div className="text-xs text-slate-500">
                                Consider learning: {suggestion.missing_skills.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Job Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">AI Job Recommendations</h2>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Info className="w-4 h-4" />
                  <span>{recommendations.length} jobs matched to your profile</span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((job) => (
                    <div
                      key={job.id}
                      className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-indigo-500 transition-colors"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">{job.title}</h3>
                              <span className={`px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs font-medium`}>
                                {Math.round(job.match_score)}% Match
                              </span>
                              <span className="px-2 py-1 bg-slate-700 rounded text-xs">
                                {job.source}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-slate-400 mb-3">
                              <div className="flex items-center">
                                <Briefcase className="w-4 h-4 mr-1" />
                                {job.company}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {job.location}
                              </div>
                              {job.salary_range && (
                                <div className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  {job.salary_range}
                                </div>
                              )}
                            </div>

                            <p className="text-slate-300 mb-3 line-clamp-2">{job.description}</p>
                            
                            {/* Matched Skills */}
                            {job.matched_skills.length > 0 && (
                              <div className="mb-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Target className="w-4 h-4 text-green-500" />
                                  <span className="text-sm font-medium">Matched Skills</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {job.matched_skills.slice(0, 5).map((skill) => (
                                    <span
                                      key={skill}
                                      className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {job.matched_skills.length > 5 && (
                                    <span className="px-2 py-1 bg-slate-700 rounded text-xs">
                                      +{job.matched_skills.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleJobFeedback(job.id, 'saved')}
                              className={`p-2 rounded-lg transition-colors ${
                                job.is_saved
                                  ? 'bg-yellow-500/20 text-yellow-500'
                                  : 'bg-slate-700 text-slate-400 hover:text-yellow-500'
                              }`}
                            >
                              <Bookmark className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleRecommendationExpansion(job.id)}
                              className="p-2 bg-slate-700 rounded-lg text-slate-400 hover:text-theme-primary transition-colors"
                            >
                              {expandedRecommendations.has(job.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedRecommendations.has(job.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-700 pt-4 mt-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium mb-2">Requirements</h4>
                                <p className="text-sm text-slate-400">{job.requirements}</p>
                                
                                {job.missing_skills.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-medium mb-2">Skills to Develop</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {job.missing_skills.map((skill) => (
                                        <span
                                          key={skill}
                                          className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Why This Matches</h4>
                                <ul className="space-y-1 text-sm text-slate-400">
                                  {job.match_reasons.map((reason, index) => (
                                    <li key={index} className="flex items-start">
                                      <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                                
                                {job.improvement_suggestions.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-medium mb-2">Improvement Suggestions</h4>
                                    <ul className="space-y-1 text-sm text-slate-400">
                                      {job.improvement_suggestions.map((suggestion, index) => (
                                        <li key={index} className="flex items-start">
                                          <Lightbulb className="w-3 h-3 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                                          {suggestion}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-slate-700">
                              <button
                                onClick={() => handleJobFeedback(job.id, 'applied')}
                                disabled={job.is_applied}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                  job.is_applied
                                    ? 'bg-green-500/20 text-green-500 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-theme-primary'
                                }`}
                              >
                                {job.is_applied ? 'Applied' : 'Apply Now'}
                              </button>
                              
                              <button
                                onClick={() => handleJobFeedback(job.id, 'liked')}
                                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span>Like</span>
                              </button>
                              
                              <button
                                onClick={() => handleJobFeedback(job.id, 'disliked')}
                                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                              >
                                <ThumbsDown className="w-4 h-4" />
                                <span>Not Interested</span>
                              </button>
                              
                              {job.application_url && (
                                <a
                                  href={job.application_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span>View Original</span>
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Skills Profile Tab */}
          {activeTab === 'skills' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Skills Profile</h2>
                <button
                  onClick={() => setShowSkillModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Add Skills
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Skills List */}
                <div className="lg:col-span-2">
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold mb-4">Your Skills</h3>
                    
                    {userSkills.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No skills added yet. Upload your resume or add skills manually.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userSkills.map((skill) => (
                          <div
                            key={skill.id}
                            className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium">{skill.skill_name}</h4>
                                {skill.is_preferred && (
                                  <Star className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className="px-2 py-1 bg-slate-600 rounded text-xs">
                                  {skill.category.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-slate-400">
                                <span>Level: {getProficiencyLabel(skill.proficiency_level)}</span>
                                {skill.years_experience && (
                                  <span>Experience: {skill.years_experience} years</span>
                                )}
                              </div>
                              
                              {/* Proficiency Bar */}
                              <div className="mt-2">
                                <div className="w-full bg-slate-600 rounded-full h-2">
                                  <div
                                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(skill.proficiency_level / 5) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills Statistics */}
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold mb-4">Skills Overview</h3>
                    
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-500">{userSkills.length}</div>
                        <div className="text-sm text-slate-400">Total Skills</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-500">
                          {userSkills.filter(s => s.proficiency_level >= 4).length}
                        </div>
                        <div className="text-sm text-slate-400">Advanced Skills</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-500">
                          {userSkills.filter(s => s.is_preferred).length}
                        </div>
                        <div className="text-sm text-slate-400">Preferred Skills</div>
                      </div>
                    </div>
                  </div>

                  {/* Skills by Category */}
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold mb-4">Skills by Category</h3>
                    
                    <div className="space-y-2">
                      {Object.entries(
                        userSkills.reduce((acc, skill) => {
                          acc[skill.category] = (acc[skill.category] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                      ).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">
                            {category.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl font-bold mb-6">Job Matching Preferences</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Preferences */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4">Job Preferences</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Preferred Job Types
                      </label>
                      <div className="space-y-2">
                        {['full_time', 'part_time', 'contract', 'remote'].map((type) => (
                          <label key={type} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={matchingCriteria?.preferred_job_types?.includes(type) || false}
                              className="rounded border-slate-600 bg-slate-700 text-indigo-500"
                              readOnly
                            />
                            <span className="text-sm">{type.replace('_', ' ').toUpperCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Remote Preference
                      </label>
                      <select
                        value={matchingCriteria?.remote_preference || 'any'}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                        disabled
                      >
                        <option value="any">Any</option>
                        <option value="remote_only">Remote Only</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">On-site Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Salary Range
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={matchingCriteria?.salary_min || ''}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                          disabled
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={matchingCriteria?.salary_max || ''}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matching Weights */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4">AI Matching Weights</h3>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'skill_match_weight', label: 'Skill Match', default: 0.4 },
                      { key: 'experience_match_weight', label: 'Experience', default: 0.2 },
                      { key: 'education_match_weight', label: 'Education', default: 0.1 },
                      { key: 'location_match_weight', label: 'Location', default: 0.1 },
                      { key: 'salary_match_weight', label: 'Salary', default: 0.2 }
                    ].map(({ key, label, default: defaultValue }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-slate-300">
                            {label}
                          </label>
                          <span className="text-sm text-slate-400">
                            {Math.round((matchingCriteria?.[key as keyof MatchingCriteria] as number || defaultValue) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(matchingCriteria?.[key as keyof MatchingCriteria] as number || defaultValue) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-400">
                        These weights determine how important each factor is in calculating your job match scores. 
                        The AI learns from your feedback to automatically adjust these over time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skill Modal (placeholder) */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Skills</h3>
              <button
                onClick={() => setShowSkillModal(false)}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-slate-400 mb-4">
              Skill management interface would be implemented here.
            </p>
            
            <button
              onClick={() => setShowSkillModal(false)}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIJobMatchingDashboard
