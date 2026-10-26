import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileMenu from './MobileMenu'

const NavigationDemo = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          isMobile={false}
          onClose={() => {}} // No close function needed for desktop
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Navbar */}
        <Navbar 
          onMobileMenuToggle={handleMobileMenuToggle}
          showMobileMenuButton={true}
        />
        
        {/* Mobile Menu Overlay */}
        <MobileMenu 
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
        
        {/* Main Content */}
        <main className="pt-16">
          <div className="p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default NavigationDemo
