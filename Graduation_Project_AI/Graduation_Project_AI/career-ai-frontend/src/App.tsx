import React, { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Import components
import SimpleHeader from './components/SimpleHeader'
import StudentLayout from './components/StudentLayout'
import AIChatbot from './components/AIChatbot'
import CursorGlow from './components/CursorGlow'

// Import pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import DualRegister from './pages/DualRegister'
import Dashboard from './pages/Dashboard'
import EmployerDashboard from './pages/EmployerDashboard'
import Community from './pages/Community'
import Profile from './pages/Profile'
import ResumeUpload from './pages/ResumeUpload'
import ResumeAnalysisResults from './pages/ResumeAnalysisResults'
import Assessment from './pages/Assessment'
import CareerResults from './pages/CareerResults'
import CareerQuestionnaire from './pages/CareerQuestionnaire'
import AIRecommendations from './pages/AIRecommendations'
import JobSearchOptimized from './pages/JobSearchOptimized'
import JobSearchRedesigned from './pages/JobSearchRedesigned'
import JobSearchFixed from './pages/JobSearchFixed'
import JobSearchRedesignedNew from './pages/JobSearchRedesignedNew'
import JobSearchProduction from './pages/JobSearchProduction'
import JobSearchDebug from './pages/JobSearchDebug'
import AIJobMatchingDashboard from './pages/AIJobMatchingDashboard'
import ApiTest from './pages/ApiTest'
import FeaturesSelection from './pages/FeaturesSelection'
import AvailableJobs from './pages/AvailableJobs'
import OstimJobs from './pages/OstimJobs'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
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

// Student Protected Route Component (with sidebar)
const StudentProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
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
  
  // Check if user is a student (not job provider)
  if (user?.role === 'job_provider') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Student Dashboard Component (rendered through nested route)
const StudentDashboard: React.FC = () => {
  return <Dashboard />
}

// Role-based Dashboard Component
const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth()
  
  if (user?.role === 'job_provider') {
    return <EmployerDashboard />
  }
  
  return (
    <StudentLayout>
      <StudentDashboard />
    </StudentLayout>
  )
}

// Public Route Component
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Login Page Component with redirect after login
const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect to features selection if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/features', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return <Login />
}

// Register Page Component with redirect after registration
const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect to features selection if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/features', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return <Register />
}

// Main App Component
const App: React.FC = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  
  // Listen for chatbot trigger events
  React.useEffect(() => {
    const handleOpenChatbot = () => setIsChatbotOpen(true)
    window.addEventListener('openChatbot', handleOpenChatbot)
    
    return () => {
      window.removeEventListener('openChatbot', handleOpenChatbot)
    }
  }, [])
  
  return (
    <AuthProvider>
      <div className="min-h-screen bg-transparent">
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

          {/* Auth Routes with simple header (logo + login/get started only) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <SimpleHeader />
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <SimpleHeader />
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register/dual"
            element={
              <PublicRoute>
                <SimpleHeader />
                <DualRegister />
              </PublicRoute>
            }
          />

          {/* Student Protected Routes with StudentLayout (sidebar for students) */}
          <Route
            path="/features"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<FeaturesSelection />} />
          </Route>
          
          <Route
            path="/profile"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<Profile />} />
          </Route>
          
          <Route
            path="/resume-upload"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<ResumeUpload />} />
          </Route>
          
          <Route
            path="/resume-analysis-results"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<ResumeAnalysisResults />} />
          </Route>
          
          <Route
            path="/assessment"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<Assessment />} />
          </Route>
          
          <Route
            path="/career-results"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<CareerResults />} />
          </Route>
          
          <Route
            path="/questionnaire"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<CareerQuestionnaire />} />
          </Route>
          
          <Route
            path="/recommendations"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<AIRecommendations />} />
          </Route>
          
          <Route
            path="/community"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<Community />} />
          </Route>
          
          <Route
            path="/ostim-jobs"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<OstimJobs />} />
          </Route>
          
          <Route
            path="/ai-matching"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<AIJobMatchingDashboard />} />
          </Route>
          
          <Route
            path="/job-search"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<JobSearchProduction />} />
          </Route>
          
          <Route
            path="/job-search-prod"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<JobSearchProduction />} />
          </Route>
          
          <Route
            path="/job-search-debug"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<JobSearchDebug />} />
          </Route>
          
          <Route
            path="/available-jobs"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<AvailableJobs />} />
          </Route>
          
          <Route
            path="/api-test"
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route index element={<ApiTest />} />
          </Route>

          {/* Dashboard Route - employers get their own layout, students get sidebar */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleBasedDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Global Dynamic Cursor Effect */}
        <CursorGlow />
        
        {/* AI Chatbot - Global across all pages */}
        <AIChatbot 
          isOpen={isChatbotOpen} 
          onClose={() => setIsChatbotOpen(false)} 
        />
      </div>
    </AuthProvider>
  )
}

export default App
