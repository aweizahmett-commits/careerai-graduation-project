import { useState, useRef, useCallback } from 'react'

const ResumeUploadOriginal = () => {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
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

  const handleFileUpload = useCallback((file: File) => {
    setIsProcessing(true)
    
    // Simulate file upload and processing
    setTimeout(() => {
      setIsProcessing(false)
      alert('Resume uploaded and processed successfully! (Simulated)')
      console.log('File uploaded:', file.name)
    }, 3000)
  }, [])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
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
            <p style={{ opacity: 0.8 }}>
              Our AI is analyzing your resume and extracting skills. This may take a few moments.
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

export default ResumeUploadOriginal
