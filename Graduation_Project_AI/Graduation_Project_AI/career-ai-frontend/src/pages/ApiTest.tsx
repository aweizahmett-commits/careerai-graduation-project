import { useState, useEffect } from 'react'

const ApiTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const testConnection = async () => {
    setConnectionStatus('loading')
    setMessage('Testing connection to backend...')
    
    try {
      const response = await fetch('/api/test/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus('success')
        setMessage(`Connected successfully! Backend says: ${JSON.stringify(data)}`)
      } else {
        setConnectionStatus('error')
        setMessage(`Connection failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setConnectionStatus('error')
      setMessage(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">API Connection Test</h1>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                  connectionStatus === 'idle' ? 'bg-gray-100 text-gray-700' :
                  connectionStatus === 'loading' ? 'bg-blue-100 text-blue-700' :
                  connectionStatus === 'success' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {connectionStatus === 'idle' && 'Idle'}
                  {connectionStatus === 'loading' && 'Testing...'}
                  {connectionStatus === 'success' && 'Connected'}
                  {connectionStatus === 'error' && 'Connection Failed'}
                </div>
              </div>
              
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'loading'}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {connectionStatus === 'loading' ? 'Testing...' : 'Test Backend Connection'}
              </button>
            </div>
            
            {message && (
              <div className={`p-4 rounded-lg ${
                connectionStatus === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                connectionStatus === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                'bg-blue-50 border border-blue-200 text-blue-800'
              }`}>
                <strong>Status:</strong> {message}
              </div>
            )}
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection Details:</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Frontend:</strong> http://localhost:3000</p>
              <p><strong>Backend:</strong> http://127.0.0.1:8000</p>
              <p><strong>API Endpoint:</strong> /api/test/ (proxied to backend)</p>
              <p><strong>Proxy:</strong> Configured in vite.config.ts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiTest
