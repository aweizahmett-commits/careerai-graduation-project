import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Simple test components
const Home = () => <div style={{ padding: '20px', background: 'white', color: 'black' }}><h1>Home Page</h1><p>App is working!</p></div>
const Login = () => <div style={{ padding: '20px', background: 'white', color: 'black' }}><h1>Login Page</h1></div>

const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'slate-900' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
