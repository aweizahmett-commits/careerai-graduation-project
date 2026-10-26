import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'
import {
  BrainCircuit,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Upload,
  Briefcase,
  Award,
  Lock,
  Users,
  MapPin,
  X,
  RotateCcw
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [progress, setProgress] = useState({
    resume_uploaded: false,
    assessment_completed: false,
    career_matches_ready: false,
    current_step: 'upload_resume'
  })
  const [pipelineData, setPipelineData] = useState<{
    analysis: Record<string, any>
    answers:  Record<string, string>
    matches:  any[]
  }>({ analysis: {}, answers: {}, matches: [] })

  // Calculate completion percentages based on progress
  const profileCompletion = progress.resume_uploaded ? 100 : 25
  const assessmentProgress = progress.assessment_completed ? 100 : (progress.resume_uploaded ? 50 : 0)

  const loadPipelineData = () => {
    const parseLS = (key: string, fallback: any) => {
      try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
    }
    setPipelineData({
      analysis: parseLS('career_ai_analysis', {}),
      answers:  parseLS('career_ai_assessment_answers', {}),
      matches:  parseLS('career_ai_career_matches', []),
    })
  }

  useEffect(() => {
    fetchUserProgress()
    loadPipelineData()
    const onStorage = () => { fetchUserProgress(); loadPipelineData() }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleResetCareerMatches = () => {
    localStorage.removeItem('pipeline_career_results')
    localStorage.removeItem('career_ai_career_matches')
    // Set state directly — do not rely on async fetchUserProgress which may re-merge stale API data
    setProgress(prev => ({ ...prev, career_matches_ready: false }))
    setPipelineData(prev => ({ ...prev, matches: [] }))
    console.log('[Dashboard] career matches cancelled — returning to step 3')
  }

  const handleResetAll = () => {
    if (!window.confirm(
      'Are you sure you want to start a new analysis?\nThis will delete your previous resume, assessment, and career match results.'
    )) return
    const keys = [
      'pipeline_resume_complete', 'pipeline_assessment_complete', 'pipeline_career_results',
      'career_ai_analysis', 'career_ai_answers', 'career_ai_matches',
      'career_ai_assessment_answers', 'career_ai_career_matches',
      'career_ai_resume_id', 'career_ai_resume_name', 'career_ai_resume_size',
    ]
    keys.forEach(k => localStorage.removeItem(k))
    // Reset state synchronously — API must not overwrite this
    setProgress({ resume_uploaded: false, assessment_completed: false, career_matches_ready: false, current_step: 'upload_resume' })
    setPipelineData({ analysis: {}, answers: {}, matches: [] })
    console.log('[Dashboard] full pipeline reset — returning to new user flow')
  }

  const fetchUserProgress = async () => {
    // Read localStorage first — always available, survives page refresh
    const localProgress = {
      resume_uploaded:       !!(localStorage.getItem('pipeline_resume_complete') || localStorage.getItem('career_ai_analysis')),
      assessment_completed:  !!localStorage.getItem('pipeline_assessment_complete'),
      career_matches_ready:  !!localStorage.getItem('pipeline_career_results'),
      current_step: (() => {
        if (localStorage.getItem('pipeline_career_results'))    return 'career_matches'
        if (localStorage.getItem('pipeline_assessment_complete')) return 'career_matches'
        if (localStorage.getItem('career_ai_analysis'))         return 'assessment'
        return 'upload_resume'
      })(),
    }
    setProgress(localProgress)
    const mode = localProgress.career_matches_ready ? 'results' : 'new-user'
    console.log(`[Dashboard] mode=${mode} | step=${localProgress.current_step}`)
    if (mode === 'results') console.log('[Dashboard] results mode — showing AI pipeline summary')
    else                   console.log('[Dashboard] new user flow — showing guided step cards')
    if (localProgress.resume_uploaded)      console.log('[Dashboard] step unlocked: AI Assessment')
    if (localProgress.assessment_completed) console.log('[Dashboard] step unlocked: Career Matching')
    // Optionally sync from API (non-blocking, best-effort)
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get('http://localhost:8000/api/progress/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      // Only merge non-pipeline fields — localStorage is the source of truth for step flags
      const { resume_uploaded: _r, assessment_completed: _a, career_matches_ready: _c, current_step: _s, ...extra } = response.data
      setProgress(prev => ({ ...prev, ...extra }))
    } catch {
      // localStorage state is sufficient
    }
  }

  // Define progress steps
  const progressSteps = [
    {
      id: 'upload_resume',
      name: 'Upload Resume',
      href: '/resume-upload',
      completed: progress.resume_uploaded,
      locked: false,
      current: progress.current_step === 'upload_resume' && !progress.resume_uploaded
    },
    {
      id: 'assessment',
      name: 'Assessment',
      href: '/assessment',
      completed: progress.assessment_completed,
      locked: !progress.resume_uploaded,
      current: progress.current_step === 'assessment' && !progress.assessment_completed
    },
    {
      id: 'career_matches',
      name: 'Career Matches',
      href: '/career-results',
      completed: progress.career_matches_ready,
      locked: !progress.assessment_completed,
      current: progress.current_step === 'career_matches' && !progress.career_matches_ready
    },
    {
      id: 'job_search',
      name: 'Job Search',
      href: '/job-search',
      completed: false,
      locked: !progress.career_matches_ready,
      current: progress.current_step === 'job_search'
    },
    {
      id: 'ostim_jobs',
      name: 'Ostim Jobs',
      href: '/job-search',
      completed: false,
      locked: !progress.career_matches_ready,
      current: false
    },
    {
      id: 'community',
      name: 'Community',
      href: '/community',
      completed: false,
      locked: false,
      current: false
    }
  ]

  // ── Derived from real pipeline data ──────────────────────────────────
  const { analysis, answers, matches } = pipelineData
  const topMatch      = matches[0] ?? null
  const topMatchScore = topMatch?.match_score ?? 0
  const skillList     = (analysis.top_skills as string[] | undefined) ?? []
  const skillCount    = skillList.length
  const primaryField  = (analysis.primary_field as string | undefined) ?? ''
  const eduData       = (analysis.education_extracted as any) ?? {}
  const answerCount   = Object.keys(answers).length

  // ── Dashboard mode ────────────────────────────────────────────
  const pipelineComplete = progress.career_matches_ready

  // Core pipeline steps — sequential locking logic
  const pipelineCoreSteps = [
    {
      id: 'upload_resume', num: 1,
      title: 'Upload Resume',
      description: 'Upload your CV for AI-powered analysis — skills, education, and experience extraction.',
      Icon: Upload,
      href: '/resume-upload',
      color: 'from-blue-500 to-cyan-600',
      completed: progress.resume_uploaded,
      active: !progress.resume_uploaded,
      locked: false,
    },
    {
      id: 'assessment', num: 2,
      title: 'AI Assessment',
      description: 'Answer 7 personalised questions generated from your resume to evaluate real skills.',
      Icon: BrainCircuit,
      href: '/assessment',
      color: 'from-indigo-500 to-violet-600',
      completed: progress.assessment_completed,
      active: progress.resume_uploaded && !progress.assessment_completed,
      locked: !progress.resume_uploaded,
    },
    {
      id: 'career_matching', num: 3,
      title: 'Career Matching',
      description: 'Get AI-generated career matches tailored to your resume and assessment answers.',
      Icon: Briefcase,
      href: '/career-results',
      color: 'from-emerald-500 to-green-600',
      completed: progress.career_matches_ready,
      active: progress.assessment_completed && !progress.career_matches_ready,
      locked: !progress.assessment_completed,
    },
  ] as const

  // Always-accessible tools (consume AI data if available)
  const openTools = [
    {
      title: 'Job Search',
      description: matches.length > 0
        ? `Find jobs matching “${topMatch?.title ?? 'your career'}”`
        : 'Search global job opportunities',
      Icon: Target, href: '/job-search', color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Ostim Search',
      description: matches.length > 0
        ? `Local ${primaryField || 'industry'} openings near you`
        : 'Local Ostim industrial job listings',
      Icon: MapPin, href: '/job-search', color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Community',
      description: 'Connect with peers, share insights & get mentored',
      Icon: Users, href: '/community', color: 'from-teal-500 to-cyan-600',
    },
  ] as const

  const careerMatches = matches.length > 0
    ? matches.slice(0, 4).map((m: any) => ({
        career: m.title,
        match:  m.match_score,
        category: primaryField || 'Engineering',
      }))
    : [
        { career: 'Senior Software Engineer', match: 92, category: 'Technology' },
        { career: 'Product Manager',           match: 85, category: 'Management' },
        { career: 'Data Scientist',            match: 78, category: 'Analytics'  },
        { career: 'UX Designer',               match: 71, category: 'Design'     },
      ]

  const trendingCareers = [
    { title: "AI/ML Engineer", growth: "+35%", demand: "Very High" },
    { title: "Data Scientist", growth: "+28%", demand: "High" },
    { title: "Cloud Architect", growth: "+22%", demand: "High" },
    { title: "DevOps Engineer", growth: "+18%", demand: "High" }
  ]

  const careerRoadmap = (() => {
    if (topMatch?.learning_path?.length > 0) {
      return (topMatch.learning_path as string[]).slice(0, 5).map((s, i) => ({
        step:        s.replace(/^\d+[.)\s]+/, ''),
        status:      i === 0 ? 'current' : 'pending',
        description: `Your path to ${topMatch.title}`,
      }))
    }
    if (primaryField) {
      return [
        { step: primaryField,                               status: 'completed',                                          description: `${analysis.confidence ?? 'Medium'} confidence` },
        { step: skillCount > 0 ? `${skillCount} Skills Detected` : 'Skills — none yet', status: skillCount > 0 ? 'completed' : 'pending', description: skillList.slice(0, 3).join(', ') || '—' },
        { step: eduData?.degree ? `${eduData.degree} in ${eduData.field ?? ''}` : 'Education', status: eduData?.degree ? 'completed' : 'pending', description: eduData?.university ?? '' },
        { step: 'Assessment',    status: progress.assessment_completed ? 'completed' : 'current',  description: answerCount > 0 ? `${answerCount} answers recorded` : 'AI-powered skill validation' },
        { step: 'Career Matches',status: progress.career_matches_ready ? 'completed' : 'pending', description: matches.length > 0 ? `${matches.length} paths identified` : 'Personalised career paths' },
      ]
    }
    return [
      { step: 'Foundation Skills',  status: 'completed', description: 'Complete technical fundamentals' },
      { step: 'Specialization',     status: 'current',   description: 'Focus on AI/ML specialization'   },
      { step: 'Portfolio Building', status: 'pending',   description: 'Create impressive project portfolio' },
      { step: 'Networking',         status: 'pending',   description: 'Build professional network'       },
      { step: 'Job Applications',   status: 'pending',   description: 'Apply to target positions'        },
    ]
  })()

  const aiInsights = topMatch
    ? {
        topRecommendation: topMatch.title,
        reasoning: topMatch.reason || `Based on your ${primaryField || 'engineering'} background and assessment performance.`,
        matchScore: topMatch.match_score,
        marketDemand: 'High',
        salaryRange: '—',
        growthPotential: topMatchScore >= 80 ? 'Excellent' : topMatchScore >= 65 ? 'Good' : 'Moderate',
      }
    : {
        topRecommendation: progress.career_matches_ready ? 'View Results' : 'Complete Assessment',
        reasoning: primaryField
          ? `Resume analyzed — field: ${primaryField}. Complete the assessment to generate your career matches.`
          : 'Upload your resume and complete the AI assessment to receive personalized career recommendations.',
        matchScore: 0,
        marketDemand: '—',
        salaryRange: '—',
        growthPotential: '—',
      }

  const { theme } = useTheme()
  const dark = theme === 'dark'

  const pageBg      = dark ? 'bg-[#09090b]'                                              : 'bg-slate-50'
  const card        = dark ? 'bg-white/[0.03] border border-white/[0.07] rounded-2xl backdrop-blur-sm'
                           : 'bg-white border border-slate-200 shadow-sm rounded-2xl'
  const textPrimary = dark ? 'text-white'        : 'text-slate-900'
  const textSub     = dark ? 'text-neutral-400'  : 'text-slate-500'
  const textMuted   = dark ? 'text-neutral-500'  : 'text-slate-400'
  const secBorder   = dark ? 'border-white/[0.06]' : 'border-slate-200'
  const headerBg    = dark ? 'border-white/[0.06] bg-white/[0.02] backdrop-blur-xl'
                           : 'border-slate-200 bg-white/90 backdrop-blur-xl'
  const insightCard = dark ? 'border border-indigo-500/20 bg-gradient-to-br from-indigo-950/60 via-violet-950/40 to-[#09090b]'
                           : 'border border-indigo-200 bg-gradient-to-br from-indigo-50 via-violet-50 to-slate-50'
  const insightLabel = dark ? 'text-indigo-400' : 'text-indigo-600'
  const insightGlow  = dark ? 'bg-indigo-600/15' : 'bg-indigo-300/15'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      {/* Fixed ambient glows */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className={`absolute top-0 left-1/3 w-[600px] h-[400px] rounded-full blur-[140px] ${dark ? 'bg-indigo-600/7' : 'bg-indigo-400/5'}`} />
        <div className={`absolute top-1/2 right-0 w-[400px] h-[500px] rounded-full blur-[120px] ${dark ? 'bg-violet-700/5' : 'bg-violet-400/4'}`} />
      </div>

      <div className="relative z-10">
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`border-b ${headerBg}`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <span className={`font-bold text-base ${textPrimary}`}>Career AI</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Jobs', href: '/job-search' },
                { label: 'Community', href: '/community' },
              ].map(n => (
                <Link key={n.label} to={n.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <div className={`text-sm font-semibold leading-none ${textPrimary}`}>{user?.first_name || 'User'}</div>
                  <div className={`text-[11px] mt-0.5 ${textMuted}`}>Member</div>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <span className="text-white font-bold text-sm">{user?.first_name?.[0]?.toUpperCase() || 'U'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-5 pb-10">

          {/* ── Hero Welcome Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
            className={`relative rounded-3xl overflow-hidden border ${
              dark ? 'border-indigo-500/20' : 'border-indigo-200'}`}
            style={{ background: dark
              ? 'linear-gradient(135deg, rgba(30,27,75,0.9) 0%, rgba(17,13,50,0.85) 50%, rgba(9,9,11,0.95) 100%)'
              : 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 60%, #fafafa 100%)' }}
          >
            <div className="absolute inset-0 [background-image:linear-gradient(rgba(99,102,241,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.055)_1px,transparent_1px)] [background-size:44px_44px]" />
            <div className="absolute -top-16 left-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-[70px]" />
            <div className="absolute -bottom-16 right-1/3 w-52 h-52 bg-violet-600/15 rounded-full blur-[60px]" />

            <div className="relative p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Greeting */}
              <div className="flex-1">
                <h1 className={`text-2xl lg:text-3xl font-bold mb-2 ${textPrimary}`}>
                  Dashboard
                </h1>
                <p className={`text-sm leading-relaxed max-w-sm mb-4 ${textSub}`}>
                  {!progress.resume_uploaded
                    ? 'Upload your resume to unlock AI-powered career analysis and personalized matches.'
                    : !progress.assessment_completed
                    ? 'Resume analyzed! Take the AI assessment to discover your best career paths.'
                    : 'Your career matches are ready — explore opportunities tailored just for you.'}
                </p>
                <Link
                  to={progressSteps.find(s => !s.completed && !s.locked)?.href || '/dashboard'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25">
                  Continue Journey <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Inline progress stepper */}
              <div className="flex items-start">
                {progressSteps.map((step, i) => (
                  <div key={step.id} className="flex items-center">
                    {i > 0 && (
                      <div className={`w-8 lg:w-14 h-px mt-[-20px] ${step.completed
                        ? 'bg-indigo-500'
                        : dark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    )}
                    <div className="flex flex-col items-center gap-1.5 px-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step.completed
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : step.locked
                          ? dark ? 'bg-white/5 text-white/25 border border-white/10' : 'bg-slate-100 text-slate-300 border border-slate-200'
                          : dark ? 'bg-indigo-600/25 border-2 border-indigo-500 text-indigo-400' : 'bg-indigo-100 border-2 border-indigo-400 text-indigo-600'
                      }`}>
                        {step.completed ? <CheckCircle className="w-4 h-4" /> : <span>{i + 1}</span>}
                      </div>
                      <span className={`text-[10px] whitespace-nowrap font-medium ${
                        step.completed ? (dark ? 'text-indigo-400' : 'text-indigo-600')
                        : step.locked   ? (dark ? 'text-neutral-700' : 'text-slate-300')
                        : (dark ? 'text-neutral-400' : 'text-slate-500')
                      }`}>{step.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Stats Row ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {([
              { Icon: BrainCircuit, bg: 'bg-indigo-500/15', col: 'text-indigo-400', val: `${profileCompletion}%`, lbl: 'Profile Complete',   bar: true,  bc: 'from-indigo-500 to-indigo-400',   bv: profileCompletion },
              { Icon: Target,       bg: 'bg-violet-500/15',  col: 'text-violet-400',  val: topMatchScore > 0 ? `${topMatchScore}%` : '—',  lbl: 'Top Career Match',   bar: true,  bc: 'from-violet-500 to-violet-400',   bv: topMatchScore },
              { Icon: TrendingUp,   bg: 'bg-emerald-500/15', col: 'text-emerald-400', val: `${assessmentProgress}%`, lbl: 'Assessment',       bar: true,  bc: 'from-emerald-500 to-emerald-400', bv: assessmentProgress },
              { Icon: Award,        bg: 'bg-amber-500/15',   col: 'text-amber-400',   val: skillCount > 0 ? String(skillCount) : '—', lbl: 'Skills Verified', bar: false, bc: '', bv: Math.min(skillCount, 12) },
            ] as { Icon: React.ElementType; bg: string; col: string; val: string; lbl: string; bar: boolean; bc: string; bv: number }[]).map((s, i) => (
              <motion.div key={s.lbl}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                className={`${card} p-5`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 ${s.bg} rounded-xl`}><s.Icon className={`w-4 h-4 ${s.col}`} /></div>
                  <span className={`text-2xl font-bold ${textPrimary}`}>{s.val}</span>
                </div>
                <p className={`text-xs mb-2 ${textSub}`}>{s.lbl}</p>
                {s.bar ? (
                  <div className={`w-full rounded-full h-1 ${dark ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <motion.div className={`bg-gradient-to-r ${s.bc} h-1 rounded-full`}
                      initial={{ width: 0 }} animate={{ width: `${s.bv}%` }} transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }} />
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {[...Array(Math.max(1, s.bv || 8))].map((_, j) => <span key={j} className="h-1 w-1 bg-amber-500 rounded-full inline-block" />)}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* ── Main content: two-state rendering ── */}
          {pipelineComplete ? (
            /* ─────────────────────────────────────────────
               STATE 2 — RESULTS MODE
               (pipeline is fully complete)
               ───────────────────────────────────────────── */
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-semibold uppercase tracking-widest ${textMuted}`}>Objectives</p>
                <button
                  onClick={handleResetAll}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                    dark
                      ? 'text-neutral-500 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.05] hover:border-red-500/20'
                      : 'text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200'}`}>
                  <RotateCcw className="w-3 h-3" /> Start Over
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Resume Insights */}
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                  <Link to="/resume-analysis-results"
                    className={`group block rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.02] ${
                      dark ? 'bg-white/[0.03] border border-white/[0.07] hover:border-blue-500/25'
                           : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg'}`}>
                    <div className="inline-flex p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl mb-3 shadow-lg">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 ${textPrimary}`}>Resume Insights</h3>
                    <p className={`text-xs mb-2 ${textSub}`}>{primaryField || 'No analysis yet'}</p>
                    {skillList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {skillList.slice(0, 3).map(sk => (
                          <span key={sk} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${dark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>{sk}</span>
                        ))}
                        {skillList.length > 3 && <span className={`text-[10px] ${textMuted}`}>+{skillList.length - 3}</span>}
                      </div>
                    )}
                    {eduData?.degree && <p className={`text-[10px] ${textMuted}`}>{eduData.degree}{eduData.field ? ` · ${eduData.field}` : ''}</p>}
                    <span className="inline-flex items-center gap-1 text-blue-400 text-xs font-medium mt-2">
                      View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </motion.div>

                {/* Assessment Summary */}
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.26 }}>
                  <Link to="/assessment"
                    className={`group block rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.02] ${
                      dark ? 'bg-white/[0.03] border border-white/[0.07] hover:border-indigo-500/25'
                           : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg'}`}>
                    <div className="inline-flex p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-3 shadow-lg">
                      <BrainCircuit className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 ${textPrimary}`}>Assessment</h3>
                    <p className={`text-xs mb-2 ${textSub}`}>{answerCount > 0 ? `${answerCount} questions answered` : 'Not yet taken'}</p>
                    <div className={`text-[10px] px-2 py-1 rounded-lg inline-block ${
                      dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>✓ Completed</div>
                    <span className="inline-flex items-center gap-1 text-indigo-400 text-xs font-medium mt-2">
                      Retake <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </motion.div>

                {/* Career Match Summary */}
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.32 }}>
                  <div className={`relative rounded-2xl p-5 h-full ${
                    dark ? 'bg-white/[0.03] border border-white/[0.07]'
                         : 'bg-white border border-slate-200'}`}>
                    {/* Cancel button */}
                    <button
                      onClick={handleResetCareerMatches}
                      title="Cancel career match data"
                      className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${
                        dark ? 'text-neutral-600 hover:text-red-400 hover:bg-red-500/10'
                             : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="inline-flex p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-3 shadow-lg">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 ${textPrimary}`}>Career Matches</h3>
                    <div className="space-y-1 mb-2">
                      {matches.slice(0, 3).map((m: any) => (
                        <div key={m.title} className="flex items-center justify-between">
                          <span className={`text-[10px] truncate max-w-[90px] ${textSub}`}>{m.title}</span>
                          <span className="text-[10px] font-bold text-emerald-400">{m.match_score}%</span>
                        </div>
                      ))}
                    </div>
                    <Link to="/career-results"
                      className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium hover:text-emerald-300 transition-colors">
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>

                {/* Next Action */}
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.38 }}>
                  <Link to="/job-search"
                    className={`group block rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.02] ${
                      dark ? 'bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/25'
                           : 'bg-white border border-slate-200 hover:border-violet-300 hover:shadow-lg'}`}>
                    <div className="inline-flex p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl mb-3 shadow-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 ${textPrimary}`}>Next Action</h3>
                    <p className={`text-xs mb-3 ${textSub}`}>Search jobs matching your top career match</p>
                    <span className="inline-flex items-center gap-1 text-violet-400 text-xs font-medium">
                      Find Jobs <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </motion.div>

              </div>
            </motion.div>
          ) : (
            /* ─────────────────────────────────────────────
               STATE 1 — GUIDED NEW-USER FLOW
               (pipeline not yet complete)
               ───────────────────────────────────────────── */
            <div className="space-y-5">

              {/* ── Section A: Required pipeline steps ── */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xs font-semibold uppercase tracking-widest ${textMuted}`}>Required Steps</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    dark ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-amber-300 text-amber-600 bg-amber-50'}`}>
                    {pipelineCoreSteps.filter(s => s.completed).length} / 3 complete
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {pipelineCoreSteps.map((step, i) => (
                    <motion.div key={step.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18 + i * 0.08 }}>

                      {step.locked ? (
                        /* Locked */
                        <div className={`relative rounded-2xl p-5 h-full select-none ${
                          dark ? 'bg-white/[0.015] border border-white/[0.04]' : 'bg-slate-50 border border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                              bg-white/5 border border-white/10 text-neutral-600">
                              {step.num}
                            </div>
                            <Lock className="w-4 h-4 text-neutral-600" />
                          </div>
                          <div className="inline-flex p-2 bg-white/[0.03] rounded-xl mb-3">
                            <step.Icon className="w-5 h-5 text-neutral-600" />
                          </div>
                          <h3 className={`text-sm font-semibold mb-1 ${dark ? 'text-neutral-600' : 'text-slate-400'}`}>{step.title}</h3>
                          <p className={`text-xs ${dark ? 'text-neutral-700' : 'text-slate-300'}`}>{step.description}</p>
                          <div className={`mt-3 text-[10px] font-medium ${
                            dark ? 'text-neutral-700' : 'text-slate-300'}`}>
                            Complete step {step.num - 1} to unlock
                          </div>
                        </div>

                      ) : step.completed ? (
                        /* Completed */
                        <Link to={step.href}
                          className={`group block relative rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.01] ${
                            dark ? 'bg-emerald-950/30 border border-emerald-500/25 hover:border-emerald-500/40'
                                 : 'bg-emerald-50 border border-emerald-200 hover:border-emerald-300'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center
                              bg-emerald-500 shadow shadow-emerald-500/30">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                              Done
                            </span>
                          </div>
                          <div className={`inline-flex p-2 bg-gradient-to-br ${step.color} rounded-xl mb-3 shadow-lg`}>
                            <step.Icon className="w-5 h-5 text-white" />
                          </div>
                          <h3 className={`text-sm font-semibold mb-1 ${
                            dark ? 'text-emerald-300' : 'text-emerald-800'}`}>{step.title}</h3>
                          <p className={`text-xs mb-2 ${
                            dark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>{step.description}</p>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </Link>

                      ) : (
                        /* Active — current step */
                        <Link to={step.href}
                          className={`group block relative rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.01] ${
                            dark
                              ? 'bg-indigo-950/40 border-2 border-indigo-500/60 hover:border-indigo-400 shadow-lg shadow-indigo-900/30'
                              : 'bg-indigo-50 border-2 border-indigo-400 hover:border-indigo-500 shadow-lg shadow-indigo-200'}`}>
                          <div className="absolute top-3 right-3">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              dark ? 'bg-indigo-400' : 'bg-indigo-500'}`} />
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              dark ? 'bg-indigo-600 text-white shadow shadow-indigo-600/40'
                                   : 'bg-indigo-500 text-white shadow shadow-indigo-400/40'}`}>
                              {step.num}
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              dark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                              Current
                            </span>
                          </div>
                          <div className={`inline-flex p-2 bg-gradient-to-br ${step.color} rounded-xl mb-3 shadow-lg`}>
                            <step.Icon className="w-5 h-5 text-white" />
                          </div>
                          <h3 className={`text-sm font-semibold mb-1 ${
                            dark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                          <p className={`text-xs mb-3 ${
                            dark ? 'text-indigo-300/70' : 'text-indigo-700'}`}>{step.description}</p>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            dark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                            Start Now <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* ── Section B: Always-accessible tools ── */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${textMuted}`}>Available Tools</p>
                <div className="grid grid-cols-3 gap-4">
                  {openTools.map((tool, i) => (
                    <motion.div key={tool.title} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.32 + i * 0.07 }}>
                      <Link to={tool.href}
                        className={`group block rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.02] ${
                          dark ? 'bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.14]'
                               : 'bg-white border border-slate-200 hover:shadow-lg'}`}>
                        <div className={`inline-flex p-2.5 bg-gradient-to-br ${tool.color} rounded-xl mb-3 shadow-lg`}>
                          <tool.Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className={`text-sm font-semibold mb-1 ${textPrimary}`}>{tool.title}</h3>
                        <p className={`text-xs mb-3 ${textSub}`}>{tool.description}</p>
                        <span className="inline-flex items-center gap-1 text-indigo-400 text-xs font-medium">
                          Open <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

            </div>
          )}

          {/* ── Intelligence Grid — shown only in results mode ── */}
          {pipelineComplete && <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 pb-8">

            {/* Left — AI Insight + Career Matches */}
            <div className="lg:col-span-3 space-y-4">

              {/* AI Insight */}
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
                className={`relative rounded-2xl overflow-hidden p-6 ${insightCard}`}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className={`absolute -top-20 right-0 w-56 h-56 rounded-full blur-[80px] ${insightGlow}`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${insightLabel}`}>AI Recommendation</p>
                      <h3 className={`text-xl font-bold ${textPrimary}`}>{aiInsights.topRecommendation}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                        {aiInsights.matchScore > 0 ? `${aiInsights.matchScore}%` : '—'}
                      </div>
                      <div className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Match</div>
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed mb-4 ${textSub}`}>{aiInsights.reasoning}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { text: aiInsights.marketDemand + ' Demand', cls: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' },
                      { text: aiInsights.salaryRange,              cls: 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400' },
                      { text: aiInsights.growthPotential + ' Growth', cls: 'bg-violet-500/15 border-violet-500/20 text-violet-400' },
                    ].map(b => (
                      <span key={b.text} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${b.cls}`}>{b.text}</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Career Matches 2×2 */}
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${textMuted}`}>Career Matches</p>
                <div className="grid grid-cols-2 gap-3">
                  {careerMatches.map((career, i) => (
                    <motion.div key={career.career}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.07 }}
                      whileHover={{ scale: 1.02 }}
                      className={`${card} p-4 cursor-pointer transition-transform`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] uppercase tracking-wide font-medium ${textMuted}`}>{career.category}</span>
                        <span className="text-indigo-400 font-bold text-sm">{career.match}%</span>
                      </div>
                      <h4 className={`text-sm font-semibold mb-2.5 leading-snug ${textPrimary}`}>{career.career}</h4>
                      <div className={`w-full rounded-full h-1 ${dark ? 'bg-white/5' : 'bg-slate-100'}`}>
                        <motion.div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1 rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${career.match}%` }} transition={{ duration: 1.2, delay: 0.4 + i * 0.1 }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right — Roadmap + Trending */}
            <div className="lg:col-span-2 space-y-4">

              {/* Career Roadmap */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${textMuted}`}>Career Roadmap</p>
                <div className={`${card} p-5`}>
                  {careerRoadmap.map((step, i) => (
                    <div key={step.step} className={`flex gap-3 relative ${i < careerRoadmap.length - 1 ? 'pb-4' : ''}`}>
                      {i < careerRoadmap.length - 1 && (
                        <div className={`absolute left-[13px] top-7 bottom-0 w-px ${
                          step.status === 'completed' ? (dark ? 'bg-indigo-500/40' : 'bg-indigo-300') : (dark ? 'bg-white/8' : 'bg-slate-200')}`} />
                      )}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        step.status === 'completed' ? 'bg-emerald-500 shadow shadow-emerald-500/30'
                        : step.status === 'current' ? 'bg-indigo-600 shadow shadow-indigo-600/30'
                        : dark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}>
                        {step.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        {step.status === 'current'   && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-sm font-semibold leading-tight ${
                          step.status === 'completed' ? 'text-emerald-400'
                          : step.status === 'current' ? 'text-indigo-400'
                          : textMuted}`}>{step.step}</p>
                        <p className={`text-xs mt-0.5 ${dark ? 'text-neutral-600' : 'text-slate-400'}`}>{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Trending Careers */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${textMuted}`}>Trending Careers</p>
                <div className={`${card} p-5`}>
                  {trendingCareers.map((career, i) => (
                    <div key={career.title}
                      className={`flex items-center justify-between py-2.5 ${
                        i < trendingCareers.length - 1 ? `border-b ${secBorder}` : ''}`}>
                      <div>
                        <p className={`text-sm font-medium ${textPrimary}`}>{career.title}</p>
                        <span className={`text-xs ${dark ? 'text-emerald-500/70' : 'text-emerald-600'}`}>{career.demand}</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-lg">{career.growth}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>}

        </div>
      </div>
    </div>
  )
}

export default Dashboard
