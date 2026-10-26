import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../services/api'

// Types
export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'student' | 'job_provider'
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  registerJobProvider: (userData: JobProviderRegisterData) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
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

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// AuthProvider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        console.error('Failed to parse user data:', error)
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
      }
    }
  }, [])

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await authApi.login({ username, password })
      
      // Store tokens and user data
      localStorage.setItem('access_token', response.data.tokens.access)
      localStorage.setItem('refresh_token', response.data.tokens.refresh)
      localStorage.setItem('user_data', JSON.stringify(response.data.user))
      
      setState({
        user: { ...response.data.user, role: response.data.user.role || 'student' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      })
      throw error
    }
  }

  // Register function
  const register = async (userData: RegisterData): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await authApi.register(userData)
      
      // Store tokens and user data
      localStorage.setItem('access_token', response.data.tokens.access)
      localStorage.setItem('refresh_token', response.data.tokens.refresh)
      localStorage.setItem('user_data', JSON.stringify(response.data.user))
      
      setState({
        user: { ...response.data.user, role: response.data.user.role || 'student' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      })
      throw error
    }
  }

  // Job Provider Register function
  const registerJobProvider = async (userData: JobProviderRegisterData): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await authApi.registerJobProvider(userData)
      
      // Store tokens and user data
      localStorage.setItem('access_token', response.data.tokens.access)
      localStorage.setItem('refresh_token', response.data.tokens.refresh)
      localStorage.setItem('user_data', JSON.stringify(response.data.user))
      
      setState({
        user: { ...response.data.user, role: 'job_provider' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      })
      throw error
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Mock logout for now - will be replaced with real API
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Clear local storage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  }

  // Clear error function
  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }))
  }

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    registerJobProvider,
    logout,
    clearError,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
