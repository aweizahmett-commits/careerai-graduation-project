import { useState, useRef, useCallback } from 'react'
import { useResumeApiSimple } from '../hooks/useResumeApi-simple'

const ResumeUploadWorking = () => {
  const { uploadResume, isUploading, uploadProgress, error, uploadedFile, deleteResume } = useResumeApiSimple()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      alert('Please upload a PDF or Word document')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      const result = await uploadResume(file)
      console.log('Upload successful:', result)
      alert('Resume uploaded and processed successfully!')
    } catch (error: any) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error.message}`)
    }
  }, [uploadResume])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: 'white', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '40px'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', textAlign: 'center' }}>
            Upload Resume
          </h1>
          
          {/* Upload Area */}
          {!uploadedFile ? (
            <div
              style={{
                border: `2px dashed ${isDragging ? '#667eea' : 'rgba(255,255,255,0.3)'}`,
                borderRadius: '12px',
                padding: '60px 20px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                background: isDragging ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255,255,255,0.05)'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div style={{ marginBottom: '30px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '40px'
                }}>
                  📄
                </div>
                
                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>
                    {isDragging ? 'Drop your resume here' : 'Drag and drop your resume here'}
                  </h3>
                  <p style={{ marginBottom: '25px', opacity: 0.8 }}>or</p>
                  <button
                    onClick={openFileDialog}
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Browse Files
                  </button>
                </div>
                
                <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '20px' }}>
                  Supported formats: PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            /* Uploaded File Display */
            <div style={{
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '12px',
              padding: '30px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '40px'
              }}>
                ✅
              </div>
              
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#10b981' }}>
                Resume Uploaded Successfully!
              </h3>
              
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '15px' }}>
                  <strong>File Name:</strong> {uploadedFile.filename}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>File Size:</strong> {formatFileSize(uploadedFile.file_size)}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>File Type:</strong> {uploadedFile.file_type?.toUpperCase()}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Status:</strong> <span style={{ color: '#10b981' }}>Processed</span>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Extracted Skills:</strong>
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {uploadedFile.extracted_skills.map((skill: string, index: number) => (
                      <span key={index} style={{
                        background: 'rgba(102, 126, 234, 0.2)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        border: '1px solid rgba(102, 126, 234, 0.3)'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Upload New Resume
                </button>
                <button
                  onClick={deleteResume}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Delete Resume
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Processing Overlay */}
      {isUploading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(102, 126, 234, 0.3)',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Processing Resume</h3>
            <p style={{ opacity: 0.8, marginBottom: '20px' }}>
              Our AI is analyzing your resume and extracting skills...
            </p>
            
            {/* Progress Bar */}
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              height: '8px',
              overflow: 'hidden',
              marginBottom: '10px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                height: '100%',
                width: `${uploadProgress}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>
              {uploadProgress}% Complete
            </p>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ResumeUploadWorking
