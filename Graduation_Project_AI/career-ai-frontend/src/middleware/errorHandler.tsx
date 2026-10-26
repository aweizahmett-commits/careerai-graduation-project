// Global error handling middleware

import { ErrorUtils } from '../utils'
import { STORAGE_KEYS } from '../constants'
import type { AppError } from '../types'

interface ErrorHandlerOptions {
  logToConsole?: boolean
  logToService?: boolean
  showUserNotification?: boolean
  redirectOnError?: boolean
}

class ErrorHandler {
  private options: ErrorHandlerOptions

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      logToConsole: true,
      logToService: false,
      showUserNotification: true,
      redirectOnError: false,
      ...options,
    }

    this.setupGlobalErrorHandlers()
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled Promise Rejection')
      event.preventDefault()
    })

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), 'Uncaught JavaScript Error')
    })
  }

  public handleError(error: any, context?: string): AppError {
    const appError = this.normalizeError(error, context)

    // Log to console in development
    if (this.options.logToConsole) {
      this.logToConsole(appError)
    }

    // Log to external service in production
    if (this.options.logToService) {
      this.logToService(appError)
    }

    // Show user notification
    if (this.options.showUserNotification) {
      this.showUserNotification(appError)
    }

    // Redirect on critical errors
    if (this.options.redirectOnError && this.isCriticalError(appError)) {
      this.handleCriticalError(appError)
    }

    return appError
  }

  private normalizeError(error: any, context?: string): AppError {
    if (this.isAppError(error)) {
      return {
        ...error,
        details: {
          ...error.details,
          context,
          timestamp: error.timestamp || new Date().toISOString(),
        },
      }
    }

    // Handle network errors
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
      return ErrorUtils.createError(
        'Network connection failed. Please check your internet connection.',
        'NETWORK_ERROR',
        {
          originalError: error,
          context,
        }
      )
    }

    // Handle authentication errors
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return ErrorUtils.createError(
        'Authentication failed. Please log in again.',
        'AUTH_ERROR',
        {
          status: error.response?.status,
          context,
        }
      )
    }

    // Handle server errors
    if (error?.response?.status >= 500) {
      return ErrorUtils.createError(
        'Server error occurred. Please try again later.',
        'SERVER_ERROR',
        {
          status: error.response?.status,
          context,
        }
      )
    }

    // Handle validation errors
    if (error?.response?.status === 400) {
      return ErrorUtils.createError(
        'Invalid request. Please check your input.',
        'VALIDATION_ERROR',
        {
          validationErrors: error.response?.data?.errors,
          context,
        }
      )
    }

    // Default error handling
    return ErrorUtils.createError(
      error?.message || 'An unexpected error occurred.',
      error?.code || 'UNKNOWN_ERROR',
      {
        originalError: error,
        context,
      }
    )
  }

  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'code' in error && 'message' in error
  }

  private isCriticalError(error: AppError): boolean {
    const criticalCodes = ['AUTH_ERROR', 'NETWORK_ERROR', 'SERVER_ERROR']
    return criticalCodes.includes(error.code)
  }

  private logToConsole(error: AppError): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error: ${error.code}`)
      console.error('Message:', error.message)
      console.error('Details:', error.details)
      console.error('Stack:', error.stack)
      console.groupEnd()
    } else {
      console.error(`[${error.code}] ${error.message}`)
    }
  }

  private async logToService(error: AppError): Promise<void> {
    try {
      // In production, send error to logging service
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch('/api/v1/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
              stack: error.stack,
              timestamp: error.timestamp,
              userAgent: navigator.userAgent,
              url: window.location.href,
            },
          }),
        })

        if (!response.ok) {
          console.warn('Failed to log error to service:', response.statusText)
        }
      }
    } catch (loggingError) {
      console.warn('Error logging service failed:', loggingError)
    }
  }

  private showUserNotification(error: AppError): void {
    // Create a toast notification or alert
    const message = this.getUserFriendlyMessage(error)
    
    // You can integrate with your preferred notification library here
    if (typeof window !== 'undefined' && 'alert' in window) {
      // Fallback to alert in development
      if (process.env.NODE_ENV === 'development') {
        alert(message)
      }
    }
  }

  private getUserFriendlyMessage(error: AppError): string {
    const userMessages: Record<string, string> = {
      NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
      AUTH_ERROR: 'Your session has expired. Please log in again.',
      SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
      VALIDATION_ERROR: 'Please check your input and try again.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    }

    return userMessages[error.code] || error.message
  }

  private handleCriticalError(error: AppError): void {
    if (error.code === 'AUTH_ERROR') {
      // Clear auth tokens and redirect to login
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      window.location.href = '/login'
    } else if (error.code === 'SERVER_ERROR') {
      // Redirect to error page
      window.location.href = '/error?code=' + error.code
    }
  }

  // Public methods for custom error handling
  public setOptions(options: Partial<ErrorHandlerOptions>): void {
    this.options = { ...this.options, ...options }
  }

  public createErrorBoundary(): React.ComponentType<{ children: React.ReactNode }> {
    return class ErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean; error?: Error }
    > {
      constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false }
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.handleError(error, 'React Error Boundary')
      }

      render() {
        if (this.state.hasError) {
          return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h1>Something went wrong</h1>
              <p>We're sorry, but something unexpected happened.</p>
              <button onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          )
        }

        return this.props.children
      }
    }
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler()

// Export class for creating multiple instances
export { ErrorHandler }

// Export default instance
export default errorHandler
