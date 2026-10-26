// Base API client with interceptors and error handling

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '../constants'
import { StorageUtils, ErrorUtils } from '../utils'
import type { ApiResponse } from '../types'

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = StorageUtils.get(STORAGE_KEYS.ACCESS_TOKEN)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request timestamp
        config.metadata = { ...config.metadata, startTime: new Date() }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log request duration in development
        if (process.env.NODE_ENV === 'development') {
          const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime()
          console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
        }

        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            await this.refreshToken()
            const token = StorageUtils.get(STORAGE_KEYS.ACCESS_TOKEN)
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return this.instance(originalRequest)
          } catch (refreshError) {
            // Refresh failed, logout user
            this.handleAuthError()
            return Promise.reject(refreshError)
          }
        }

        // Handle network errors
        if (!error.response) {
          console.error('Network error:', error)
          return Promise.reject(ErrorUtils.createError(
            ERROR_MESSAGES.NETWORK_ERROR,
            'NETWORK_ERROR',
            { originalError: error }
          ))
        }

        // Handle server errors
        const apiError = ErrorUtils.createError(
          error.response.data?.message || ERROR_MESSAGES.SERVER_ERROR,
          error.response.data?.code || 'SERVER_ERROR',
          {
            status: error.response.status,
            data: error.response.data,
          }
        )

        return Promise.reject(apiError)
      }
    )
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = StorageUtils.get(STORAGE_KEYS.REFRESH_TOKEN)
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh/`, {
        refresh: refreshToken,
      })

      const { access, refresh } = response.data
      StorageUtils.set(STORAGE_KEYS.ACCESS_TOKEN, access)
      if (refresh) {
        StorageUtils.set(STORAGE_KEYS.REFRESH_TOKEN, refresh)
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  private handleAuthError(): void {
    StorageUtils.remove(STORAGE_KEYS.ACCESS_TOKEN)
    StorageUtils.remove(STORAGE_KEYS.REFRESH_TOKEN)
    StorageUtils.remove(STORAGE_KEYS.USER_DATA)
    
    // Redirect to login page
    window.location.href = '/login'
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, config)
    return this.transformResponse(response)
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config)
    return this.transformResponse(response)
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config)
    return this.transformResponse(response)
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data, config)
    return this.transformResponse(response)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, config)
    return this.transformResponse(response)
  }

  // File upload method
  async upload<T>(url: string, file: File, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    const uploadConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: config?.onUploadProgress,
    }

    const response = await this.instance.post(url, formData, uploadConfig)
    return this.transformResponse(response)
  }

  // Transform response to standard format
  private transformResponse<T>(response: AxiosResponse): ApiResponse<T> {
    return {
      data: response.data,
      message: response.data?.message,
      status: response.status,
      success: response.status >= 200 && response.status < 300,
    }
  }

  // Cancel request method
  createCancelToken() {
    return axios.CancelToken.source()
  }

  // Check if request was cancelled
  isCancel(error: any): boolean {
    return axios.isCancel(error)
  }

  // Set default headers
  setHeader(key: string, value: string): void {
    this.instance.defaults.headers[key] = value
  }

  // Remove default header
  removeHeader(key: string): void {
    delete this.instance.defaults.headers[key]
  }

  // Get instance for advanced usage
  getInstance(): AxiosInstance {
    return this.instance
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export class for creating multiple instances if needed
export { ApiClient }

// Export default instance
export default apiClient
