import React, { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TokenStorage from '../utils/tokenStorage'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login',
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated and authentication is required
  if (requireAuth && !isAuthenticated) {
    // Save the attempted location for redirect after login
    const returnUrl = location.pathname + location.search
    sessionStorage.setItem('returnUrl', returnUrl)
    
    return (
      <Navigate 
        to={`${redirectTo}?returnUrl=${encodeURIComponent(returnUrl)}`}
        replace 
      />
    )
  }

  // Redirect to dashboard if authenticated and authentication is not required (for login/register pages)
  if (!requireAuth && isAuthenticated) {
    const returnPath = sessionStorage.getItem('returnUrl')
    sessionStorage.removeItem('returnUrl')
    
    return (
      <Navigate 
        to={returnPath || '/dashboard'} 
        replace 
      />
    )
  }

  // Check token validity
  const accessToken = TokenStorage.getAccessToken()
  if (accessToken && TokenStorage.isTokenExpired(accessToken)) {
    console.log('Access token expired, attempting refresh...')
    
    // Try to refresh the token
    const refreshToken = TokenStorage.getRefreshToken()
    if (refreshToken && TokenStorage.isRefreshTokenValid()) {
      // Token refresh will be handled by the API interceptor
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Refreshing session...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we refresh your authentication</p>
          </div>
        </div>
      )
    } else {
      // No valid refresh token, redirect to login
      return (
        <Navigate 
          to="/login" 
          replace 
        />
      )
    }
  }

  // Render children if all checks pass
  return <>{children}</>
}

export default ProtectedRoute
