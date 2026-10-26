import axios, { AxiosInstance, AxiosResponse } from 'axios'

// Extend axios config to support the _retry flag used in the interceptor
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

// API Configuration
// Relative URL routes through Vite proxy (/api → http://127.0.0.1:8000)
// This avoids localhost vs 127.0.0.1 IPv4/IPv6 mismatch on Windows
// and eliminates all CORS issues in development.
const API_BASE_URL = '/api'

// Types
export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  first_name: string
  last_name: string
  email: string
  username: string
  password: string
  password_confirm: string
}

export interface JobProviderRegisterData extends RegisterData {
  institution: string
  phone_number: string
  professional_description?: string
}

export interface AuthResponse {
  message: string
  user: {
    id: string
    username: string
    email: string
    first_name: string
    last_name: string
    role?: 'student' | 'job_provider'
  }
  tokens: {
    refresh: string
    access: string
  }
  access?: string  // Add optional access field for compatibility
}

export interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone?: string
  location?: string
  bio?: string
  education: Education[]
  experience: Experience[]
  skills: string[]
}

export interface ResumeAnalysis {
  skills: string[]
  experience_years: number
  education_level: string
  job_titles: string[]
  skill_categories: Record<string, string[]>
  career_suggestions: Array<{
    title: string
    match_score: number
    matched_skills: string[]
    missing_skills: string[]
  }>
  confidence_score: number
  processing_time: number
}

export interface JobRecommendation {
  id: number
  title: string
  company: string
  location: string
  description: string
  requirements: string
  salary_range: string
  job_type: string
  match_score: number
  skill_match_score: number
  matched_skills: string[]
  missing_skills: string[]
  match_reasons: string[]
  improvement_suggestions: string[]
  source: string
  application_url: string
  is_saved: boolean
  is_applied: boolean
  is_viewed: boolean
  posted_date?: string
}

export interface Education {
  id?: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
}

export interface Experience {
  id?: string
  company: string
  position: string
  startDate: string
  endDate?: string
  description: string
  isCurrentJob: boolean
}

export interface QuestionnaireAnswer {
  questionId: string
  answer: string
}

export interface JobSearchParams {
  query?: string
  location?: string
  experienceLevel?: string
  jobType?: string
  page?: number
  limit?: number
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  experienceLevel: string
  jobType: string
  salary: string
  postedDate: string
  description: string
  requiredSkills: Skill[]
  companyLogo: string
  isRemote: boolean
  matchScore?: number
}

export interface Skill {
  name: string
  level: number
  category?: string
}

export interface CareerRecommendation {
  id: string
  title: string
  matchScore: number
  shortDescription: string
  longDescription: string
  requiredSkills: Skill[]
  averageSalary: string
  growthRate: string
  educationLevel: string
  workEnvironment: string
  typicalEmployers: string[]
  careerPath: string[]
}

// API Error Response
export interface ApiError {
  message: string
  field?: string
  code?: string
}

// Token refresh — defined first so the interceptor closure can reference it
const refreshAccessToken = async (refreshToken: string): Promise<AxiosResponse<AuthResponse>> => {
  return axios.post(`${API_BASE_URL}/token/refresh/`, { refresh: refreshToken })
}

// Create Axios instance with default configuration
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // 2 min — OpenAI analysis can take 30-60 s
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor — attach JWT token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor — auto-refresh expired access token
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      const is401 = error.response?.status === 401
      const isRefreshUrl = originalRequest?.url?.includes('/token/refresh/')
      const alreadyRetried = originalRequest?._retry

      if (is401 && !isRefreshUrl && !alreadyRetried) {
        originalRequest._retry = true // prevent infinite retry loop
        try {
          const refreshToken = localStorage.getItem('refresh_token')
          if (!refreshToken) throw new Error('No refresh token')

          const response = await refreshAccessToken(refreshToken)
          const newAccessToken = response.data.access || response.data.tokens?.access

          localStorage.setItem('access_token', newAccessToken)
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return instance(originalRequest) // retry original request once
        } catch {
          // Refresh failed — clear tokens and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(new Error('Session expired. Please log in again.'))
        }
      }

      return Promise.reject(error)
    }
  )

  return instance
}

// API instance
const api = createApiInstance()

