import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface CareerMatch {
  title: string
  match_score: number
  reason: string
  required_skills: string[]
  missing_skills: string[]
  learning_path: string[]
}

const CARD = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(12px)',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '28px 30px',
  marginBottom: '22px',
} as const

const scoreColor = (s: number) =>
  s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#f87171'

const CareerResults = () => {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [matches,  setMatches]  = useState<CareerMatch[]>([])
  const [analysis, setAnalysis] = useState<Record<string, any>>({})
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))

  useEffect(() => {
    const state = location.state as any
    if (!state?.career_matches || state.career_matches.length === 0) {
      navigate('/assessment', { replace: true })
      return
    }
    setMatches(state.career_matches)
    setAnalysis(state.analysis ?? {})
  }, [location.state, navigate])

  const toggleExpand = (i: number) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const wrap = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    color: 'white',
    padding: '40px 20px',
  } as const

  if (!matches.length) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading career matches…</p>
      </div>
    )
  }

  const top = matches[0]

  return (
    <div style={wrap}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* ── Hero ── */}
        <div style={{ ...CARD, textAlign: 'center', background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.12))', borderColor: 'rgba(16,185,129,0.3)', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.1rem', color: '#34d399', fontWeight: 800, marginBottom: '6px' }}>
            🎯 Your Career Matches
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.95rem' }}>
            AI-generated based on your resume + assessment · Field:{' '}
            <strong style={{ color: '#a78bfa' }}>{analysis.primary_field ?? '—'}</strong>
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '36px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>{matches.length}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Career Matches</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#6366f1' }}>
                {Math.round(top.match_score)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Top Match Score</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
                {matches.reduce((acc, m) => acc + (m.learning_path?.length ?? 0), 0)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Learning Steps</div>
            </div>
          </div>
        </div>

        {/* ── Career Match Cards ── */}
        {matches.map((m, i) => {
          const isOpen  = expanded.has(i)
          const color   = scoreColor(m.match_score)

          return (
            <div key={i} style={{
              ...CARD,
              borderColor: i === 0 ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {i === 0 && (
                <div style={{ position: 'absolute', top: '14px', right: '14px', background: '#10b981', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                  BEST MATCH
                </div>
              )}

              {/* Title + score */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleExpand(i)}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${color}22`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9', paddingRight: i === 0 ? '90px' : 0 }}>
                    {m.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '6px', maxWidth: '200px' }}>
                      <div style={{ width: `${m.match_score}%`, background: `linear-gradient(90deg,${color},${color}bb)`, height: '100%', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontWeight: 700, color, minWidth: '42px', fontSize: '0.9rem' }}>{Math.round(m.match_score)}%</span>
                  </div>
                </div>
                <span style={{ color: '#64748b', fontSize: '1.1rem', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  {/* Reason */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px 16px', borderLeft: `3px solid ${color}` }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Why You Match</div>
                    <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.93rem' }}>{m.reason}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {/* Required skills */}
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>✅ You Have</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(m.required_skills ?? []).map((s, si) => (
                          <span key={si} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', color: '#6ee7b7' }}>{s}</span>
                        ))}
                        {(!m.required_skills || m.required_skills.length === 0) && (
                          <span style={{ color: '#475569', fontSize: '12px' }}>—</span>
                        )}
                      </div>
                    </div>

                    {/* Missing skills */}
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>🔧 To Develop</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(m.missing_skills ?? []).map((s, si) => (
                          <span key={si} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', color: '#fcd34d' }}>{s}</span>
                        ))}
                        {(!m.missing_skills || m.missing_skills.length === 0) && (
                          <span style={{ color: '#475569', fontSize: '12px' }}>None — great fit!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Learning path */}
                  {m.learning_path && m.learning_path.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>🗺️ Learning Path</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {m.learning_path.map((step, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ minWidth: '24px', height: '24px', borderRadius: '50%', background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#a5b4fc', flexShrink: 0 }}>
                              {si + 1}
                            </div>
                            <span style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5 }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '10px', paddingBottom: '40px' }}>
          <button
            onClick={() => navigate('/assessment', { state: { analysis } })}
            style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            🔄 Retake Assessment
          </button>
          <button
            onClick={() => navigate('/resume-analysis-results', { state: { analysis } })}
            style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            📄 View Resume Analysis
          </button>
          <button
            onClick={() => navigate('/resume-upload')}
            style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            ⬆️ Upload New Resume
          </button>
        </div>

      </div>
    </div>
  )
}

export default CareerResults
