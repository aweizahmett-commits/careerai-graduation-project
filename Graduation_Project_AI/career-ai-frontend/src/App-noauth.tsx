import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Import components
import Header from './components/Header'
import SimpleHeader from './components/SimpleHeader'
import DashboardLayout from './components/DashboardLayout'

// Import pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ResumeUpload from './pages/ResumeUpload'
import CareerQuestionnaire from './pages/CareerQuestionnaire'
import AIRecommendations from './pages/AIRecommendations'
import JobSearch from './pages/JobSearch'
import ApiTest from './pages/ApiTest'

// Mock Auth for testing
const useAuth = () => ({
  isAuthenticated: false,
  isLoading: false,
  user: null
})

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Public Route Component
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Main App Component
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-bg">
      <Routes>
        {/* Public Routes - Landing page with simple header */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <SimpleHeader />
              <Landing />
            </PublicRoute>
          }
        />

        {/* Auth Routes with simple header */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <SimpleHeader />
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <SimpleHeader />
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes with Dashboard Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Profile />} />
        </Route>
        
        <Route
          path="/resume-upload"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ResumeUpload />} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default App
