import { Link } from 'react-router-dom'
import { BrainCircuit, LogIn, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const SimpleHeader = () => {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b transition-colors duration-300 ${
        dark
          ? 'bg-[#09090b]/80 border-white/[0.06]'
          : 'bg-white/80 border-slate-200/80'
      }`}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl blur-[6px] opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
              <div className="relative w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className={`text-lg font-bold tracking-tight transition-colors duration-300 ${
              dark
                ? 'text-white group-hover:text-indigo-300'
                : 'text-slate-900 group-hover:text-indigo-600'
            }`}>
              Career <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>

          {/* Nav */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link
              to="/login"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                dark
                  ? 'text-neutral-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Login
            </Link>

            <Link
              to="/register"
              className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <UserPlus className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Get Started</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default SimpleHeader
