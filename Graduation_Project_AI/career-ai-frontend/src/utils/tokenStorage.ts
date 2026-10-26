// Types for JWT tokens
export interface TokenPair {
  access: string
  refresh: string
}

export interface DecodedToken {
  user_id: string
  email: string
  exp: number
  iat: number
  jti: string
  token_type: string
}

// Secure token storage utilities
class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'access_token'
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token'
  private static readonly USER_KEY = 'user_data'

  // Store tokens securely
  static setTokens(tokens: TokenPair): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access)
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh)
    } catch (error) {
      console.error('Failed to store tokens:', error)
    }
  }

  // Get access token
  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY)
    } catch (error) {
      console.error('Failed to get access token:', error)
      return null
    }
  }

  // Get refresh token
  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error('Failed to get refresh token:', error)
      return null
    }
  }

  // Clear all tokens
  static clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY)
      localStorage.removeItem(this.REFRESH_TOKEN_KEY)
      localStorage.removeItem(this.USER_KEY)
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }
  }

  // Check if tokens exist
  static hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken())
  }

  // Store user data
  static setUser(userData: any): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData))
    } catch (error) {
      console.error('Failed to store user data:', error)
    }
  }

  // Get user data
  static getUser(): any | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Failed to get user data:', error)
      return null
    }
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    try {
      const decoded: DecodedToken = this.decodeToken(token)
      if (!decoded || !decoded.exp) {
        return true
      }
      
      const currentTime = Date.now() / 1000
      const expirationTime = decoded.exp
      const bufferTime = 60 // 1 minute buffer
      
      return expirationTime < (currentTime + bufferTime)
    } catch (error) {
      console.error('Failed to check token expiration:', error)
      return true
    }
  }

  // Decode JWT token (basic implementation)
  static decodeToken(token: string): DecodedToken | null {
    try {
      // For a real implementation, you'd use a JWT library like jwt-decode
      // This is a basic implementation for demonstration
      const payload = token.split('.')[1]
      if (!payload) {
        return null
      }
      
      return JSON.parse(atob(payload))
    } catch (error) {
      console.error('Failed to decode token:', error)
      return null
    }
  }

  // Get token expiration time
  static getTokenExpiration(token: string): number | null {
    try {
      const decoded: DecodedToken = this.decodeToken(token)
      return decoded?.exp || null
    } catch (error) {
      console.error('Failed to get token expiration:', error)
      return null
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const accessToken = this.getAccessToken()
    
    if (!accessToken) {
      return false
    }

    // Check if token is expired
    if (this.isTokenExpired(accessToken)) {
      console.log('Access token is expired')
      return false
    }

    return true
  }

  // Refresh token validation
  static isRefreshTokenValid(): boolean {
    const refreshToken = this.getRefreshToken()
    
    if (!refreshToken) {
      return false
    }

    // Refresh tokens typically have longer expiration
    const decoded: DecodedToken = this.decodeToken(refreshToken)
    if (!decoded || !decoded.exp) {
      return false
    }

    const currentTime = Date.now() / 1000
    const expirationTime = decoded.exp
    const bufferTime = 300 // 5 minute buffer for refresh token
    
    return expirationTime > (currentTime + bufferTime)
  }
}

export default TokenStorage
