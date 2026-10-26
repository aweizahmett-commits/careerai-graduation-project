import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'

interface Question {
  id: number
  question: string
  type: 'mcq' | 'behavioral' | 'situational' | 'technical'
  options: string[]
  expected_skill: string
  correct_answer: string
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

  const analysis: Record<string, any> = location.state?.analysis ?? {}

  const [questions,    setQuestions]    = useState<Question[]>([])
  const [answers,      setAnswers]      = useState<Record<string, string>>({})
  const [loading,      setLoading]      = useState(true)
  const [retrying,     setRetrying]     = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const [genError,     setGenError]     = useState('')
  const [usedFallback, setUsedFallback] = useState(false)

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
      }
      const { data } = await api.post('/assessment/generate/', payload)
      if (!data.questions || data.questions.length === 0) {
        setGenError('The server returned no questions. Please try again.')
      } else {
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
    setAnswers(prev => ({ ...prev, [String(questionId)]: value }))
  }

  const answeredCount = questions.filter(q => {
    const a = answers[String(q.id)]
    return a && a.trim() !== ''
  }).length

  const allAnswered = questions.length > 0 && answeredCount === questions.length

  // ── Submit assessment ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!allAnswered) return
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        resume_analysis: analysis,
        questions,
        answers,
      }
      const { data } = await api.post('/assessment/submit/', payload)
      navigate('/career-results', {
        state: {
          career_matches: data.career_matches,
          analysis,
          answers,
          questions,
        },
      })
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? 'Submission failed'
      setError(msg)
      setSubmitting(false)
    }
  }

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

  if (loading) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '56px', height: '56px', border: '4px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#a5b4fc', fontSize: '1.1rem' }}>
          {retrying ? '🔄 Retrying with offline mode…' : '🤖 Generating AI Assessment Questions…'}
        </p>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Tailored to your resume and field</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (genError) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ color: '#f87171' }}>Assessment Generation Failed</h2>
        <p style={{ color: '#94a3b8', maxWidth: '480px', textAlign: 'center' }}>{genError}</p>
        <button onClick={() => generateQuestions(true)} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>
          🔄 Retry
        </button>
        <button onClick={() => navigate('/resume-analysis-results', { state: { analysis } })} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', cursor: 'pointer' }}>
          ← Back to Results
        </button>
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
            🧠 AI Assessment
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
              Questions tailored to your <strong style={{ color: '#c4b5fd' }}>{analysis.primary_field}</strong> profile
            </p>
            {usedFallback && (
              <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fcd34d', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                ⚡ Offline Mode
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
                  {answered ? '✓' : idx + 1}
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

        {/* ── Error ── */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', padding: '14px 18px', color: '#fca5a5', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Submit ── */}
        <div style={{ textAlign: 'center', paddingTop: '10px', paddingBottom: '40px' }}>
          {!allAnswered && (
            <p style={{ color: '#64748b', marginBottom: '14px', fontSize: '0.88rem' }}>
              Answer all {questions.length} questions to unlock submission
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            style={{
              padding: '16px 48px',
              background: allAnswered && !submitting
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : 'rgba(255,255,255,0.1)',
              color: allAnswered && !submitting ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: allAnswered && !submitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: allAnswered && !submitting ? '0 4px 20px rgba(16,185,129,0.35)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {submitting ? (
              <>
                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
                Generating Career Matches…
              </>
            ) : (
              '🚀 Submit & Get Career Matches'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

export default Assessment
