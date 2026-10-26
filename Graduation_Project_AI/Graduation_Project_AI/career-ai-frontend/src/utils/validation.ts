// Validation utilities

import { VALIDATION_PATTERNS } from '../constants'
import type { ValidationError } from '../types'

export class ValidationUtils {
  static validateEmail(email: string): boolean {
    return VALIDATION_PATTERNS.EMAIL.test(email)
  }

  static validatePassword(password: string): boolean {
    return VALIDATION_PATTERNS.PASSWORD.test(password)
  }

  static validatePhone(phone: string): boolean {
    return VALIDATION_PATTERNS.PHONE.test(phone)
  }

  static validateUrl(url: string): boolean {
    return VALIDATION_PATTERNS.URL.test(url)
  }

  static validateRequired(value: any): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return value !== null && value !== undefined
  }

  static validateMinLength(value: string, minLength: number): boolean {
    return value.length >= minLength
  }

  static validateMaxLength(value: string, maxLength: number): boolean {
    return value.length <= maxLength
  }

  static validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize
  }

  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '')
  }

  static generatePassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  static createValidationError(field: string, message: string, value?: any): ValidationError {
    return {
      field,
      message,
      value,
    }
  }
}
