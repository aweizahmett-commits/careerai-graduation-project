import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BrainCircuit, 
  Menu, 
  X, 
  LogOut,
  ArrowRight
} from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const navigation = [
    { name: 'Profile', href: '/profile', icon: null },
    { name: 'Dashboard', href: '/dashboard', icon: null },
    { name: 'Upload Resume', href: '/resume-upload', icon: null },
    { name: 'Assessment', href: '/questionnaire', icon: null },
    { name: 'Career Matches', href: '/recommendations', icon: null },
    { name: 'Job Search', href: '/job-search', icon: null },
    { name: 'Ostim Jobs', href: '/ostim-jobs', icon: null },
    { name: 'Community', href: '/community', icon: null },
  ]

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-blue-50/50 shadow-[0_4px_30px_rgb(0,0,0,0.03)]"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center group transform transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-xl group-hover:shadow-indigo-500/40 transition-all duration-300">
                <BrainCircuit className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300"
              />
            </div>
            <div className="ml-3">
              <h1 className="text-lg lg:text-xl font-bold text-slate-900">Career AI</h1>
              <p className="text-xs lg:text-sm text-slate-500 hidden sm:block">Smart Career Matching</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-between w-full">
            {/* Navigation Items */}
            <nav className="flex items-center space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    relative px-2 py-1.5 text-xs font-bold transition-all duration-300 group whitespace-nowrap
                    ${isActive(item.href) 
                      ? 'text-indigo-600' 
                      : 'text-slate-500 hover:text-slate-900'
                    }
                  `}
                >
                  <span className="relative z-10">{item.name}</span>
                  <motion.div
                    className={`
                      absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full
                      ${isActive(item.href) ? 'scale-x-100' : 'scale-x-0'}
                    `}
                    initial={false}
                    animate={{ scaleX: isActive(item.href) ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              ))}
            </nav>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-200 mx-4"></div>

            {/* User Info and Actions */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-xs">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-xs font-bold text-slate-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 border border-slate-200 hover:border-red-200 shadow-sm hover:shadow-md"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-300 border border-slate-200 shadow-sm hover:shadow"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="group flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40"
                >
                  Get Started
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all duration-300 border border-slate-200 shadow-sm"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-6 space-y-2 border-t border-slate-100 bg-white shadow-xl">
                {/* Navigation Items */}
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      className={`
                        block px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300
                        ${isActive(item.href) 
                          ? 'text-indigo-700 bg-indigo-50 border border-indigo-100/50' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <span>{item.name}</span>
                        {isActive(item.href) && (
                          <motion.div
                            layoutId="mobileActiveTab"
                            className="ml-auto w-2 h-2 bg-indigo-400 rounded-full"
                          />
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
                
                {/* Separator */}
                <div className="border-t border-slate-100 my-4"></div>
                
                {/* Mobile User Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="space-y-2"
                >
                  {user ? (
                    <div className="space-y-2 px-4">
                      <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-sm">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 border border-slate-200 hover:border-red-200 shadow-sm"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 px-4">
                      <Link
                        to="/login"
                        className="block px-4 py-3 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300 border border-slate-200 shadow-sm text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all duration-300 text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

export default Header
