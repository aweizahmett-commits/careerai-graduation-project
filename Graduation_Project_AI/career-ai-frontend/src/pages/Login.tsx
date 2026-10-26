import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, BrainCircuit } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(username, password)
    } catch (err: any) {
      let errorMessage = 'Login failed. Please try again.'
      if (err.response?.data?.non_field_errors) errorMessage = err.response.data.non_field_errors[0]
      else if (err.response?.data?.error) errorMessage = err.response.data.error
      else if (err.response?.data?.detail) errorMessage = err.response.data.detail
      else if (err.message) errorMessage = err.message
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex" style={{ background: '#0d1117' }}>

      {/* ════ LEFT — Visual Panel ════ */}
      <div className="hidden md:flex md:w-[42%] relative items-center justify-center flex-col overflow-hidden"
        style={{ background: '#0b0f1c' }}>

        {/* dot grid */}
        <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(99,102,241,0.13)_1px,transparent_1px)] [background-size:30px_30px] opacity-60" />

        {/* Ambient bloom */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.13), transparent 70%)' }} />

        {/* ── Fixed container — SVG + orbital share the exact same center ── */}
        <div className="relative" style={{ width: 420, height: 420 }}>

          {/* Perfectly symmetric hexagonal SVG constellation */}
          {/* Center = (210,210). 6 nodes at r=165, every 60° starting from top */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 420" aria-hidden>
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="coreBloom" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
              <filter id="nGlow2">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Three diameter axes (very faint symmetry lines) */}
            <line x1="210" y1="45"  x2="210" y2="375" stroke="rgba(99,102,241,0.07)" strokeWidth="1" />
            <line x1="353" y1="127" x2="67"  y2="293" stroke="rgba(99,102,241,0.07)" strokeWidth="1" />
            <line x1="353" y1="293" x2="67"  y2="127" stroke="rgba(99,102,241,0.07)" strokeWidth="1" />

            {/* Hexagon outline */}
            <polygon
              points="210,45 353,127 353,293 210,375 67,293 67,127"
              fill="none" stroke="rgba(99,102,241,0.16)" strokeWidth="1"
            />

            {/* Center → node spoke lines */}
            {([[210,45],[353,127],[353,293],[210,375],[67,293],[67,127]] as [number,number][]).map(([x,y], i) => (
              <line key={i} x1="210" y1="210" x2={x} y2={y}
                stroke="url(#lg1)" strokeWidth="1.4" />
            ))}

            {/* Core ambient bloom */}
            <circle cx="210" cy="210" r="68" fill="url(#coreBloom)" />

            {/* Six nodes — perfectly symmetric */}
            {([
              { x:210, y:45,  label:'NLP',    ta:'middle', lx:0,   ly:-17 },
              { x:353, y:127, label:'Vision', ta:'start',  lx:16,  ly:5   },
              { x:353, y:293, label:'ML',     ta:'start',  lx:16,  ly:5   },
              { x:210, y:375, label:'Data',   ta:'middle', lx:0,   ly:22  },
              { x:67,  y:293, label:'Design', ta:'end',    lx:-16, ly:5   },
              { x:67,  y:127, label:'Dev',    ta:'end',    lx:-16, ly:5   },
            ] as { x:number; y:number; label:string; ta:string; lx:number; ly:number }[]).map((n, i) => (
              <g key={i} filter="url(#nGlow2)">
                <circle cx={n.x} cy={n.y} r="13" fill="#6366f1" fillOpacity="0.12" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.6" />
                <circle cx={n.x} cy={n.y} r="5"  fill="#818cf8" />
                <text x={n.x + n.lx} y={n.y + n.ly}
                  textAnchor={n.ta as 'middle' | 'start' | 'end'} fill="rgba(165,180,252,0.7)"
                  fontSize="11" fontWeight="500" fontFamily="ui-sans-serif,sans-serif">
                  {n.label}
                </text>
              </g>
            ))}
          </svg>

          {/* ── Orbital system — anchored to container center ── */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ y: [0, -13, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' } as any}
              className="relative flex items-center justify-center"
              style={{ width: 176, height: 176 }}
            >
              {/* Ring 1 — 176px, slow CW dashes, 1 indigo dot */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' } as any}
                className="absolute inset-0 rounded-full"
                style={{ border: '1px dashed rgba(99,102,241,0.38)' }}
              >
                <span className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                  style={{ background: '#818cf8', boxShadow: '0 0 14px rgba(129,140,248,1), 0 0 28px rgba(99,102,241,0.5)' }} />
              </motion.div>

              {/* Ring 2 — 126px, CCW, 2 dots opposite */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 11, repeat: Infinity, ease: 'linear' } as any}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 126, height: 126, border: '1px solid rgba(139,92,246,0.32)' }}
              >
                <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#a78bfa', boxShadow: '0 0 10px rgba(167,139,250,1)' }} />
                <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#a78bfa', boxShadow: '0 0 10px rgba(167,139,250,1)' }} />
              </motion.div>

              {/* Ring 3 — 80px, fast CW, 1 fuchsia dot */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' } as any}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 80, height: 80, border: '1px solid rgba(168,85,247,0.28)' }}
              >
                <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#e879f9', boxShadow: '0 0 12px rgba(232,121,249,1)' }} />
              </motion.div>

              {/* Staggered pulse rings × 3 */}
              {[0, 1.1, 2.2].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 2.8], opacity: [0.45, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay } as any}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full"
                  style={{ border: '1px solid rgba(99,102,241,0.55)' }}
                />
              ))}

              {/* Core sphere — pure light, no icon */}
              <div className="relative rounded-full flex-shrink-0"
                style={{
                  width: 64, height: 64,
                  background: 'radial-gradient(circle at 36% 30%, #c7d2fe, #6366f1 46%, #3730a3 82%)',
                  boxShadow: '0 0 32px rgba(99,102,241,0.9), 0 0 64px rgba(99,102,241,0.45), 0 0 100px rgba(99,102,241,0.18)',
                }}
              >
                <div className="absolute rounded-full"
                  style={{ top: 11, left: 13, width: 18, height: 13,
                    background: 'radial-gradient(ellipse, rgba(255,255,255,0.75), transparent)',
                    opacity: 0.55 }} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Brand text */}
        <div className="relative z-10 mt-8 text-center">
          <h2 className="text-[1.75rem] font-extrabold bg-gradient-to-r from-indigo-300 via-violet-300 to-blue-300 bg-clip-text text-transparent tracking-tight">
            Career AI
          </h2>
        </div>
      </div>

      {/* ════ RIGHT — Form Panel ════ */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: '#0d1117' }}
      >
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <BrainCircuit className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Career AI</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 mb-8 text-sm">Sign in to your account</p>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Google button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] text-white font-medium text-sm transition-all duration-200 mb-5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Login with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-[1px] bg-white/[0.08]" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-[1px] bg-white/[0.08]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full px-4 py-3.5 rounded-xl text-white text-sm placeholder-slate-500 border border-white/[0.08] focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                style={{ background: '#131a26' }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3.5 pr-12 rounded-xl text-white text-sm placeholder-slate-500 border border-white/[0.08] focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
                  style={{ background: '#131a26' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <a href="#" className="text-xs text-indigo-400/70 hover:text-indigo-300 transition-colors">Forgot password?</a>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full py-4 px-4 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 text-sm overflow-hidden mt-1"
              style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              {isLoading ? (
                <span className="relative flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="relative flex items-center justify-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
