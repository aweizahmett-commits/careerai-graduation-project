// Environment configuration and validation

import { ENVIRONMENTS } from '../constants'

interface EnvironmentConfig {
  name: string
  apiUrl: string
  enableDebugMode: boolean
  enableAnalytics: boolean
  enableMockApi: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  apiTimeout: number
  retryAttempts: number
}

const environments: Record<string, EnvironmentConfig> = {
  [ENVIRONMENTS.DEVELOPMENT]: {
    name: ENVIRONMENTS.DEVELOPMENT,
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
    enableDebugMode: true,
    enableAnalytics: false,
    enableMockApi: process.env.REACT_APP_MOCK_API === 'true',
    logLevel: 'debug',
    apiTimeout: 10000,
    retryAttempts: 3,
  },
  [ENVIRONMENTS.TEST]: {
    name: ENVIRONMENTS.TEST,
    apiUrl: process.env.REACT_APP_API_URL || 'https://api-test.careerai.com/api/v1',
    enableDebugMode: true,
    enableAnalytics: false,
    enableMockApi: false,
    logLevel: 'warn',
    apiTimeout: 8000,
    retryAttempts: 2,
  },
  [ENVIRONMENTS.PRODUCTION]: {
    name: ENVIRONMENTS.PRODUCTION,
    apiUrl: process.env.REACT_APP_API_URL || 'https://api.careerai.com/api/v1',
    enableDebugMode: false,
    enableAnalytics: true,
    enableMockApi: false,
    logLevel: 'error',
    apiTimeout: 5000,
    retryAttempts: 1,
  },
}

function getCurrentEnvironment(): EnvironmentConfig {
  const env = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT
  const config = environments[env]

  if (!config) {
    console.warn(`Unknown environment: ${env}, falling back to development`)
    return environments[ENVIRONMENTS.DEVELOPMENT]
  }

  return config
}

function validateEnvironment(): void {
  const requiredEnvVars = ['REACT_APP_API_URL']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`)
  }

  // Validate API URL format
  const apiUrl = process.env.REACT_APP_API_URL
  if (apiUrl && !apiUrl.startsWith('http')) {
    console.error('REACT_APP_API_URL must be a valid URL starting with http:// or https://')
  }
}

// Validate environment on import
validateEnvironment()

export const environment = getCurrentEnvironment()

export default environment
