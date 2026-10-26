import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BrainCircuit, 
  Target, 
  BookOpen, 
  ArrowRight,
  FileText,
  Search,
  User
} from 'lucide-react'

const FeaturesSelection = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: BrainCircuit,
      title: "AI-Powered Assessment",
      description: "Our advanced AI analyzes your skills, interests, and personality to provide personalized career recommendations.",
      route: "/questionnaire"
    },
    {
      icon: FileText,
      title: "Resume Analysis",
      description: "Upload your resume for AI-powered analysis and get instant feedback on your career potential.",
      route: "/resume-upload"
    },
    {
      icon: Target,
      title: "Career Matching",
      description: "Get matched with careers that align perfectly with your unique profile and career goals.",
      route: "/recommendations"
    },
    {
      icon: Search,
      title: "Job Search",
      description: "Search and filter through thousands of job opportunities tailored to your profile.",
      route: "/job-search"
    },
    {
      icon: BookOpen,
      title: "Career Explorer",
      description: "Explore detailed information about thousands of career options across various industries.",
      route: "/recommendations"
    },
    {
      icon: User,
      title: "Profile Management",
      description: "Manage your personal information, preferences, and track your career journey.",
      route: "/profile"
    }
  ]

  const handleFeatureClick = (route: string) => {
    navigate(route)
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary">
      {/* Header */}
      <div className="border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold text-theme-primary">Career AI</span>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-theme-secondary hover:text-theme-primary transition-colors"
            >
              Skip to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
            >
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Welcome to Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Career Journey
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-theme-secondary max-w-3xl mx-auto mb-8 px-4"
            >
              Choose where you'd like to start. Our AI-powered tools will help you discover and achieve your career goals.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => handleFeatureClick(feature.route)}
                className="bg-theme-card hover:bg-theme-card-hover rounded-xl p-6 sm:p-8 border border-theme hover:border-indigo-500 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-theme-primary mb-4">{feature.title}</h3>
                <p className="text-theme-secondary leading-relaxed mb-4">{feature.description}</p>
                <div className="flex items-center text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <span className="font-medium">Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 border-t border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "2M+", label: "Users Transformed" },
              { value: "95%", label: "Success Rate" },
              { value: "1000+", label: "Career Paths" },
              { value: "50K+", label: "Companies Hiring" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-theme-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default FeaturesSelection
