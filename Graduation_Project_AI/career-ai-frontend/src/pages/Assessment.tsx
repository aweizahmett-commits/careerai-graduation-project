import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'

// ── Module-level fallback helpers (no stale-closure risk) ──────────────── //
const _CAREERS: Record<string, string[]> = {
  'Computer Engineering':  ['Software Engineer', 'Backend Developer', 'Full Stack Developer', 'Systems Engineer', 'DevOps Engineer'],
  'Electrical Engineering':['Embedded Systems Engineer', 'Power Systems Engineer', 'Electronics Design Engineer', 'Control Systems Engineer', 'RF Engineer'],
  'Mechanical Engineering':['Mechanical Design Engineer', 'Manufacturing Engineer', 'Thermal/HVAC Engineer', 'Structural Analyst', 'Maintenance Engineer'],
  'Civil Engineering':     ['Structural Engineer', 'Geotechnical Engineer', 'Project Manager', 'Site Engineer', 'Infrastructure Planner'],
  'Industrial Engineering':['Process Engineer', 'Operations Manager', 'Quality Engineer', 'Supply Chain Analyst', 'Lean/Six Sigma Consultant'],
}

interface CareerMatch {
  title: string; match_score: number; reason: string
  required_skills: string[]; missing_skills: string[]; learning_path: string[]
}

function buildLocalMatches(analysis: Record<string, any>): CareerMatch[] {
  const field  = analysis?.primary_field ?? 'Computer Engineering'
  const skills = (analysis?.top_skills as string[]) ?? []
  const roles  = _CAREERS[field] ?? _CAREERS['Computer Engineering']
  return roles.map((title, i) => ({
    title,
    match_score: Math.max(60, 85 - i * 5),
    reason: `Based on your ${field} background and ${skills.length} detected skills. (Offline estimate)`,
    required_skills: skills.slice(0, 3),
    missing_skills:  [],
    learning_path:   [
      `1. Deepen core ${field} fundamentals`,
      '2. Build 2–3 real-world portfolio projects',
      '3. Earn a relevant industry certification',
    ],
  }))
}

interface Question {
  id: number
  question: string
  type: 'mcq' | 'behavioral' | 'situational' | 'technical'
  options: string[]
  expected_skill: string
  correct_answer: string
  explanation?: string
}

interface MistakeItem {
  id: number
  question: string
  expected_skill: string
  userAnswer: string
  userAnswerText: string
  correctAnswer: string
  correctAnswerText: string
  explanation: string
}

interface SummaryData {
  total: number
  correct: number
  incorrect: number
  percentage: number
  strengths: string[]
  weakAreas: string[]
  mistakeReview: MistakeItem[]
  navState: {
    career_matches: CareerMatch[]
    analysis: Record<string, any>
    answers: Record<string, string>
    questions: Question[]
    used_fallback: boolean
  }
}

function computeSummary(
  currentAnswers: Record<string, string>,
  qs: Question[]
): Omit<SummaryData, 'navState'> {
  const mcqQs    = qs.filter(q => q.type === 'mcq')
  const correct   = mcqQs.filter(q => currentAnswers[String(q.id)] === q.correct_answer)
  const incorrect = mcqQs.filter(q => currentAnswers[String(q.id)] && currentAnswers[String(q.id)] !== q.correct_answer)
  const mistakeReview: MistakeItem[] = incorrect.map(q => {
    const ua  = currentAnswers[String(q.id)] ?? ''
    const uaText  = q.options.find(o => o.startsWith(ua + ')')) ?? (ua || 'Not answered')
    const caText  = q.options.find(o => o.startsWith(q.correct_answer + ')')) ?? q.correct_answer
    return {
      id: q.id,
      question: q.question,
      expected_skill: q.expected_skill,
      userAnswer: ua,
      userAnswerText: uaText,
      correctAnswer: q.correct_answer,
      correctAnswerText: caText,
      explanation: q.explanation
        ? q.explanation
        : q.expected_skill
          ? `The correct answer is ${caText}. This tests your knowledge of ${q.expected_skill}.`
          : `The correct answer is ${caText}.`,
    }
  })
  return {
    total:         qs.length,
    correct:       correct.length,
    incorrect:     incorrect.length,
    percentage:    mcqQs.length > 0 ? Math.round((correct.length / mcqQs.length) * 100) : 0,
    strengths:     [...new Set(correct.map(q => q.expected_skill).filter(Boolean))],
    weakAreas:     [...new Set(incorrect.map(q => q.expected_skill).filter(Boolean))],
    mistakeReview,
  }
}

const CARD = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(12px)',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '28px 30px',
  marginBottom: '20px',
} as const

