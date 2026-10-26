import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Import the simplified Landing page
import LandingSimple from './pages/Landing-simple'

const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Routes>
        <Route path="/" element={<LandingSimple />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
