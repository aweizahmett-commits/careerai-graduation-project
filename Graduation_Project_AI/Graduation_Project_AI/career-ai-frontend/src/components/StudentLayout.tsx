import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

interface StudentLayoutProps {
  children?: React.ReactNode
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Mobile Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={true} 
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-theme-sidebar border-b border-theme px-4 py-3 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-card-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent-primary"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary rounded-xl flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-theme-primary">Career AI</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 relative"
        >
          {children || <Outlet />}
          
          {/* Floating Chatbot Trigger */}
          <button
            onClick={() => {
              // This will be handled by a global state or context
              const event = new CustomEvent('openChatbot')
              window.dispatchEvent(event)
            }}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-40"
            aria-label="Open AI Assistant"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </motion.main>
      </div>
    </div>
  )
}

export default StudentLayout
