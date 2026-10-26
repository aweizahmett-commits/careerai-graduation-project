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
  Lock
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [progress, setProgress] = useState({
    resume_uploaded: false,
    assessment_completed: false,
    career_matches_ready: false,
    current_step: 'upload_resume'
  })

  // Calculate completion percentages based on progress
  const profileCompletion = progress.resume_uploaded ? 100 : 25
  const assessmentProgress = progress.assessment_completed ? 100 : (progress.resume_uploaded ? 50 : 0)

  useEffect(() => {
    fetchUserProgress()
  }, [])

  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get('http://localhost:8000/api/progress/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setProgress(response.data)
    } catch (error) {
      console.error('Failed to fetch user progress:', error)
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
      href: '/questionnaire',
      completed: progress.assessment_completed,
      locked: !progress.resume_uploaded,
      current: progress.current_step === 'assessment' && !progress.assessment_completed
    },
    {
      id: 'career_matches',
      name: 'Career Matches',
      href: '/recommendations',
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

  const quickActions = [
    {
      title: "Upload Resume",
      description: "Get AI analysis of your resume",
      icon: Upload,
      href: "/resume-upload",
      color: "from-blue-500 to-cyan-600",
      locked: false
    },
    {
      title: "Take Assessment",
      description: "Complete AI-powered career assessment",
      icon: BrainCircuit,
      href: "/questionnaire",
      color: "from-indigo-500 to-purple-600",
      locked: !progress.resume_uploaded
    },
    {
      title: "Explore Careers",
      description: "Browse career recommendations",
      icon: Briefcase,
      href: "/recommendations",
      color: "from-green-500 to-emerald-600",
      locked: !progress.assessment_completed
    },
    {
      title: "Find Jobs",
      description: "Search for job opportunities",
      icon: Target,
      href: "/job-search",
      color: "from-purple-500 to-pink-600",
      locked: !progress.career_matches_ready
    }
  ]

  const careerMatches = [
    { career: "Senior Software Engineer", match: 92, category: "Technology" },
    { career: "Product Manager", match: 85, category: "Management" },
    { career: "Data Scientist", match: 78, category: "Analytics" },
    { career: "UX Designer", match: 71, category: "Design" }
  ]

  const trendingCareers = [
    { title: "AI/ML Engineer", growth: "+35%", demand: "Very High" },
    { title: "Data Scientist", growth: "+28%", demand: "High" },
    { title: "Cloud Architect", growth: "+22%", demand: "High" },
    { title: "DevOps Engineer", growth: "+18%", demand: "High" }
  ]

  const careerRoadmap = [
    { step: "Foundation Skills", status: "completed", description: "Complete technical fundamentals" },
    { step: "Specialization", status: "current", description: "Focus on AI/ML specialization" },
    { step: "Portfolio Building", status: "pending", description: "Create impressive project portfolio" },
    { step: "Networking", status: "pending", description: "Build professional network" },
    { step: "Job Applications", status: "pending", description: "Apply to target positions" }
  ]

  const aiInsights = {
    topRecommendation: "Senior Software Engineer",
    reasoning: "Your technical skills, problem-solving abilities, and experience align perfectly with senior software engineering roles. The high demand for tech professionals and your strong foundation make this an optimal career path.",
    marketDemand: "Very High",
    salaryRange: "$120K - $180K",
    growthPotential: "Excellent"
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
              { Icon: Target,       bg: 'bg-violet-500/15',  col: 'text-violet-400',  val: '92%',                  lbl: 'Top Career Match',   bar: true,  bc: 'from-violet-500 to-violet-400',   bv: 92 },
              { Icon: TrendingUp,   bg: 'bg-emerald-500/15', col: 'text-emerald-400', val: `${assessmentProgress}%`, lbl: 'Assessment',       bar: true,  bc: 'from-emerald-500 to-emerald-400', bv: assessmentProgress },
              { Icon: Award,        bg: 'bg-amber-500/15',   col: 'text-amber-400',   val: '8',                    lbl: 'Skills Verified',    bar: false, bc: '',                               bv: 0 },
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
                    {[...Array(8)].map((_, j) => <span key={j} className="h-1 w-1 bg-amber-500 rounded-full inline-block" />)}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* ── Feature Action Cards ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${textMuted}`}>Your Journey</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, i) => {
                const Icon = action.icon
                return (
                  <motion.div key={action.title} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.06 }}>
                    {action.locked ? (
                      <div className={`relative rounded-2xl p-5 h-full opacity-40 cursor-not-allowed ${
                        dark ? 'bg-white/[0.02] border border-white/[0.05]' : 'bg-slate-100 border border-slate-200'}`}>
                        <div className="inline-flex p-2.5 bg-white/5 rounded-xl mb-3 relative">
                          <Icon className="w-5 h-5 text-neutral-500" />
                          <Lock className="w-2.5 h-2.5 text-neutral-600 absolute -top-1 -right-1" />
                        </div>
                        <h3 className={`text-sm font-semibold mb-1 ${textMuted}`}>{action.title}</h3>
                        <p className={`text-xs ${dark ? 'text-neutral-700' : 'text-slate-400'}`}>{action.description}</p>
                      </div>
                    ) : (
                      <Link to={action.href}
                        className={`group block rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.02] ${
                          dark ? 'bg-white/[0.03] border border-white/[0.07] hover:border-indigo-500/25 hover:shadow-lg hover:shadow-indigo-600/10'
                               : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100'}`}>
                        <div className={`inline-flex p-2.5 bg-gradient-to-br ${action.color} rounded-xl mb-3 shadow-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className={`text-sm font-semibold mb-1 ${textPrimary}`}>{action.title}</h3>
                        <p className={`text-xs mb-3 ${textSub}`}>{action.description}</p>
                        <span className="inline-flex items-center gap-1 text-indigo-400 text-xs font-medium">
                          Open <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </Link>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* ── Intelligence Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 pb-8">

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
                      <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">92%</div>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
