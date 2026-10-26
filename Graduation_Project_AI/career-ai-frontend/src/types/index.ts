// Type definitions for the Career AI application

// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
  success: boolean
}

export interface PaginatedResponse<T> {
  results: T[]
  total: number
  page: number
  limit: number
  has_next: boolean
  has_previous: boolean
  total_pages: number
}

// User Types
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string
  phone?: string
  location?: string
  bio?: string
  avatar?: string
  role: UserRole
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export type UserRole = 'user' | 'admin' | 'moderator'

// Authentication Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface DecodedToken {
  user_id: string
  email: string
  exp: number
  iat: number
  jti: string
  token_type: string
  role: UserRole
}

// Profile Types
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
  socialLinks?: SocialLinks
  preferences?: UserPreferences
}

export interface Education {
  id?: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
  isCurrent: boolean
}

export interface Experience {
  id?: string
  company: string
  position: string
  startDate: string
  endDate?: string
  description: string
  isCurrentJob: boolean
  achievements?: string[]
}

export interface SocialLinks {
  linkedin?: string
  github?: string
  twitter?: string
  website?: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  jobAlerts: boolean
  recommendations: boolean
  systemUpdates: boolean
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private'
  showEmail: boolean
  showPhone: boolean
  allowRecommendations: boolean
}

// Resume Types
export interface ResumeFile {
  id: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  uploadDate: string
  isProcessed: boolean
  extractedSkills: Skill[]
  processingStatus: ProcessingStatus
  processingError?: string
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Skill {
  name: string
  level: number
  category?: string
  confidence?: number
  description?: string
}

export interface SkillCategory {
  name: string
  skills: Skill[]
}

// Questionnaire Types
export interface QuestionnaireQuestion {
  id: string
  category: QuestionCategory
  question: string
  options: string[]
  required: boolean
  type: QuestionType
  description?: string
}

export type QuestionCategory = 
  | 'work_environment'
  | 'career_goals'
  | 'skills_interests'
  | 'work_life_balance'
  | 'industry_preferences'
  | 'location_preferences'

export type QuestionType = 'single_choice' | 'multiple_choice' | 'rating' | 'text'

export interface QuestionnaireAnswer {
  questionId: string
  answer: string | string[]
  rating?: number
}

export interface QuestionnaireSubmission {
  id: string
  userId: string
  answers: QuestionnaireAnswer[]
  submittedAt: string
  isCompleted: boolean
  completionPercentage: number
}

// Career Recommendation Types
export interface CareerRecommendation {
  id: string
  title: string
  matchScore: number
  shortDescription: string
  longDescription: string
  requiredSkills: Skill[]
  averageSalary: string
  salaryRange: {
    min: number
    max: number
    currency: string
  }
  growthRate: string
  educationLevel: EducationLevel
  workEnvironment: string
  typicalEmployers: string[]
  careerPath: CareerPathStep[]
  relatedCareers: string[]
  marketDemand: MarketDemand
  isSaved: boolean
  viewedAt?: string
}

export type EducationLevel = 
  | 'high_school'
  | 'associate'
  | 'bachelor'
  | 'master'
  | 'doctorate'
  | 'professional'

export interface CareerPathStep {
  title: string
  description: string
  typicalDuration: string
  requiredSkills: string[]
  averageSalary: string
}

export interface MarketDemand {
  current: 'low' | 'medium' | 'high'
  projected: 'declining' | 'stable' | 'growing'
  outlook: string
}

// Job Search Types
export interface Job {
  id: string
  title: string
  company: string
  location: string
  companyLogo: string
  description: string
  requirements: string[]
  responsibilities: string[]
  requiredSkills: Skill[]
  experienceLevel: ExperienceLevel
  jobType: JobType
  salary: SalaryInfo
  postedDate: string
  applicationDeadline?: string
  isRemote: boolean
  isHybrid: boolean
  companySize: CompanySize
  industry: string
  matchScore?: number
  isSaved: boolean
  isApplied: boolean
  applicationStatus?: ApplicationStatus
}

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote'
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
export type ApplicationStatus = 
  | 'applied'
  | 'viewed'
  | 'screening'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'withdrawn'

export interface SalaryInfo {
  min?: number
  max?: number
  currency: string
  period: 'hourly' | 'monthly' | 'yearly'
  isEstimated: boolean
}

export interface JobSearchParams {
  query?: string
  location?: string
  experienceLevel?: ExperienceLevel
  jobType?: JobType
  companySize?: CompanySize
  industry?: string
  isRemote?: boolean
  salaryMin?: number
  salaryMax?: number
  postedWithin?: PostedWithin
  page?: number
  limit?: number
  sortBy?: SortOption
}

export type PostedWithin = '24h' | '3d' | '7d' | '30d'
export type SortOption = 
  | 'relevance'
  | 'date_posted'
  | 'salary_desc'
  | 'salary_asc'
  | 'company'

export interface JobApplication {
  id: string
  jobId: string
  jobTitle: string
  company: string
  appliedAt: string
  status: ApplicationStatus
  coverLetter?: string
  resumeId?: string
  notes?: string
  lastUpdated: string
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: Record<string, any>
  actionUrl?: string
}

export type NotificationType = 
  | 'job_recommendation'
  | 'application_update'
  | 'profile_view'
  | 'system_update'
  | 'reminder'
  | 'achievement'

// Analytics Types
export interface UserAnalytics {
  profileViews: number
  profileCompletion: number
  skillsCount: number
  recommendationsCount: number
  applicationsCount: number
  savedJobsCount: number
  lastActiveAt: string
  joinDate: string
}

export interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalResumes: number
  totalRecommendations: number
  totalJobs: number
  averageProfileCompletion: number
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  stack?: string
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  testId?: string
}

export interface LoadingProps extends BaseComponentProps {
  isLoading: boolean
  loadingText?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface ErrorProps extends BaseComponentProps {
  error: string | AppError
  onRetry?: () => void
  onDismiss?: () => void
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: string[]
  validation?: ValidationRule[]
  description?: string
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: any
  message: string
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Event Types
export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp: number
  userId?: string
}

// Theme Types
export interface Theme {
  colors: typeof THEME_COLORS
  spacing: typeof SPACING_SCALE
  typography: typeof TYPOGRAPHY_SCALE
  breakpoints: typeof BREAKPOINTS
}

// Hook Return Types
export interface UseApiResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (data: T) => Promise<void>
}

export interface UsePaginationResult<T> {
  data: T[]
  isLoading: boolean
  error: string | null
  page: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  nextPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void
  refresh: () => Promise<void>
}

// Context Types
export interface AppState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  theme: 'light' | 'dark' | 'auto'
  notifications: Notification[]
}

// Router Types
export interface RouteConfig {
  path: string
  component: React.ComponentType
  exact?: boolean
  protected?: boolean
  layout?: React.ComponentType<{ children: React.ReactNode }>
  meta?: {
    title: string
    description: string
    keywords?: string[]
  }
}
