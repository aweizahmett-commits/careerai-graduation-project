export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  RESUME_UPLOAD: '/resume-upload',
  QUESTIONNAIRE: '/questionnaire',
  RECOMMENDATIONS: '/recommendations',
  JOB_SEARCH: '/job-search',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
  },
  RESUME: {
    UPLOAD: '/resume/upload',
    ANALYZE: '/resume/analyze',
  },
  QUESTIONNAIRE: {
    SUBMIT: '/questionnaire/submit',
  },
  RECOMMENDATIONS: {
    GET: '/recommendations',
  },
  JOBS: {
    SEARCH: '/jobs/search',
    GET: '/jobs/:id',
  },
} as const

export const JOB_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
} as const

export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  MID_LEVEL: 'mid-level',
  SENIOR: 'senior',
  LEAD: 'lead',
} as const
