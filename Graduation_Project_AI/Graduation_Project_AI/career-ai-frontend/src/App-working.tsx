import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Import simplified components
import LandingSimple from './pages/Landing-simple'
import ResumeUploadWorking from './pages/ResumeUpload-working'

// Simple Login page
const Login = () => {
  const navigate = useNavigate()
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - store token and redirect
    localStorage.setItem('access_token', 'mock-token')
    localStorage.setItem('user_data', JSON.stringify({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe'
    }))
    navigate('/dashboard')
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        padding: '40px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
          Sign In
        </h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Email"
              required
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <input
              type="password"
              placeholder="Password"
              required
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

// Simple Dashboard
const Dashboard = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: 'white',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '40px' }}>Dashboard</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#667eea' }}>📄 Upload Resume</h3>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>
              Get AI analysis of your resume and skills
            </p>
            <a
              href="/resume-upload"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Upload Resume
            </a>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#667eea' }}>🎯 Career Assessment</h3>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>
              Complete our AI-powered career assessment
            </p>
            <button
              disabled
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'not-allowed'
              }}
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple navigation
const SimpleNav = () => {
  const navigate = useNavigate()
  
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    navigate('/')
  }
  
  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      padding: '15px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h2 style={{ color: '#667eea', margin: 0 }}>Career AI</h2>
      <button
        onClick={handleLogout}
        style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  )
}

// Protected Route
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <>
      <SimpleNav />
      {children}
    </>
  )
}

// Public Route
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('access_token')
  
  if (token) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Main App
const App: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingSimple />
          </PublicRoute>
        }
      />
      
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/resume-upload"
        element={
          <ProtectedRoute>
            <ResumeUploadWorking />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
