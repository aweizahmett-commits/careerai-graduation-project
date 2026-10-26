// Logging middleware for the application

import environment from '../config/environment'

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
}

class Logger {
  private sessionId: string
  private userId?: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupUserIdTracking()
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private setupUserIdTracking(): void {
    // Track user ID from storage or context
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        this.userId = user.id
      } catch (error) {
        console.warn('Failed to parse user data for logging:', error)
      }
    }
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug']
    const currentLevelIndex = levels.indexOf(environment.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex <= currentLevelIndex
  }

  private formatLogMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ]

    if (entry.userId) {
      parts.push(`[User: ${entry.userId}]`)
    }

    if (entry.sessionId) {
      parts.push(`[Session: ${entry.sessionId}]`)
    }

    return parts.join(' ')
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    const message = this.formatLogMessage(entry)

    switch (entry.level) {
      case 'error':
        console.error(message, entry.data || '')
        break
      case 'warn':
        console.warn(message, entry.data || '')
        break
      case 'info':
        console.info(message, entry.data || '')
        break
      case 'debug':
        console.debug(message, entry.data || '')
        break
    }

    // In production, send logs to external service
    if (environment.name === 'production') {
      this.sendToExternalService(entry)
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // Send logs to external logging service
      await fetch('/api/v1/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      })
    } catch (error) {
      // Fail silently to avoid infinite logging loops
      console.warn('Failed to send log to external service:', error)
    }
  }

  // Public logging methods
  public error(message: string, data?: any): void {
    const entry = this.createLogEntry('error', message, data)
    this.log(entry)
  }

  public warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data)
    this.log(entry)
  }

  public info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data)
    this.log(entry)
  }

  public debug(message: string, data?: any): void {
    const entry = this.createLogEntry('debug', message, data)
    this.log(entry)
  }

  // Specialized logging methods
  public apiCall(method: string, url: string, duration: number, status?: number): void {
    this.info(`API Call: ${method} ${url}`, {
      method,
      url,
      duration,
      status,
    })
  }

  public userAction(action: string, data?: any): void {
    this.info(`User Action: ${action}`, {
      action,
      data,
    })
  }

  public performance(metric: string, value: number, unit?: string): void {
    this.info(`Performance: ${metric}`, {
      metric,
      value,
      unit,
    })
  }

  public security(event: string, data?: any): void {
    this.warn(`Security Event: ${event}`, {
      event,
      data,
    })
  }

  // Update user ID when user logs in/out
  public setUserId(userId?: string): void {
    this.userId = userId
  }

  // Create child logger with additional context
  public child(context: Record<string, any>): {
    error: (message: string, data?: any) => void
    warn: (message: string, data?: any) => void
    info: (message: string, data?: any) => void
    debug: (message: string, data?: any) => void
  } {
    return {
      error: (message: string, data?: any) => {
        this.error(message, { ...context, ...data })
      },
      warn: (message: string, data?: any) => {
        this.warn(message, { ...context, ...data })
      },
      info: (message: string, data?: any) => {
        this.info(message, { ...context, ...data })
      },
      debug: (message: string, data?: any) => {
        this.debug(message, { ...context, ...data })
      },
    }
  }
}

// Create singleton instance
export const logger = new Logger()

// Export class for creating multiple instances
export { Logger }

// Export default instance
export default logger