const Assessment = () => {
  const navigate   = useNavigate()
  const location   = useLocation()

  // Primary: router state. Fallback: localStorage (written by ResumeAnalysisResults)
  // useMemo keeps the reference stable so handleSubmit isn't recreated every render
  const analysis: Record<string, any> = useMemo(() => {
    if (location.state?.analysis) return location.state.analysis
    try {
      const saved = localStorage.getItem('career_ai_analysis')
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [questions,           setQuestions]           = useState<Question[]>([])
  const [answers,             setAnswers]             = useState<Record<string, string>>({})
  const [loading,             setLoading]             = useState(true)
  const [retrying,            setRetrying]            = useState(false)
  const [submitting,          setSubmitting]          = useState(false)
  const [submitPhase,         setSubmitPhase]         = useState<'idle'|'evaluating'|'retrying'>('idle')
  const [error,               setError]               = useState('')
  const [genError,            setGenError]            = useState('')
  const [usedFallback,        setUsedFallback]        = useState(false)
  const [showSummary,         setShowSummary]         = useState(false)
  const [summaryData,         setSummaryData]         = useState<SummaryData | null>(null)
  // These refs always hold the LATEST values — no stale-closure risk
  const answersRef      = useRef<Record<string, string>>({})

  // ── Generate questions on mount ──────────────────────────────────────
  const generateQuestions = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true)
    setLoading(true)
    setGenError('')
    try {
      const payload = {
        primary_field:       analysis.primary_field       ?? 'Other',
        top_skills:          analysis.top_skills          ?? [],
        education_extracted: analysis.education_extracted ?? {},
        confidence:          analysis.confidence          ?? 'Medium',
        experience:          analysis.experience          ?? {},
        seed:                Date.now(),
      }
      const { data } = await api.post('/assessment/generate/', payload)
      if (!data.questions || data.questions.length === 0) {
        setGenError('The server returned no questions. Please try again.')
      } else {
        console.log('[Step] assessment generated |', data.questions.length, 'questions | fallback:', data.used_fallback === true)
        setQuestions(data.questions)
        setUsedFallback(data.used_fallback === true)
      }
    } catch (err: any) {
      const status = err.response?.status
      const msg =
        status === 404 ? 'Assessment endpoint not found (404). Please check backend URL configuration.'
        : status === 503 ? 'AI service not configured on the server.'
        : status === 502 ? 'AI service error — retrying with offline mode...'
        : err.response?.data?.error ?? 'Failed to reach the backend. Is the Django server running?'
      setGenError(msg)
    } finally {
      setLoading(false)
    }
  }, [analysis])

  useEffect(() => {
    if (!analysis.primary_field) {
      navigate('/resume-upload', { replace: true })
      return
    }
    generateQuestions()
  }, [])

  // ── Answer tracking ───────────────────────────────────────────────────
  const setAnswer = (questionId: number, value: string) => {
    setAnswers(prev => {
      const next = { ...prev, [String(questionId)]: value }
      const filled = Object.values(next).filter(v => v.trim() !== '').length
      console.log(`[Pipeline] Q${questionId} answered | ${filled}/${questions.length} complete`)
      return next
    })
  }

  const answeredCount = questions.filter(q => {
    const a = answers[String(q.id)]
    return a && a.trim() !== ''
  }).length

  const allAnswered = questions.length > 0 && answeredCount === questions.length

  // ── Keep answersRef current on every render where answers changes ──────
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // ── Submit with auto-retry (max 2 retries) → frontend fallback → navigate
  const handleSubmit = useCallback(async () => {
    // Use ref for answers — guaranteed latest value even in async callbacks
    const currentAnswers = answersRef.current
    const answeredNow    = Object.values(currentAnswers).filter(v => v.trim() !== '').length

    console.log(`[Pipeline] handleSubmit fired | answeredNow=${answeredNow}/${questions.length} | field=${analysis.primary_field}`)

    setSubmitting(true)
    setError('')

    const attempt = async (n: number): Promise<void> => {
      console.log(`[Pipeline] API attempt ${n + 1}/3`)
      setSubmitPhase(n === 0 ? 'evaluating' : 'retrying')
      try {
        const { data } = await api.post('/assessment/submit/', {
          resume_analysis: analysis,
          questions,
          answers: currentAnswers,   // snapshot at submit time
        })
        console.log('[Pipeline] API success | career_matches:', data.career_matches?.length ?? 0)
        localStorage.setItem('pipeline_assessment_complete', '1')
        localStorage.setItem('career_ai_assessment_answers', JSON.stringify(currentAnswers))
        const score = computeSummary(currentAnswers, questions)
        const { mistakeReview: _mr1, ...scoreSummary1 } = score
        localStorage.setItem('career_ai_assessment_summary', JSON.stringify(scoreSummary1))
        localStorage.setItem('career_ai_mistake_review', JSON.stringify(score.mistakeReview))
        console.log('[Step] assessment complete — showing summary before career results')
        setSubmitting(false)
        setSummaryData({ ...score, navState: { career_matches: data.career_matches, analysis, answers: currentAnswers, questions, used_fallback: data.used_fallback } })
        setShowSummary(true)
      } catch (err: any) {
        console.warn(`[Pipeline] API attempt ${n + 1} failed | status=${err?.response?.status ?? 'network'}`)
        if (n < 2) {
          setError(`AI service error. Retrying (${n + 1}/2)…`)
          await new Promise(r => setTimeout(r, 1500))
          return attempt(n + 1)
        }
        // All retries exhausted — frontend fallback keeps pipeline alive
        console.log('[Pipeline] All retries exhausted — using frontend fallback matches')
        localStorage.setItem('pipeline_assessment_complete', '1')
        localStorage.setItem('career_ai_assessment_answers', JSON.stringify(currentAnswers))
        const score = computeSummary(currentAnswers, questions)
        const { mistakeReview: _mr2, ...scoreSummary2 } = score
        localStorage.setItem('career_ai_assessment_summary', JSON.stringify(scoreSummary2))
        localStorage.setItem('career_ai_mistake_review', JSON.stringify(score.mistakeReview))
        console.log('[Step] assessment complete (fallback) — showing summary before career results')
        setSubmitting(false)
        setSummaryData({ ...score, navState: { career_matches: buildLocalMatches(analysis), analysis, answers: currentAnswers, questions, used_fallback: true } })
        setShowSummary(true)
      }
    }

    await attempt(0)
  }, [analysis, questions])   // answers removed — using answersRef.current instead

  // ── Helpers ───────────────────────────────────────────────────────────
  const typeColor = (type: string) => {
    switch (type) {
      case 'mcq':         return { bg: 'rgba(99,102,241,0.2)',  border: 'rgba(99,102,241,0.5)',  label: '#a5b4fc' }
      case 'behavioral':  return { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)',  label: '#6ee7b7' }
      case 'situational': return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)',  label: '#fcd34d' }
      default:            return { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)',  label: '#c4b5fd' }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  const wrap = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    color: 'white',
    padding: '36px 20px',
  } as const

  if (loading || submitting) {
    const phaseMsg =
      submitting && submitPhase === 'retrying' ? 'Retrying career match...'
      : submitting ? 'Evaluating answers and matching careers...'
      : retrying   ? 'Retrying question generation...'
      : 'Generating Assessment Questions...'
    const subMsg =
      submitting ? 'Personalised to your resume + assessment performance'
      : 'Tailored to your resume and field'
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '56px', height: '56px', border: '4px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#a5b4fc', fontSize: '1.1rem' }}>{phaseMsg}</p>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{subMsg}</p>
        {error && <p style={{ color: '#fbbf24', fontSize: '0.85rem' }}>{error}</p>}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (genError) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ color: '#f87171' }}>Assessment Generation Failed</h2>
        <p style={{ color: '#94a3b8', maxWidth: '480px', textAlign: 'center' }}>{genError}</p>
        <button onClick={() => generateQuestions(true)} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
          Retry
        </button>
        <button onClick={() => navigate('/resume-analysis-results', { state: { analysis } })} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', cursor: 'pointer' }}>
          ← Back to Results
        </button>
      </div>
    )
  }

  // ── Assessment Review screen (user-controlled) ──
  if (showSummary && summaryData) {
    const pct      = summaryData.percentage
    const pctColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#f87171'
    const handleContinueNow = () => navigate('/career-results', { state: summaryData!.navState })

    return (
      <div style={wrap}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>

          {/* ── Score card ── */}
          <div style={{ ...CARD, textAlign: 'center', background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.12))', borderColor: 'rgba(139,92,246,0.35)' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#a5b4fc', fontWeight: 800, marginBottom: '4px' }}>Assessment Complete</h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '22px' }}>
              Review your results below, then continue when ready.
            </p>

            <div style={{ fontSize: '3.5rem', fontWeight: 800, color: pctColor, lineHeight: 1, marginBottom: '4px' }}>{pct}%</div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '22px' }}>MCQ Score</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '36px', marginBottom: '22px', flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>{summaryData.total}</div><div style={{ fontSize: '0.76rem', color: '#64748b' }}>Total</div></div>
              <div><div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981' }}>{summaryData.correct}</div><div style={{ fontSize: '0.76rem', color: '#64748b' }}>Correct</div></div>
              <div><div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>{summaryData.incorrect}</div><div style={{ fontSize: '0.76rem', color: '#64748b' }}>Incorrect</div></div>
            </div>

            {summaryData.strengths.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Strengths</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                  {summaryData.strengths.map((s, i) => (
                    <span key={i} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', color: '#6ee7b7' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {summaryData.weakAreas.length > 0 && (
              <div>
                <p style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Areas to Improve</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                  {summaryData.weakAreas.map((s, i) => (
                    <span key={i} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', color: '#fcd34d' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Per-question mistake review ── */}
          {summaryData.mistakeReview.length > 0 && (
            <>
              <p style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                Question Review — {summaryData.mistakeReview.length} incorrect answer{summaryData.mistakeReview.length > 1 ? 's' : ''}
              </p>
              {summaryData.mistakeReview.map((item, i) => (
                <div key={item.id} style={{ ...CARD, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
                    Question {i + 1}
                    {item.expected_skill && (
                      <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '1px 8px', borderRadius: '20px', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>{item.expected_skill}</span>
                    )}
                  </p>
                  <p style={{ color: '#f1f5f9', fontSize: '0.95rem', lineHeight: 1.55, marginBottom: '14px' }}>{item.question}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0, paddingTop: '2px' }}>Your Answer</span>
                      <span style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{item.userAnswerText}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0, paddingTop: '2px' }}>Correct</span>
                      <span style={{ color: '#6ee7b7', fontSize: '0.9rem' }}>{item.correctAnswerText}</span>
                    </div>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>{item.explanation}</p>
                </div>
              ))}
            </>
          )}

          {/* ── Manual controls ── */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: '40px' }}>
            <button
              onClick={handleContinueNow}
              style={{ padding: '14px 36px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}
            >
              Continue to Career Matching
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ padding: '14px 24px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ ...CARD, textAlign: 'center', marginBottom: '28px', background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))', borderColor: 'rgba(139,92,246,0.35)' }}>
          <h1 style={{ fontSize: '2rem', color: '#a5b4fc', fontWeight: 800, marginBottom: '6px' }}>
            AI Assessment
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
              Questions tailored to your <strong style={{ color: '#c4b5fd' }}>{analysis.primary_field}</strong> profile
            </p>
            {usedFallback && (
              <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fcd34d', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                Offline Mode
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', marginBottom: '8px' }}>
            <div style={{
              width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%`,
              background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
              height: '100%',
              borderRadius: '999px',
              transition: 'width 0.35s ease',
            }} />
          </div>
          <p style={{ color: '#64748b', fontSize: '0.82rem' }}>
            {answeredCount} / {questions.length} answered
          </p>
        </div>

        {/* ── Questions ── */}
        {questions.map((q, idx) => {
          const colors  = typeColor(q.type)
          const current = answers[String(q.id)] ?? ''
          const answered = current.trim() !== ''

          return (
            <div key={q.id} style={{
              ...CARD,
              borderColor: answered ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)',
              transition: 'border-color 0.2s',
            }}>
              {/* Question header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
                <div style={{ minWidth: '34px', height: '34px', background: answered ? '#10b981' : 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', transition: 'background 0.2s', flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.label, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                      {q.type}
                    </span>
                    {q.expected_skill && (
                      <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', padding: '2px 10px', borderRadius: '20px', fontSize: '11px' }}>
                        {q.expected_skill}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.55, color: '#f1f5f9' }}>
                    {q.question}
                  </p>
                </div>
              </div>

              {/* MCQ options */}
              {q.type === 'mcq' && q.options.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.map((opt, oi) => {
                    const optKey  = opt.charAt(0)
                    const selected = current === optKey
                    return (
                      <label key={oi} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: selected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${selected ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                        transition: 'all 0.15s',
                      }}>
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={optKey}
                          checked={selected}
                          onChange={() => setAnswer(q.id, optKey)}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          border: `2px solid ${selected ? '#6366f1' : 'rgba(255,255,255,0.3)'}`,
                          background: selected ? '#6366f1' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {selected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                        </div>
                        <span style={{ color: selected ? '#e0e7ff' : '#cbd5e1', fontSize: '0.93rem' }}>{opt}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Open-text (behavioral / situational / technical non-MCQ) */}
              {q.type !== 'mcq' && (
                <textarea
                  value={current}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  placeholder="Type your answer here…"
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${current.trim() ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: '12px',
                    color: 'white',
                    padding: '12px 16px',
                    fontSize: '0.93rem',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.55,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
              )}
            </div>
          )
        })}

        {/* ── Submit section ── */}
        <div style={{ paddingTop: '10px', paddingBottom: '40px' }}>

          {/* Submit button */}
          {!allAnswered && (
            <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '14px', fontSize: '0.88rem' }}>
              Answer all {questions.length} questions to submit
            </p>
          )}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              style={{ padding: '16px 48px', background: allAnswered ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.06)', color: allAnswered ? 'white' : '#475569', border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '1.05rem', cursor: allAnswered ? 'pointer' : 'not-allowed', boxShadow: allAnswered ? '0 4px 20px rgba(16,185,129,0.35)' : 'none', transition: 'all 0.2s' }}
            >
              Submit Assessment
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Assessment
