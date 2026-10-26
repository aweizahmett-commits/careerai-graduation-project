import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  Target, 
  BookOpen, 
  User, 
  LogOut,
  Upload,
  BrainCircuit,
  Building,
  Users
} from 'lucide-react'
import { motion } from 'framer-motion'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

const Sidebar = ({ isOpen = true, onClose, isMobile = false }: SidebarProps) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Upload Resume',
      href: '/resume-upload',
      icon: Upload,
    },
    {
      name: 'Assessment',
      href: '/assessment',
      icon: BrainCircuit,
    },
    {
      name: 'Career Matches',
      href: '/career-results',
      icon: Target,
    },
    {
      name: 'Job Search',
      href: '/job-search',
      icon: BookOpen,
    },
    {
      name: 'Ostim Jobs',
      href: '/ostim-jobs',
      icon: Building,
    },
    {
      name: 'Community',
      href: '/community',
      icon: Users,
    },
  ]

  const handleLogout = () => {
    logout()
    if (onClose) onClose()
  }

  const isActive = (href: string) => {
    return location.pathname === href
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 lg:hidden bg-theme-bg/80 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        flex flex-col bg-theme-sidebar border-r border-theme transition-all duration-300 ease-in-out
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-72 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'w-64 min-h-screen'
        }
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-theme">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary rounded-xl flex items-center justify-center shadow-lg">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-theme-primary">Career AI</span>
          </div>
          
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden
                    ${active
                      ? 'bg-theme-accent-primary text-white shadow-md border border-transparent'
                      : 'text-theme-secondary hover:bg-theme-accent-primary hover:text-white transition-all'
                    }
                  `}
                  onClick={() => isMobile && onClose && onClose()}
                >
                  <motion.div
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className={`
                      ${active ? 'text-white' : 'text-theme-muted group-hover:text-theme-secondary'}
                    `} />
                  </motion.div>
                  <span className="font-medium truncate">{item.name}</span>
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute right-2 w-1 h-6 bg-white/50 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* AI Pipeline Progress */}
          {(() => {
            const resumeDone = !!localStorage.getItem('career_ai_analysis')
            const assessDone = !!localStorage.getItem('pipeline_assessment_complete')
            const careerDone = !!localStorage.getItem('pipeline_career_results')
            const nextStep   = careerDone ? 3 : assessDone ? 2 : resumeDone ? 1 : 0
            const pathToStep: Record<string, number> = {
              '/resume-upload': 0, '/resume-analysis-results': 0,
              '/assessment': 1,    '/career-results': 2,
            }
            const viewingStep  = pathToStep[location.pathname]
            const currentStep  = viewingStep !== undefined ? viewingStep : nextStep
            const pipelineSteps = [
              { name: 'Upload Resume',  href: '/resume-upload'   },
              { name: 'Assessment',     href: '/assessment'      },
              { name: 'Career Matching',href: '/career-results'  },
            ]
            console.log(`[UI] sidebar updated | currentStep=${currentStep} | path=${location.pathname}`)
            return (
              <div className="mt-6 mb-2">
                <p className="px-3 text-[10px] font-semibold text-theme-muted uppercase tracking-widest mb-2">
                  Objectives
                </p>
                <div className="space-y-0.5">
                  {pipelineSteps.map((step, idx) => {
                    const isCompleted = idx < currentStep
                    const isActive    = idx === currentStep && currentStep < 3
                    return (
                      <Link
                        key={step.name}
                        to={step.href}
                        onClick={() => isMobile && onClose && onClose()}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                          isActive    ? 'bg-theme-accent-primary/15 text-theme-accent-primary font-semibold' :
                          isCompleted ? 'text-emerald-400 hover:bg-emerald-500/10 cursor-pointer' :
                                        'text-theme-muted opacity-50 cursor-default'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                          isActive    ? 'bg-theme-accent-primary text-white' :
                          isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
                                        'border border-theme text-theme-muted'
                        }`}>
                          {String(idx + 1)}
                        </span>
                        <span className="text-[13px] truncate">{step.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-theme">
            
            {/* User Information */}
            {user && (
              <div className="px-3 py-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary flex items-center justify-center shadow-lg">
                    <span className="text-sm font-medium text-white">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-theme-primary truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-theme-secondary truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-3 text-red-500 group-hover:text-red-400 transition-colors duration-200" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-theme">
          <div className="mb-4 flex justify-center">
            <ThemeToggle />
          </div>
          <p className="text-xs text-theme-muted text-center">
            © 2026 Career AI. All rights reserved.
          </p>
        </div>
      </div>
    </>
  )
}

export default Sidebar
