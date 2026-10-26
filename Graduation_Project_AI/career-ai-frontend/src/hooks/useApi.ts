import { useState, useEffect, useCallback } from 'react'
import { 
  authApi, 
  profileApi, 
  resumeApi, 
  questionnaireApi, 
  recommendationsApi, 
  jobSearchApi,
  apiUtils 
} from '../services/api'
import { 
  UserProfile, 
  Education, 
  Experience, 
  QuestionnaireAnswer, 
  JobSearchParams, 
  Job, 
  CareerRecommendation,
  LoginCredentials,
  RegisterData 
} from '../services/api'

// Custom hook for authentication
export const useAuthApi = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await authApi.login(credentials)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (userData: RegisterData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await authApi.register(userData)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await authApi.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    login,
    register,
    logout,
    clearError,
    isLoading,
    error,
  }
}

// Custom hook for user profile
export const useProfileApi = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await profileApi.getProfile()
      setProfile(response.data)
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await profileApi.updateProfile(profileData)
      setProfile(response.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const uploadProfilePicture = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await profileApi.uploadProfilePicture(file)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    profile,
    fetchProfile,
    updateProfile,
    uploadProfilePicture,
    clearError,
    isLoading,
    error,
  }
}

// Custom hook for resume operations
export const useResumeApi = () => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadResume = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    
    try {
      const response = await resumeApi.uploadResume(file)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const getResumeStatus = useCallback(async () => {
    setError(null)
    
    try {
      const response = await resumeApi.getResumeStatus()
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const deleteResume = useCallback(async () => {
    setError(null)
    
    try {
      await resumeApi.deleteResume()
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const downloadResume = useCallback(async () => {
    setError(null)
    
    try {
      const response = await resumeApi.downloadResume()
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'resume.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    uploadResume,
    getResumeStatus,
    deleteResume,
    downloadResume,
    uploadProgress,
    isUploading,
    error,
    clearError,
  }
}

// Custom hook for questionnaire
export const useQuestionnaireApi = () => {
  const [questions, setQuestions] = useState<any[]>([])
  const [status, setStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await questionnaireApi.getQuestions()
      setQuestions(response.data)
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const submitAnswers = useCallback(async (answers: QuestionnaireAnswer[]) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await questionnaireApi.submitAnswers(answers)
      setStatus(response.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getStatus = useCallback(async () => {
    setError(null)
    
    try {
      const response = await questionnaireApi.getStatus()
      setStatus(response.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const updateAnswers = useCallback(async (answers: QuestionnaireAnswer[]) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await questionnaireApi.updateAnswers(answers)
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    questions,
    status,
    fetchQuestions,
    submitAnswers,
    getStatus,
    updateAnswers,
    isLoading,
    error,
    clearError,
  }
}

// Custom hook for recommendations
export const useRecommendationsApi = () => {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getRecommendations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await recommendationsApi.getRecommendations()
      setRecommendations(response.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getRecommendationsFromResume = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await recommendationsApi.getRecommendationsFromResume()
      setRecommendations(response.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getRecommendationsFromQuestionnaire = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await recommendationsApi.getRecommendationsFromQuestionnaire()
      setRecommendations(response.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getCombinedRecommendations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await recommendationsApi.getCombinedRecommendations()
      setRecommendations(response.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveRecommendation = useCallback(async (recommendationId: string) => {
    setError(null)
    
    try {
      await recommendationsApi.saveRecommendation(recommendationId)
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const getSavedRecommendations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await recommendationsApi.getSavedRecommendations()
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    recommendations,
    getRecommendations,
    getRecommendationsFromResume,
    getRecommendationsFromQuestionnaire,
    getCombinedRecommendations,
    saveRecommendation,
    getSavedRecommendations,
    isLoading,
    error,
    clearError,
  }
}

// Custom hook for job search
export const useJobSearchApi = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    hasNext: false,
    hasPrevious: false,
  })

  const searchJobs = useCallback(async (params: JobSearchParams) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await jobSearchApi.searchJobs(params)
      setJobs(response.data.results)
      setPagination({
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        hasNext: response.data.has_next,
        hasPrevious: response.data.has_previous,
      })
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getJobDetails = useCallback(async (jobId: string) => {
    setError(null)
    
    try {
      const response = await jobSearchApi.getJobDetails(jobId)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const saveJob = useCallback(async (jobId: string) => {
    setError(null)
    
    try {
      await jobSearchApi.saveJob(jobId)
      // Refresh saved jobs
      const savedResponse = await jobSearchApi.getSavedJobs()
      setSavedJobs(savedResponse.data)
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const unsaveJob = useCallback(async (jobId: string) => {
    setError(null)
    
    try {
      await jobSearchApi.unsaveJob(jobId)
      setSavedJobs(prev => prev.filter(job => job.id !== jobId))
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const getSavedJobs = useCallback(async () => {
    setError(null)
    
    try {
      const response = await jobSearchApi.getSavedJobs()
      setSavedJobs(response.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const applyToJob = useCallback(async (jobId: string, applicationData?: { cover_letter?: string; additional_info?: string }) => {
    setError(null)
    
    try {
      const response = await jobSearchApi.applyToJob(jobId, applicationData)
      // Refresh applications
      const applicationsResponse = await jobSearchApi.getApplications()
      setApplications(applicationsResponse.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const getApplications = useCallback(async () => {
    setError(null)
    
    try {
      const response = await jobSearchApi.getApplications()
      setApplications(response.data)
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const getJobSuggestions = useCallback(async () => {
    setError(null)
    
    try {
      const response = await jobSearchApi.getJobSuggestions()
      return response.data
    } catch (err) {
      const errorMessage = apiUtils.handleError(err)
      setError(errorMessage.message)
      throw errorMessage
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    jobs,
    savedJobs,
    applications,
    pagination,
    searchJobs,
    getJobDetails,
    saveJob,
    unsaveJob,
    getSavedJobs,
    applyToJob,
    getApplications,
    getJobSuggestions,
    isLoading,
    error,
    clearError,
  }
}
