import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BrainCircuit, Target, BookOpen, TrendingUp, ArrowRight,
  Star, Sparkles, CheckCircle2, Users, BarChart3, Zap,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import SplineHero from '../components/ui/SplineHero'

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' } }),
}

const careerPaths = [
  'Software Engineer','Product Designer','Data Scientist','Product Manager',
  'UX Researcher','DevOps Engineer','AI Engineer','Full-Stack Developer',
  'Marketing Director','Business Analyst','Cloud Architect','Cybersecurity Analyst',
]

const Landing = () => {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const pageBg    = dark ? 'bg-[#09090b] text-white'      : 'bg-slate-50 text-slate-900'
  const cardCls   = dark
    ? 'bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm'
    : 'bg-white border border-slate-200 shadow-lg shadow-slate-200/50'
  const secBorder = dark ? 'border-white/[0.06]'           : 'border-slate-200'
  const textSub   = dark ? 'text-neutral-400'              : 'text-slate-500'
  const textMuted = dark ? 'text-neutral-500'              : 'text-slate-400'
  const badgeCls  = dark
    ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300'
    : 'bg-indigo-50 border border-indigo-200 text-indigo-600'
  const signInCls = dark
    ? 'bg-white/5 hover:bg-white/8 border border-white/10 text-neutral-300 hover:text-white'
    : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
  const ctaWrap   = dark
    ? 'border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 via-violet-950/60 to-[#09090b]'
    : 'border border-indigo-200 bg-gradient-to-br from-indigo-50 via-violet-50 to-slate-50'
  const ctaLabel  = dark ? 'text-indigo-400'               : 'text-indigo-600'
  const ctaSub    = dark ? 'text-neutral-400'              : 'text-slate-500'
  const stepNum   = dark
    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/20'
    : 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-400/25'

  const stats = [
    { value: '2M+',   label: 'Users Transformed', icon: Users },
    { value: '95%',   label: 'Success Rate',       icon: CheckCircle2 },
    { value: '1000+', label: 'Career Paths',       icon: BarChart3 },
    { value: '50K+',  label: 'Companies Hiring',   icon: Zap },
  ]

  const testimonials = [
    { name: 'Sarah Chen',        role: 'Product Manager · TechCorp',       content: 'Career AI helped me transition from marketing to product management. The assessment was incredibly accurate!',        avatar: 'SC', grad: 'from-indigo-500 to-violet-600' },
    { name: 'Michael Rodriguez', role: 'Data Scientist · DataCo',          content: 'The AI recommendations opened my eyes to career paths I never considered. Now I\'m in my dream job!',                avatar: 'MR', grad: 'from-violet-500 to-purple-600' },
    { name: 'Emily Johnson',     role: 'UX Designer · Creative Studio',    content: 'The detailed career insights and skill development paths were exactly what I needed to advance my career.',           avatar: 'EJ', grad: 'from-purple-500 to-fuchsia-600' },
  ]

  const steps = [
    { step: '01', title: 'Take the Assessment', description: 'A 10-minute AI-guided session uncovers your unique strengths and ambitions.', icon: Sparkles },
    { step: '02', title: 'Review Your Matches', description: 'Get a curated shortlist of roles ranked by fit, salary, and growth potential.', icon: Target },
    { step: '03', title: 'Build Your Path',     description: 'Follow a personalised roadmap with milestones, skills, and real job listings.', icon: TrendingUp },
  ]

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${pageBg}`}>

      {/* ── Aurora + dot grid ── */}
      <div className="fixed inset-0 pointer-events-none select-none" aria-hidden>
        <div className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] rounded-full blur-[180px] animate-pulse-slow ${dark ? 'bg-indigo-600/10' : 'bg-indigo-400/8'}`} />
        <div className={`absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full blur-[140px] ${dark ? 'bg-violet-700/8' : 'bg-violet-400/6'}`} />
        <div className={`absolute bottom-0 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] ${dark ? 'bg-purple-700/8' : 'bg-purple-400/6'}`} />
        <div className={`absolute inset-0 ${dark
          ? '[background-image:radial-gradient(circle,rgba(99,102,241,0.12)_1px,transparent_1px)] [background-size:28px_28px]'
          : '[background-image:radial-gradient(circle,rgba(99,102,241,0.06)_1px,transparent_1px)] [background-size:28px_28px]'}`} />
      </div>

      {/* ════════ HERO — split layout ════════ */}
      <section className="relative pt-28 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Left — copy */}
            <div>
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
                className={`relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-7 overflow-hidden ${badgeCls}`}>
                <div className="absolute inset-0 shimmer-sweep pointer-events-none" />
                <Sparkles className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">AI-Powered Career Discovery</span>
              </motion.div>

              <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
                className="text-5xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight leading-[1.06] mb-6">
                <span className={dark ? 'text-white' : 'text-slate-900'}>Find the career</span><br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">built for you</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-50" />
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
                className={`text-lg max-w-lg mb-8 leading-relaxed ${textSub}`}>
                Our AI analyses your unique skills, personality, and ambitions to match you with career paths where you'll genuinely excel.
              </motion.p>

              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="flex flex-wrap gap-3 mb-7">
                <Link to="/register"
                  className="group relative inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7)' }}>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">Get Started Free</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/login" className={`inline-flex items-center gap-2 px-7 py-3.5 font-semibold rounded-xl transition-all duration-200 ${signInCls}`}>
                  Sign In
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['#6366f1','#8b5cf6','#a855f7','#ec4899'].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: c, borderColor: dark ? '#09090b' : '#f8fafc' }}>
                      {['S','M','E','J'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {Array.from({length:5}).map((_,i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className={`text-xs ${textMuted}`}>Trusted by 2M+ professionals</p>
                </div>
              </motion.div>
            </div>

            {/* Right — 3D Spline robot */}
            <SplineHero />
          </div>
        </div>
      </section>

      {/* ════════ MARQUEE ════════ */}
      <div className={`relative border-y py-4 overflow-hidden ${secBorder}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none ${dark ? 'bg-gradient-to-r from-[#09090b] to-transparent' : 'bg-gradient-to-r from-slate-50 to-transparent'}`} />
        <div className={`absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none ${dark ? 'bg-gradient-to-l from-[#09090b] to-transparent' : 'bg-gradient-to-l from-slate-50 to-transparent'}`} />
        <div className="flex gap-8 marquee-track whitespace-nowrap">
          {[...careerPaths, ...careerPaths].map((c, i) => (
            <span key={i} className={`text-sm font-medium inline-flex items-center gap-2 ${textMuted}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 inline-block" />{c}
            </span>
          ))}
        </div>
      </div>

      {/* ════════ STATS ════════ */}
      <section className={`border-b ${secBorder}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon
              const div = dark ? 'border-white/[0.06]' : 'border-slate-200'
              return (
                <motion.div key={s.label} variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}
                  className={`flex flex-col items-center py-10 px-4 gap-2 ${i < 3 ? `lg:border-r ${div}` : ''} ${i === 0 || i === 2 ? `border-r ${div}` : ''}`}>
                  <Icon className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{s.value}</span>
                  <span className={`text-sm text-center ${textMuted}`}>{s.label}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════ FEATURES — BENTO GRID ════════ */}
      <section className="py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-16">
            <p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>Features</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Everything you need to<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">own your career</span>
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${textSub}`}>A complete platform — from self-discovery to job offer.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large hero feature */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" custom={0} viewport={{ once: true }}
              className={`lg:col-span-2 group relative rounded-2xl p-8 overflow-hidden transition-all duration-300 ${cardCls}`}>
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/5 group-hover:bg-indigo-500/8 rounded-full blur-3xl transition-all duration-500" />
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-5 shadow-lg shadow-indigo-500/20">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>AI-Powered Assessment</h3>
              <p className={`text-sm leading-relaxed mb-6 max-w-lg ${textSub}`}>
                Advanced AI analyzes your skills, interests, and personality traits to surface the roles where you'll thrive. Backed by cognitive science and real labor market data.
              </p>
              <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-slate-50 border border-slate-100'}`}>
                <p className={`text-xs font-medium mb-3 ${textMuted}`}>Your Personality Profile</p>
                <div className="space-y-2.5">
                  {[{l:'Analytical',w:88,c:'#6366f1'},{l:'Creative',w:74,c:'#8b5cf6'},{l:'Social',w:62,c:'#a855f7'}].map(b => (
                    <div key={b.l} className="flex items-center gap-3">
                      <span className={`text-xs w-20 flex-shrink-0 ${textMuted}`}>{b.l}</span>
                      <div className={`flex-1 rounded-full h-1.5 ${dark ? 'bg-white/5' : 'bg-slate-200'}`}>
                        <motion.div className="h-1.5 rounded-full" style={{ background: b.c }}
                          initial={{ width: 0 }} whileInView={{ width: `${b.w}%` }}
                          transition={{ duration: 1, delay: 0.3 }} viewport={{ once: true }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: b.c }}>{b.w}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Precision Matching */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" custom={0.5} viewport={{ once: true }}
              className={`group relative rounded-2xl p-7 overflow-hidden transition-all duration-300 ${cardCls}`}>
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 mb-5 shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Precision Matching</h3>
              <p className={`text-sm leading-relaxed mb-5 ${textSub}`}>Hyper-personalized matches ranked by fit score — not just keywords.</p>
              {/* Animated bar chart */}
              <div className="flex items-end gap-1.5 h-14">
                {[40,55,70,85,92,88,76].map((h, i) => (
                  <motion.div key={i} className="flex-1 rounded-t-sm"
                    style={{ background: `rgba(139,92,246,${0.25 + i * 0.1})` }}
                    initial={{ scaleY: 0, originY: 1 }}
                    whileInView={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
                    viewport={{ once: true }}
                    custom={h / 100}
                  />
                ))}
              </div>
            </motion.div>

            {/* 1000+ Paths */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
              className={`group relative rounded-2xl p-7 overflow-hidden transition-all duration-300 ${cardCls}`}>
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 mb-5 shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>1000+ Career Paths</h3>
              <p className={`text-sm leading-relaxed mb-5 ${textSub}`}>Detailed profiles for thousands of roles across every industry.</p>
              <div className="flex flex-wrap gap-1.5">
                {['Tech','Design','Finance','Health','Marketing','Law','Data','PM'].map((cat) => (
                  <span key={cat} className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${dark ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>{cat}</span>
                ))}
              </div>
            </motion.div>

            {/* Growth Insights — wide */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" custom={1.5} viewport={{ once: true }}
              className={`sm:col-span-2 group relative rounded-2xl p-7 overflow-hidden transition-all duration-300 ${cardCls}`}>
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 mb-5 shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Growth Insights</h3>
              <p className={`text-sm leading-relaxed mb-5 ${textSub}`}>Live salary data, demand forecasts, and trend reports backed by real market data.</p>
              <svg viewBox="0 0 300 72" className="w-full" preserveAspectRatio="none" style={{ height: 64 }}>
                <defs>
                  <linearGradient id="tG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="fG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,60 C40,55 80,42 120,32 C160,22 200,16 240,10 C260,7 280,5 300,3" stroke="url(#tG)" strokeWidth="2.5" fill="none" />
                <path d="M0,60 C40,55 80,42 120,32 C160,22 200,16 240,10 C260,7 280,5 300,3 L300,72 L0,72 Z" fill="url(#fG)" />
                {[[0,60],[120,32],[240,10],[300,3]].map(([x,y],i) => (
                  <circle key={i} cx={x} cy={y} r="3.5" fill="#8b5cf6" />
                ))}
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS + NETWORK DIAGRAM ════════ */}
      <section className={`py-28 px-4 sm:px-6 border-t ${secBorder}`}>
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-16">
            <p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${dark ? 'text-violet-400' : 'text-violet-600'}`}>How it works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Three steps to your{' '}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">dream role</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative mb-20">
            <svg className="hidden sm:block absolute top-8 left-[16.67%] w-[66.67%]" height="2" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cG"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" /><stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" /><stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" /></linearGradient>
              </defs>
              <line x1="0" y1="1" x2="100%" y2="1" stroke="url(#cG)" strokeWidth="1.5" strokeDasharray="6 4" />
            </svg>
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={s.step} variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}
                  className="flex flex-col items-center text-center relative">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 z-10 ${stepNum}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className={`text-xs font-bold tracking-widest uppercase mb-2 ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>{s.step}</span>
                  <h3 className={`text-base font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{s.title}</h3>
                  <p className={`text-sm leading-relaxed ${textSub}`}>{s.description}</p>
                </motion.div>
              )
            })}
          </div>

          {/* SVG Career Network Diagram */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" custom={1.5} viewport={{ once: true }}
            className={`rounded-2xl p-8 border overflow-hidden ${cardCls}`}>
            <p className={`text-center text-xs font-semibold tracking-widest uppercase mb-8 ${dark ? 'text-violet-400' : 'text-violet-600'}`}>
              Your Career Discovery Map
            </p>
            <svg width="100%" viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              <defs>
                <radialGradient id="cnGrad"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></radialGradient>
                <filter id="cnGlow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              {/* lines */}
              {[[300,130,110,48],[300,130,490,48],[300,130,75,160],[300,130,525,160],[300,130,175,232],[300,130,425,232]].map(([x1,y1,x2,y2],i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={dark ? 'rgba(139,92,246,0.22)' : 'rgba(99,102,241,0.18)'} strokeWidth="1.5" strokeDasharray="5 4" />
              ))}
              {/* center node */}
              <circle cx="300" cy="130" r="40" fill="url(#cnGrad)" filter="url(#cnGlow)" />
              <text x="300" y="125" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">Career</text>
              <text x="300" y="141" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">AI</text>
              {/* orbit nodes */}
              {[
                {x:110,y:48, label:'Designer', c:'#6366f1'},
                {x:490,y:48, label:'Engineer', c:'#8b5cf6'},
                {x:75, y:160,label:'Analyst',  c:'#a855f7'},
                {x:525,y:160,label:'Manager',  c:'#c084fc'},
                {x:175,y:232,label:'Researcher',c:'#818cf8'},
                {x:425,y:232,label:'Architect', c:'#7c3aed'},
              ].map((n,i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r="30" fill={n.c} fillOpacity={dark ? 0.13 : 0.09} stroke={n.c} strokeOpacity="0.4" strokeWidth="1.5" />
                  <text x={n.x} y={n.y+4} textAnchor="middle" fill={dark ? 'rgba(255,255,255,0.8)' : n.c} fontSize="9" fontWeight="600">{n.label}</text>
                </g>
              ))}
            </svg>
          </motion.div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section className={`py-28 px-4 sm:px-6 border-t ${secBorder}`}>
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-16">
            <p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${dark ? 'text-purple-400' : 'text-purple-600'}`}>Testimonials</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Loved by{' '}
              <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">ambitious people</span>
            </h2>
            <p className={`text-lg ${textSub}`}>Join thousands who've already found their perfect path.</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}
                className="relative group">
                <div className={`absolute -inset-[1px] rounded-[17px] bg-gradient-to-br ${t.grad} opacity-0 group-hover:opacity-25 transition-opacity duration-300 blur-[3px]`} />
                <div className={`relative rounded-2xl p-7 flex flex-col gap-5 ${cardCls}`}>
                  <div className="flex gap-0.5">
                    {Array.from({length:5}).map((_,j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className={`text-sm leading-relaxed flex-1 ${dark ? 'text-neutral-300' : 'text-slate-600'}`}>"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>{t.avatar}</div>
                    <div>
                      <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.name}</p>
                      <p className={`text-xs ${textMuted}`}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className={`relative rounded-3xl overflow-hidden p-12 sm:p-16 text-center ${ctaWrap}`}>
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] blur-[80px] rounded-full ${dark ? 'bg-indigo-600/20' : 'bg-indigo-300/20'}`} />
            </div>
            <p className={`text-sm font-semibold tracking-widest uppercase mb-4 relative ${ctaLabel}`}>Get started today</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5 relative">
              Ready to find your{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">perfect fit?</span>
            </h2>
            <p className={`text-lg mb-10 max-w-xl mx-auto relative ${ctaSub}`}>
              Join over 2 million professionals who discovered their ideal career with Career AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
              <Link to="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-xl hover:scale-[1.02] transition-all duration-200 text-base"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7)' }}>
                Start for Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/login" className={`inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 text-base ${signInCls}`}>
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className={`py-10 mt-8 border-t px-4 sm:px-6 ${secBorder}`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <BrainCircuit className="w-3.5 h-3.5 text-white" />
            </div>
            <span className={`text-sm font-semibold ${dark ? 'text-neutral-200' : 'text-slate-800'}`}>Career AI</span>
            <span className={`text-sm ml-2 ${textMuted}`}>&copy; 2026</span>
          </div>
          <div className={`flex items-center gap-6 text-sm ${textMuted}`}>
            <a href="#" className={`transition-colors ${dark ? 'hover:text-neutral-300' : 'hover:text-slate-700'}`}>Privacy</a>
            <a href="#" className={`transition-colors ${dark ? 'hover:text-neutral-300' : 'hover:text-slate-700'}`}>Terms</a>
            <a href="#" className={`transition-colors ${dark ? 'hover:text-neutral-300' : 'hover:text-slate-700'}`}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
