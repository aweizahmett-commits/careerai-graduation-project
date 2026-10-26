import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface AssessmentSummary {
  percentage: number
  correct: number
  incorrect: number
  total: number
  weakAreas: string[]
  strengths: string[]
}

interface MistakeItem {
  expected_skill: string
  question: string
}

// ── Weighted career match adjustment ─────────────────────────────────────── //
// Formula: finalConfidence = resumeScore*0.6 + assessmentScore*0.4
// Per-career penalty: each required skill that falls in a weak category → -8pts (max -24)
function applyAssessmentAdjustment(
  rawMatches: CareerMatch[],
  analysis: Record<string, any>,
  summary: AssessmentSummary | null,
  mistakes: MistakeItem[]
): { matches: CareerMatch[]; confidence: number } {
  const confidenceMap: Record<string, number> = { High: 85, Medium: 65, Low: 40 }
  const resumeScore = confidenceMap[analysis?.confidence as string] ?? 65

  if (!summary) {
    return { matches: rawMatches, confidence: resumeScore }
  }

  const assessmentPct  = summary.percentage          // 0-100
  const finalConf      = Math.round(resumeScore * 0.6 + assessmentPct * 0.4)

  // Global score factor: 0.60 (0% assessment) … 1.00 (100% assessment)
  const scoreFactor = 0.60 + (assessmentPct / 100) * 0.40

  // Collect unique weak skill categories (from both weakAreas + per-question mistakes)
  const weakSet = [
    ...summary.weakAreas.map(s => s.toLowerCase()),
    ...mistakes.map(m => m.expected_skill?.toLowerCase() ?? ''),
  ].filter(Boolean)
  const uniqueWeakSet = [...new Set(weakSet)]

  const adjusted = rawMatches.map(m => {
    let score = m.match_score

    // Category-specific penalty
    const requiredLower = (m.required_skills ?? []).map(s => s.toLowerCase())
    const weakOverlap   = requiredLower.filter(rs =>
      uniqueWeakSet.some(wc => rs.includes(wc) || wc.includes(rs))
    ).length
    const categoryPenalty = Math.min(weakOverlap * 8, 24)

    // Apply global factor then subtract category penalty
    score = Math.round(score * scoreFactor) - categoryPenalty
    score = Math.max(35, Math.min(97, score))

    return { ...m, match_score: score }
  })

  // Re-sort descending
  adjusted.sort((a, b) => b.match_score - a.match_score)

  return { matches: adjusted, confidence: finalConf }
}

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

  const [matches,        setMatches]        = useState<CareerMatch[]>([])
  const [analysis,       setAnalysis]       = useState<Record<string, any>>({})
  const [expanded,       setExpanded]       = useState<Set<number>>(new Set([0]))
  const [confirmReset,   setConfirmReset]   = useState(false)
  const [loaded,         setLoaded]         = useState(false)
  const [finalConfidence,setFinalConfidence]= useState<number | null>(null)
  const adjustedRef = useRef(false)

  // Inline fallback so we never redirect back to /assessment
  const _CAREERS: Record<string, string[]> = useMemo(() => ({
    'Computer Engineering':  ['Software Engineer', 'Backend Developer', 'Full Stack Developer', 'Systems Engineer', 'DevOps Engineer'],
    'Electrical Engineering':['Embedded Systems Engineer', 'Power Systems Engineer', 'Electronics Design Engineer', 'Control Systems Engineer', 'RF Engineer'],
    'Mechanical Engineering':['Mechanical Design Engineer', 'Manufacturing Engineer', 'Thermal/HVAC Engineer', 'Structural Analyst', 'Maintenance Engineer'],
    'Civil Engineering':     ['Structural Engineer', 'Geotechnical Engineer', 'Project Manager', 'Site Engineer', 'Infrastructure Planner'],
    'Industrial Engineering':['Process Engineer', 'Operations Manager', 'Quality Engineer', 'Supply Chain Analyst', 'Lean/Six Sigma Consultant'],
  }), [])

  const buildFallback = (ana: Record<string, any>): CareerMatch[] => {
    const field  = ana?.primary_field ?? 'Computer Engineering'
    const skills = (ana?.top_skills as string[]) ?? []
    const roles  = _CAREERS[field] ?? _CAREERS['Computer Engineering']
    return roles.map((title, i) => ({
      title,
      match_score: Math.max(60, 85 - i * 5),
      reason: `Based on your ${field} background and ${skills.length} detected skills. (Offline estimate)`,
      required_skills: skills.slice(0, 3),
      missing_skills:  [],
      learning_path: [
        `1. Deepen core ${field} fundamentals`,
        '2. Build 2–3 real-world portfolio projects',
        '3. Earn a relevant industry certification',
      ],
    }))
  }

  useEffect(() => {
    if (adjustedRef.current) return   // run only once
    adjustedRef.current = true

    const state = location.state as any
    const stateAnalysis = state?.analysis ?? {}

    // ── Load assessment data ─────────────────────────────────────────────
    let summary: AssessmentSummary | null = null
    let mistakes: MistakeItem[] = []
    try { const r = localStorage.getItem('career_ai_assessment_summary'); if (r) summary = JSON.parse(r) } catch { /* ignore */ }
    try { const r = localStorage.getItem('career_ai_mistake_review');     if (r) mistakes = JSON.parse(r) } catch { /* ignore */ }

    // ── Resolve analysis ─────────────────────────────────────────────────
    const savedAnalysis = stateAnalysis.primary_field
      ? stateAnalysis
      : (() => { try { return JSON.parse(localStorage.getItem('career_ai_analysis') ?? '{}') } catch { return {} } })()

    if (!savedAnalysis.primary_field) {
      console.log('[Pipeline] CareerResults: no data after reset — showing empty state')
      setLoaded(true)
      return
    }

    // ── Resolve raw matches (router state = fresh; else fallback) ─────────
    let rawMatches: CareerMatch[]
    if (state?.career_matches && state.career_matches.length > 0) {
      rawMatches = state.career_matches
      console.log('[Pipeline] CareerResults received | matches:', rawMatches.length)
    } else {
      console.warn('[Pipeline] CareerResults: no career_matches in state — using inline fallback')
      rawMatches = buildFallback(savedAnalysis)
    }

    // ── Apply assessment-based adjustment ────────────────────────────────
    const { matches: adjusted, confidence } = applyAssessmentAdjustment(
      rawMatches, savedAnalysis, summary, mistakes
    )
    console.log('[Career] matching recalculated')
    console.log('[Career] assessment impact applied | weakAreas:', summary?.weakAreas ?? [], '| mistakes:', mistakes.length)
    console.log('[Career] confidence updated |', confidence, '% | assessmentPct:', summary?.percentage ?? 'N/A', '%')

    // ── Persist adjusted result ───────────────────────────────────────────
    const matchResult = {
      topCareers: adjusted,
      confidence,
      basedOnAssessment: summary !== null,
      whyMatched: adjusted.map(m => m.reason),
      recommendedImprovements: [...new Set(mistakes.map(m => m.expected_skill).filter(Boolean))],
      learningPath: adjusted[0]?.learning_path ?? [],
    }
    localStorage.setItem('pipeline_career_results', '1')
    localStorage.setItem('career_ai_matches', JSON.stringify(matchResult))
    console.log('[Step] career results loaded')

    setMatches(adjusted)
    setAnalysis(savedAnalysis)
    setFinalConfidence(confidence)
    setLoaded(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleResetAll = () => {
    const keys = [
      'pipeline_resume_complete', 'pipeline_assessment_complete', 'pipeline_career_results',
      'career_ai_analysis', 'career_ai_answers', 'career_ai_matches',
      'career_ai_assessment_answers', 'career_ai_career_matches',
      'career_ai_resume_id', 'career_ai_resume_name', 'career_ai_resume_size',
    ]
    keys.forEach(k => localStorage.removeItem(k))
    console.log('[Dashboard] full pipeline reset — starting new career analysis')
    navigate('/resume-upload')
  }

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

  if (!loaded) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading career matches...</p>
      </div>
    )
  }

  if (!matches.length) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ color: '#f1f5f9', fontWeight: 700 }}>No Career Results</h2>
        <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: '420px', lineHeight: 1.6 }}>
          No results found. Please complete the pipeline — upload your resume, take the assessment, and your career matches will appear here.
        </p>
        <button
          onClick={() => navigate('/resume-upload')}
          style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
        >
          Start Pipeline
        </button>
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
            Your Career Matches
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
              AI-generated based on your resume + assessment · Field:{' '}
              <strong style={{ color: '#a78bfa' }}>{analysis.primary_field ?? '—'}</strong>
            </p>
          </div>

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
            {finalConfidence !== null && (
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: finalConfidence >= 70 ? '#10b981' : finalConfidence >= 45 ? '#f59e0b' : '#f87171' }}>
                  {finalConfidence}%
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Overall Confidence</div>
              </div>
            )}
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
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>You Have</div>
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
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>To Develop</div>
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
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Learning Path</div>
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
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '10px', paddingBottom: '16px' }}>
          <button
            onClick={() => navigate('/assessment', { state: { analysis } })}
            style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            Retake Assessment
          </button>
          <button
            onClick={() => navigate('/resume-analysis-results', { state: { analysis } })}
            style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            View Resume Analysis
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            Dashboard
          </button>
        </div>

        {/* ── Reset / New Analysis ── */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '40px' }}>
          <button
            onClick={() => setConfirmReset(true)}
            style={{
              padding: '13px 32px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.15))',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Start New Career Analysis
          </button>
        </div>

        {/* ── Confirmation Modal ── */}
        {confirmReset && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}>
            <div style={{
              background: 'linear-gradient(135deg,#1e293b,#0f172a)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '20px',
              padding: '36px 32px',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}>
              <div style={{ marginBottom: '14px' }} />
              <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.2rem', marginBottom: '10px' }}>
                Start New Career Analysis?
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '28px' }}>
                Are you sure you want to start a new analysis?<br />
                <strong style={{ color: '#fca5a5' }}>This will delete your previous resume, assessment, and career match results.</strong>
                <br />This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmReset(false)}
                  style={{
                    padding: '11px 26px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetAll}
                  style={{
                    padding: '11px 26px',
                    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(239,68,68,0.35)',
                  }}
                >
                  Yes, Start Fresh
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default CareerResults
