import React, { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface PublicRouteProps {
  children: ReactNode
  redirectTo?: string
}

const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
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

  // If user is authenticated, redirect to dashboard or specified route
  if (isAuthenticated) {
    // Check if there's a return URL stored
    const returnPath = sessionStorage.getItem('returnUrl')
    sessionStorage.removeItem('returnUrl')
    
    return (
      <Navigate 
        to={returnPath || redirectTo} 
        replace 
      />
    )
  }

  // If user is not authenticated, render the public page
  return <>{children}</>
}

export default PublicRoute
