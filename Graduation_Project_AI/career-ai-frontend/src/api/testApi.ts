// Test API connection to backend

export const testBackendConnection = async () => {
  try {
    const response = await fetch('/api/test/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('Backend connection successful:', data)
      return { success: true, data }
    } else {
      console.error('Backend connection failed:', response.status, response.statusText)
      return { success: false, error: response.statusText }
    }
  } catch (error) {
    console.error('Backend connection error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
