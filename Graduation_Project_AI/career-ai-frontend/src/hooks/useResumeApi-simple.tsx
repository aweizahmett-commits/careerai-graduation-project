import { useState, useCallback } from 'react'

export const useResumeApiSimple = () => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<any>(null)

  const uploadResume = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Get auth token (use mock token since we're not using real auth)
      const token = localStorage.getItem('access_token') || 'mock-token'
      
      console.log('Starting upload for file:', file.name)
      console.log('Token:', token ? 'present' : 'missing')
      
      // Simulate progress
      setUploadProgress(20)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setUploadProgress(50)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Make real API call to backend
      setUploadProgress(70)
      console.log('Making API call to: http://127.0.0.1:8000/api/upload_resume/')
      
      const response = await fetch('http://127.0.0.1:8000/api/upload_resume/', {
        method: 'POST',
        body: formData
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('API Response:', result)
      
      setUploadProgress(90)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Store the real response data
      const fileData = {
        id: result.resume?.id || Math.random().toString(36).substr(2, 9),
        filename: result.resume?.original_filename || file.name,
        file_size: file.size,
        file_type: file.name.split('.').pop()?.toLowerCase(),
        processed: result.resume?.processed || true,
        extracted_skills: result.skills_detected || result.resume?.extracted_skills || result.extracted_skills || [],
        created_at: result.resume?.created_at || new Date().toISOString(),
        message: result.message
      }
      
      console.log('Final file data:', fileData)
      setUploadedFile(fileData)
      setUploadProgress(100)
      
      return fileData
    } catch (err: any) {
      console.error('Upload error:', err)
      const errorMessage = err.message || 'Upload failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const getResumeStatus = useCallback(async () => {
    return uploadedFile
  }, [uploadedFile])

  const deleteResume = useCallback(async () => {
    setUploadedFile(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    uploadResume,
    getResumeStatus,
    deleteResume,
    clearError,
    isUploading,
    uploadProgress,
    error,
    uploadedFile
  }
}