// Authentication API
export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> => {
    console.log('Login request:', credentials)
    console.log('Making POST request to:', `${API_BASE_URL}/login/`)
    
    try {
      // Use direct axios call for login to avoid auth interceptor
      const response = await axios.post(`${API_BASE_URL}/login/`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('Login response:', response.data)
      return response
    } catch (error: any) {
      console.error('Login API error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      })
      throw error
    }
  },

  // Register
  register: async (userData: RegisterData): Promise<AxiosResponse<AuthResponse>> => {
    // Use direct axios call for register to avoid auth interceptor
    return axios.post(`${API_BASE_URL}/register/`, userData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },

  // Register Job Provider
  registerJobProvider: async (userData: JobProviderRegisterData): Promise<AxiosResponse<AuthResponse>> => {
    // Use direct axios call for register to avoid auth interceptor
    return axios.post(`${API_BASE_URL}/register/job-provider/`, userData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },

  // Logout
  logout: async (): Promise<AxiosResponse<void>> => {
    const response = await api.post('/logout/')
    // Clear tokens from localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    return response
  },

  // Refresh token
  refreshToken: async (): Promise<AxiosResponse<AuthResponse>> => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    return refreshAccessToken(refreshToken)
  },

  // Get current user
  getCurrentUser: async (): Promise<AxiosResponse<AuthResponse['user']>> => {
    return api.get('/profile/')
  },
}

// User Profile API
export const profileApi = {
  // Get user profile
  getProfile: async (): Promise<AxiosResponse<UserProfile>> => {
    return api.get('/profile/')
  },

  // Update user profile
  updateProfile: async (profileData: Partial<UserProfile>): Promise<AxiosResponse<UserProfile>> => {
    return api.put('/profile/', profileData)
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<AxiosResponse<{ url: string }>> => {
    const formData = new FormData()
    formData.append('profile_picture', file)
    
    return api.post('/upload-picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Resume API
export const resumeApi = {
  // Upload resume
  uploadResume: async (file: File): Promise<AxiosResponse<{
    id: string
    filename: string
    upload_date: string
    extracted_skills: Skill[]
  }>> => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/upload_resume/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 100)
        )
        console.log(`Upload Progress: ${progress}%`)
      },
    })
  },

  // Analyze resume with AI
  analyzeResume: async (file: File): Promise<AxiosResponse<{
    message: string
    analysis: ResumeAnalysis
    resume_id: string
  }>> => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/jobs/resume/analyze/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (_progressEvent) => {
        // You can emit progress if needed: Math.round((_progressEvent.loaded * 100) / (_progressEvent.total || 100))
      },
    })
  },

  // Get resume status
  getResumeStatus: async (): Promise<AxiosResponse<{
    id: string
    filename: string
    upload_date: string
    is_processed: boolean
    extracted_skills: Skill[]
  }>> => {
    return api.get('/resume/status/')
  },

  // Delete resume
  deleteResume: async (): Promise<AxiosResponse<void>> => {
    return api.delete('/resume/delete/')
  },

  // Download resume
  downloadResume: async (): Promise<AxiosResponse<Blob>> => {
    return api.get('/resume/download/', {
      responseType: 'blob',
    })
  },
}

// Career Questionnaire API
export const questionnaireApi = {
  // Get questionnaire questions
  getQuestions: async (): Promise<AxiosResponse<{
    id: string
    category: string
    question: string
    options: string[]
    required: boolean
  }[]>> => {
    return api.get('/career_questions/')
  },

  // Submit questionnaire answers
  submitAnswers: async (answers: QuestionnaireAnswer[]): Promise<AxiosResponse<{
      id: string
      submitted_at: string
      is_completed: boolean
    }>> => {
    return api.post('/questionnaire/answer/', { answers })
  },

  // Get questionnaire status
  getStatus: async (): Promise<AxiosResponse<{
      is_completed: boolean
      submitted_at?: string
      completion_percentage: number
    }>> => {
    return api.get('/questionnaire/status/')
  },

  // Update answers
  updateAnswers: async (answers: QuestionnaireAnswer[]): Promise<AxiosResponse<void>> => {
    return api.put('/questionnaire/answer/', { answers })
  },
}

