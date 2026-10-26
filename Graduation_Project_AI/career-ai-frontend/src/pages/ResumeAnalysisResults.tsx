import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface RecommendedJob {
  title: string
  match_score: number
  matched_skills: string[]
  missing_skills: string[]
  reason?: string
}

interface EducationExtracted {
  degree: string
  field: string
  university: string
  status: string
}

interface ResumeAnalysis {
  primary_field: string
  confidence: string
  education_extracted?: EducationExtracted
  top_skills: string[]
  recommended_jobs: RecommendedJob[]
  skills: string[]
  experience_years: number
  education_level: string
  job_titles: string[]
  skill_categories: Record<string, string[]>
  career_suggestions: RecommendedJob[]
  confidence_score: number
  processing_time: number
  experience?: { total_years: number | null }
  education?: { highest_level: string | null }
}

const ResumeAnalysisResults = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [analysis,      setAnalysis]      = useState<ResumeAnalysis | null>(null)
  const [resumeId,      setResumeId]      = useState<string | null>(null)

  useEffect(() => {
    if (location.state?.analysis) {
      // Fresh data from navigation — always trust this over cache
      const fresh = location.state.analysis
      console.log('[Results] Received fresh backend analysis:', JSON.stringify(fresh, null, 2))
      console.log('[Results] primary_field:', fresh.primary_field)
      console.log('[Results] confidence:', fresh.confidence)
      console.log('[Results] top_skills:', fresh.top_skills)
      console.log('[Results] recommended_jobs:', fresh.recommended_jobs)
      console.log('[Step] resume parsed | field:', fresh.primary_field, '| skills:', fresh.top_skills?.length ?? 0)
      setAnalysis(fresh)
      setResumeId(location.state.resumeId)
      localStorage.setItem('career_ai_analysis', JSON.stringify(fresh))
    } else {
      const savedAnalysis = localStorage.getItem('career_ai_analysis')
      const savedResumeId = localStorage.getItem('career_ai_resume_id')
      if (savedAnalysis && savedResumeId) {
        const parsed = JSON.parse(savedAnalysis)
        console.log('[Results] Loaded from localStorage:', JSON.stringify(parsed, null, 2))
        setAnalysis(parsed)
        setResumeId(savedResumeId)
      } else {
        navigate('/resume-upload')
      }
    }
  }, [location.state, navigate])

  const handleViewJobMatches = () => {
    if (resumeId) {
      navigate('/job-search', { state: { resumeId, analysis } })
    }
  }

  const confidenceColor = (c: string) =>
    c === 'High' ? '#10b981' : c === 'Medium' ? '#f59e0b' : '#ef4444'

  const jobs = analysis?.recommended_jobs?.length
    ? analysis.recommended_jobs
    : analysis?.career_suggestions ?? []

  if (!analysis) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ opacity: 0.7 }}>Loading analysis results…</h2>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: 'white', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── Hero header ── */}
        <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '36px 32px', marginBottom: '28px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '6px', color: '#10b981', fontWeight: 700 }}>
            🧠 Resume Analysis Results
          </h1>
          <p style={{ opacity: 0.65, marginBottom: '28px', fontSize: '1rem' }}>
            Powered by AI · Results are field-specific
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#667eea' }}>{analysis.skills?.length ?? 0}</div>
              <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>Skills Detected</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#10b981' }}>{jobs.length}</div>
              <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>Job Matches</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#f59e0b' }}>
                {analysis.experience?.total_years != null
                  ? Math.round(analysis.experience.total_years * 10) / 10
                  : analysis.experience_years ?? 'N/A'}
              </div>
              <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>Yrs Experience</div>
            </div>
          </div>
        </div>

        {/* ── PRIMARY FIELD CARD ── */}
        <div style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.18) 0%, rgba(139,92,246,0.18) 100%)', border: '2px solid rgba(139,92,246,0.5)', borderRadius: '20px', padding: '32px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2.8rem' }}>🎓</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Detected Primary Field</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>
                {analysis.primary_field || 'Not detected'}
              </div>
            </div>
            {analysis.confidence && (
              <div style={{ background: `${confidenceColor(analysis.confidence)}22`, border: `2px solid ${confidenceColor(analysis.confidence)}`, borderRadius: '12px', padding: '10px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '2px' }}>Confidence</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: confidenceColor(analysis.confidence) }}>
                  {analysis.confidence}
                </div>
              </div>
            )}
          </div>

          {/* Education Extracted by AI */}
          {analysis.education_extracted && (
            <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '18px 20px' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>📚 Education (AI Extracted)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Degree',     value: analysis.education_extracted.degree },
                  { label: 'Field',      value: analysis.education_extracted.field },
                  { label: 'University', value: analysis.education_extracted.university },
                  { label: 'Status',     value: analysis.education_extracted.status },
                ].map(({ label, value }) => (
                  value && value !== 'Unknown' && value !== 'Uncertain' ? (
                    <div key={label} style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.55, marginBottom: '3px', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e9d5ff' }}>{value}</div>
                    </div>
                  ) : (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.55, marginBottom: '3px', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontSize: '0.9rem', color: '#9ca3af', fontStyle: 'italic' }}>Not detected</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Top Skills */}
          {analysis.top_skills && analysis.top_skills.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {analysis.top_skills.map((skill, i) => (
                  <span key={i} style={{ background: 'rgba(139,92,246,0.25)', border: '1px solid rgba(139,92,246,0.5)', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RECOMMENDED JOBS ── */}
        {jobs.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '30px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '6px', color: '#10b981', fontWeight: 700 }}>
              🎯 Recommended Jobs
            </h2>
            <p style={{ opacity: 0.55, fontSize: '0.88rem', marginBottom: '22px' }}>
              All recommendations belong strictly to <strong style={{ color: '#a78bfa' }}>{analysis.primary_field}</strong>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              {jobs.map((job, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px', border: `2px solid rgba(16,185,129,${Math.min(job.match_score / 100, 0.8)})`, position: 'relative', overflow: 'hidden' }}>
                  {i === 0 && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#10b981', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '8px' }}>BEST MATCH</div>
                  )}
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '10px', color: '#f0fdf4', paddingRight: i === 0 ? '80px' : '0' }}>
                    {job.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '6px' }}>
                      <div style={{ width: `${Math.round(job.match_score)}%`, background: 'linear-gradient(90deg, #10b981, #059669)', height: '100%', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', minWidth: '42px' }}>{Math.round(job.match_score)}%</span>
                  </div>
                  {job.matched_skills && job.matched_skills.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.55, marginBottom: '5px' }}>YOU HAVE</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {job.matched_skills.map((s, si) => (
                          <span key={si} style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 7px', borderRadius: '8px', fontSize: '11px' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.missing_skills && job.missing_skills.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.55, marginBottom: '5px' }}>TO DEVELOP</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {job.missing_skills.map((s, si) => (
                          <span key={si} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', padding: '2px 7px', borderRadius: '8px', fontSize: '11px', color: '#fbbf24' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.reason && (
                    <p style={{ marginTop: '12px', fontSize: '0.8rem', opacity: 0.55, fontStyle: 'italic', lineHeight: 1.4 }}>{job.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Skills & Experience grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
          {/* All Skills */}
          <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '26px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#667eea', fontWeight: 700 }}>💼 All Extracted Skills ({analysis.skills?.length ?? 0})</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', maxHeight: '260px', overflowY: 'auto' }}>
              {(analysis.skills ?? []).map((skill, i) => (
                <span key={i} style={{ background: 'rgba(102,126,234,0.2)', border: '1px solid rgba(102,126,234,0.35)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' }}>{skill}</span>
              ))}
            </div>
          </div>

          {/* Experience & Education */}
          <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '26px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#f59e0b', fontWeight: 700 }}>📊 Experience & Education</h2>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Experience:</strong>{' '}
                {analysis.experience?.total_years != null
                  ? `${Math.round(analysis.experience.total_years * 10) / 10} yrs`
                  : analysis.experience_years != null
                    ? `${analysis.experience_years} yrs`
                    : 'Not specified'}
              </div>
              <div>
                <strong>Education:</strong>{' '}
                {(() => {
                  const edu = analysis.education_extracted
                  if (edu?.degree && edu.degree !== 'Unknown' && edu?.field && edu.field !== 'Uncertain')
                    return `${edu.degree} — ${edu.field}`
                  if (edu?.degree && edu.degree !== 'Unknown')
                    return edu.degree
                  return analysis.education?.highest_level ?? analysis.education_level ?? 'Not specified'
                })()}
              </div>
            </div>
            {analysis.job_titles && analysis.job_titles.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.55, marginBottom: '8px' }}>JOB TITLES DETECTED</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.job_titles.map((t, i) => (
                    <span key={i} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── AI Assessment CTA ── */}
        <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))', border: '2px solid rgba(139,92,246,0.4)', borderRadius: '20px', padding: '28px 30px', marginBottom: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🧠</div>
          <h3 style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '1.25rem', margin: '0 0 8px' }}>
            Ready for the Next Step?
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.92rem', maxWidth: '460px', margin: '0 auto 20px' }}>
            Take an AI-powered assessment tailored to your <strong style={{ color: '#c4b5fd' }}>{analysis.primary_field}</strong> profile.
            Your answers will refine the career recommendations.
          </p>
          <button
            onClick={() => navigate('/assessment', { state: { analysis, resumeId } })}
            style={{ padding: '15px 44px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
          >
            Continue to Assessment
          </button>
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleViewJobMatches} style={{ padding: '14px 30px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
            🎯 View Job Matches
          </button>
          <button onClick={() => navigate('/resume-upload')} style={{ padding: '14px 30px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>
            📄 Upload New Resume
          </button>
        </div>

      </div>
    </div>
  )
}

export default ResumeAnalysisResults
