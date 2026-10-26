import { Link } from 'react-router-dom'

const LandingSimple = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: 'white',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ 
            fontSize: '4rem', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Career AI
          </h1>
          <p style={{ fontSize: '1.5rem', marginBottom: '40px', opacity: 0.9 }}>
            AI-Powered Career Recommendations Tailored Just For You
          </p>
          <div>
            <Link 
              to="/register"
              style={{
                display: 'inline-block',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                marginRight: '20px',
                fontSize: '18px'
              }}
            >
              Get Started Free
            </Link>
            <Link 
              to="/login"
              style={{
                display: 'inline-block',
                padding: '16px 32px',
                border: '2px solid #667eea',
                color: '#667eea',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '18px'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '30px', 
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#667eea' }}>
              🧠 AI-Powered Assessment
            </h3>
            <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
              Our advanced AI analyzes your skills, interests, and personality to provide personalized career recommendations.
            </p>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '30px', 
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#667eea' }}>
              🎯 Precision Matching
            </h3>
            <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
              Get matched with careers that align perfectly with your unique profile and career goals.
            </p>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '30px', 
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#667eea' }}>
              📚 1000+ Career Paths
            </h3>
            <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
              Explore detailed information about thousands of career options across various industries.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingSimple
