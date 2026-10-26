import api from '../api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  token: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
    localStorage.removeItem('authToken')
  },

  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await api.get('/auth/me')
    return response.data
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken')
  },

  getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  },

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token)
  }
}