// AI Recommendations API
export const recommendationsApi = {
  // Get career recommendations
  getRecommendations: async (): Promise<AxiosResponse<CareerRecommendation[]>> => {
    return api.get('/ai_recommendations/')
  },

  // Get recommendations based on resume
  getRecommendationsFromResume: async (): Promise<AxiosResponse<CareerRecommendation[]>> => {
    return api.get('/ai_recommendations/')
  },

  // Get recommendations based on questionnaire
  getRecommendationsFromQuestionnaire: async (): Promise<AxiosResponse<CareerRecommendation[]>> => {
    return api.get('/ai_recommendations/')
  },

  // Get combined recommendations
  getCombinedRecommendations: async (): Promise<AxiosResponse<CareerRecommendation[]>> => {
    return api.get('/ai_recommendations/')
  },

  // Save recommendation
  saveRecommendation: async (recommendationId: string): Promise<AxiosResponse<void>> => {
    return api.post(`/saved_careers/save/`, { career_id: recommendationId })
  },

  // Get saved recommendations
  getSavedRecommendations: async (): Promise<AxiosResponse<CareerRecommendation[]>> => {
    return api.get('/saved_careers/')
  },
}

// Job Search API
export const jobSearchApi = {
  // Search jobs
  searchJobs: async (params: JobSearchParams): Promise<AxiosResponse<{
    results: Job[]
    total: number
    page: number
    limit: number
    has_next: boolean
    has_previous: boolean
  }>> => {
    return api.get('/search/', { params })
  },

  // Get job details
  getJobDetails: async (jobId: string): Promise<AxiosResponse<Job>> => {
    return api.get(`/jobs/${jobId}/`)
  },

  // Save job
  saveJob: async (jobId: string): Promise<AxiosResponse<void>> => {
    return api.post(`/jobs/${jobId}/save/`)
  },

  // Unsave job
  unsaveJob: async (jobId: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/jobs/${jobId}/save/`)
  },

  // Get saved jobs
  getSavedJobs: async (): Promise<AxiosResponse<Job[]>> => {
    return api.get('/saved/')
  },

  // Apply to job
  applyToJob: async (jobId: string, applicationData?: {
    cover_letter?: string
    additional_info?: string
  }): Promise<AxiosResponse<{
    id: string
    job_id: string
    applied_at: string
    status: string
  }>> => {
    return api.post(`/jobs/${jobId}/apply/`, applicationData)
  },

  // Get job applications
  getApplications: async (): Promise<AxiosResponse<{
    id: string
    job_id: string
    job_title: string
    company: string
    applied_at: string
    status: string
  }[]>> => {
    return api.get('/applications/')
  },

  // Get job suggestions
  getJobSuggestions: async (): Promise<AxiosResponse<string[]>> => {
    return api.get('/suggestions/')
  },
}

// Utility functions
export const apiUtils = {
  // Handle API errors
  handleError: (error: any): ApiError => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        message: error.response.data?.message || 'An error occurred',
        field: error.response.data?.field,
        code: error.response.data?.code,
      }
    } else if (error.request) {
      // The request was made but no response was received
      return {
        message: 'No response from server. Please check your connection.',
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        message: error.message || 'An unexpected error occurred.',
      }
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token')
  },

  // Get auth headers
  getAuthHeaders: (): { Authorization?: string } => {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  },

  // Set auth tokens
  setAuthTokens: (access: string, refresh: string): void => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  },

  // Clear auth tokens
  clearAuthTokens: (): void => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}

// Chatbot API
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    intent?: string
    confidence?: number
    sources?: string[]
  }
}

export interface ChatSession {
  session_id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatbotResponse {
  response: string
  intent: string
  confidence: number
  suggestions?: string[]
}

export const chatbotApi = {
  // Create new chat session
  createSession: async (): Promise<AxiosResponse<{ session_id: string; message: string }>> => {
    return api.post('/chatbot/chat-sessions/create/')
  },

  // Send message to chatbot
  sendMessage: async (sessionId: string, message: string): Promise<AxiosResponse<ChatbotResponse>> => {
    return api.post(`/chatbot/chat-sessions/${sessionId}/`, { message })
  },

  // Get chat history
  getChatHistory: async (sessionId: string): Promise<AxiosResponse<{ history: ChatMessage[] }>> => {
    return api.get(`/chatbot/chat-sessions/${sessionId}/history/`)
  },

  // Get user sessions
  getUserSessions: async (): Promise<AxiosResponse<{ sessions: ChatSession[] }>> => {
    return api.get('/chatbot/chat-sessions/')
  },

  // Delete session
  deleteSession: async (sessionId: string): Promise<AxiosResponse<{ message: string }>> => {
    return api.delete(`/chatbot/chat-sessions/${sessionId}/delete/`)
  },
}

// Public Job API (for unauthenticated access)
export const publicJobApi = {
  // Get active job posts
  getActiveJobPosts: async (): Promise<AxiosResponse<{
    job_posts: Array<{
      id: number
      title: string
      description: string
      required_skills: string[]
      number_of_students_needed: number
      institution: string
      department: string
      location: string
      status: string
      created_at: string
      deadline: string
      job_provider_name: string
      applications_count: number
    }>
  }>> => {
    return api.get('/jobs/public/active/')
  },
}

// Job Application API
export const jobApplicationApi = {
  // Apply for a job
  applyForJob: async (applicationData: {
    job_post: number
    student_full_name: string
    student_department: string
    student_academic_year: string
    student_number: string
    cover_letter?: string
    cv_file?: File
  }): Promise<AxiosResponse<{
    id: number
    job_post: number
    student_full_name: string
    applied_at: string
    status: string
  }>> => {
    const formData = new FormData()
    formData.append('job_post', applicationData.job_post.toString())
    formData.append('student_full_name', applicationData.student_full_name)
    formData.append('student_department', applicationData.student_department)
    formData.append('student_academic_year', applicationData.student_academic_year)
    formData.append('student_number', applicationData.student_number)
    
    if (applicationData.cover_letter) {
      formData.append('cover_letter', applicationData.cover_letter)
    }
    
    if (applicationData.cv_file) {
      formData.append('cv_file', applicationData.cv_file)
    }
    
    return api.post('/jobs/job-applications/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Get my applications
  getMyApplications: async (): Promise<AxiosResponse<{
    applications: Array<{
      id: number
      job_post: number
      student_full_name: string
      applied_at: string
      status: string
    }>
  }>> => {
    return api.get('/jobs/job-applications/')
  },
}

// Employer Job Management API
export const employerJobApi = {
  // Create a new job
  createJob: async (jobData: {
    title: string
    description: string
    required_skills: string[]
    number_of_students_needed: number
    department: string
    location: string
    deadline: string
  }): Promise<AxiosResponse<{
    id: number
    title: string
    description: string
    required_skills: string[]
    number_of_students_needed: number
    institution: string
    department: string
    location: string
    status: string
    created_at: string
    deadline: string
    job_provider_name: string
    applications_count: number
  }>> => {
    return api.post('/jobs/create/', jobData)
  },

  // Get employer's jobs
  getMyJobs: async (): Promise<AxiosResponse<{
    jobs: Array<{
      id: number
      title: string
      description: string
      required_skills: string[]
      number_of_students_needed: number
      institution: string
      department: string
      location: string
      status: string
      created_at: string
      deadline: string
      applications_count: number
    }>
  }>> => {
    return api.get('/jobs/my-jobs/')
  },

  // Update job
  updateJob: async (jobId: number, jobData: {
    title?: string
    description?: string
    required_skills?: string[]
    number_of_students_needed?: number
    department?: string
    location?: string
    deadline?: string
    status?: string
  }): Promise<AxiosResponse<any>> => {
    return api.put(`/jobs/${jobId}/`, jobData)
  },

  // Delete job
  deleteJob: async (jobId: number): Promise<AxiosResponse<void>> => {
    return api.delete(`/jobs/${jobId}/`)
  },

  // Get applications for employer's jobs
  getJobApplications: async (): Promise<AxiosResponse<{
    applications: Array<{
      id: number
      job_post: number
      student_full_name: string
      student_department: string
      student_academic_year: string
      student_number: string
      cover_letter: string
      applied_at: string
      status: string
    }>
  }>> => {
    return api.get('/jobs/job-applications/employer/')
  },
}

// Export the main API instance for custom requests
export default api
