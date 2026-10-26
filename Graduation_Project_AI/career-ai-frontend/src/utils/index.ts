// Utility functions for the Career AI application

// Validation Utilities
export class ValidationUtils {
  static validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  }

  static validatePassword(password: string): boolean {
    return password.length >= 8
  }

  static validatePhone(phone: string): boolean {
    const phonePattern = /^[\d\s\-\+\(\)]+$/
    return phonePattern.test(phone)
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static validateRequired(value: string): boolean {
    return value.trim().length > 0
  }

  static validateMinLength(value: string, minLength: number): boolean {
    return value.length >= minLength
  }

  static validateMaxLength(value: string, maxLength: number): boolean {
    return value.length <= maxLength
  }
}

// Error Utilities
export class ErrorUtils {
  static createError(message: string, code?: string): Error {
    const error = new Error(message)
    if (code) {
      ;(error as any).code = code
    }
    return error
  }

  static isNetworkError(error: any): boolean {
    return error.code === 'NETWORK_ERROR' || error.message === 'Network Error'
  }

  static getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
    return 'An unexpected error occurred'
  }
}

// Format Utilities
export class FormatUtils {
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString()
  }

  static formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  static formatPhoneNumber(phone: string): string {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  static truncate(str: string, length: number): string {
    return str.length > length ? `${str.slice(0, length)}...` : str
  }
}

// Storage Utilities
export class StorageUtils {
  static setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  static getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return defaultValue || null
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  }

  static clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

// Array Utilities
export class ArrayUtils {
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)]
  }

  static sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
  }

  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key])
      groups[groupKey] = groups[groupKey] || []
      groups[groupKey].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// Object Utilities
export class ObjectUtils {
  static pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key]
      }
      return result
    }, {} as Pick<T, K>)
  }

  static omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj }
    keys.forEach(key => delete result[key])
    return result
  }

  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  static isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0
  }

  static merge<T extends object>(...objects: T[]): T {
    return objects.reduce((result, obj) => ({ ...result, ...obj }), {} as T)
  }
}

// String Utilities
export class StringUtils {
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  static camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
  }

  static kebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase()
  }

  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  }

  static escapeHtml(str: string): string {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  static wordCount(str: string): number {
    return str.trim().split(/\s+/).length
  }
}

// URL Utilities
export class UrlUtils {
  static buildUrl(base: string, params: Record<string, string | number>): string {
    const url = new URL(base)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
    return url.toString()
  }

  static parseUrl(url: string): {
    origin: string
    pathname: string
    search: Record<string, string>
  } {
    const parsed = new URL(url)
    const search: Record<string, string> = {}
    parsed.searchParams.forEach((value, key) => {
      search[key] = value
    })
    return {
      origin: parsed.origin,
      pathname: parsed.pathname,
      search
    }
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

// Timing Utilities
export class TimingUtils {
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }

  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
