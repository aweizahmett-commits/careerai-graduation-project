import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Target, 
  DollarSign, 
  TrendingUp, 
  BookOpen, 
  Users, 
  Clock,
  CheckCircle,
  ArrowRight,
  BrainCircuit,
  Star
} from 'lucide-react'

interface Career {
  id: string
  title: string
  description: string
  matchScore: number
  category: string
  salary: string
  growth: string
  education: string
  skills: string[]
  personality: string[]
  workEnvironment: string
  whyItFits: string[]
  nextSteps: string[]
}

const AIRecommendations = () => {
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState<Career[]>([])
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mark recommendations as viewed when user lands on this page
    localStorage.setItem('recommendations_viewed', 'true')
    
    const fetchRecommendations = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockCareers: Career[] = [
        {
          id: '1',
          title: 'Data Scientist',
          description: 'Analyze complex data sets to extract insights and drive business decisions using statistical analysis and machine learning.',
          matchScore: 94,
          category: 'Technology',
          salary: '$95,000 - $140,000',
          growth: '35%',
          education: "Master's Degree",
          skills: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Data Visualization'],
          personality: ['Analytical', 'Detail-oriented', 'Problem-solver'],
          workEnvironment: 'Office, remote, or hybrid',
          whyItFits: [
            'Your analytical thinking and problem-solving skills align perfectly with data science',
            'You enjoy working with numbers and finding patterns in complex information',
            'Your preference for independent work matches the focused nature of data analysis'
          ],
          nextSteps: [
            'Learn Python and R programming languages',
            'Take online courses in machine learning and statistics',
            'Build a portfolio of data analysis projects',
            'Consider a Master\'s degree in Data Science or Statistics'
          ]
        },
        {
          id: '2',
          title: 'UX Designer',
          description: 'Create intuitive and visually appealing user interfaces for digital products, combining creativity with user psychology.',
          matchScore: 89,
          category: 'Design',
          salary: '$70,000 - $95,000',
          growth: '20%',
          education: 'Bachelor\'s Degree',
          skills: ['UI Design', 'User Research', 'Prototyping', 'Figma', 'Adobe Creative Suite'],
          personality: ['Creative', 'Empathetic', 'Detail-oriented'],
          workEnvironment: 'Creative studio or office',
          whyItFits: [
            'Your creative personality and attention to detail are perfect for UX design',
            'You enjoy understanding user needs and solving problems through design',
            'Your preference for collaborative work fits well with design team environments'
          ],
          nextSteps: [
            'Learn design tools like Figma and Adobe XD',
            'Study user experience principles and methodologies',
            'Build a portfolio of design projects',
            'Network with other designers and join design communities'
          ]
        },
        {
          id: '3',
          title: 'Product Manager',
          description: 'Lead product development teams and drive product strategy from conception to launch, coordinating between engineering, design, and marketing.',
          matchScore: 86,
          category: 'Business',
          salary: '$90,000 - $130,000',
          growth: '22%',
          education: 'Bachelor\'s Degree',
          skills: ['Project Management', 'Communication', 'Data Analysis', 'Leadership', 'Agile Methodology'],
          personality: ['Leadership', 'Analytical', 'Communication'],
          workEnvironment: 'Office or remote',
          whyItFits: [
            'Your leadership skills and ability to coordinate teams are essential for product management',
            'You enjoy the strategic thinking required for product development',
            'Your communication skills help you work effectively with diverse teams'
          ],
          nextSteps: [
            'Learn product management frameworks and methodologies',
            'Develop business acumen and market analysis skills',
            'Gain experience in project coordination',
            'Consider product management certifications (PMP, CSM)'
          ]
        },
        {
          id: '4',
          title: 'Software Engineer',
          description: 'Design, develop, and maintain software applications and systems, turning ideas into functional digital products.',
          matchScore: 82,
          category: 'Technology',
          salary: '$85,000 - $120,000',
          growth: '25%',
          education: 'Bachelor\'s Degree',
          skills: ['Programming', 'Problem-solving', 'System Design', 'Testing', 'Version Control'],
          personality: ['Analytical', 'Detail-oriented', 'Problem-solver'],
          workEnvironment: 'Office or remote',
          whyItFits: [
            'Your analytical thinking and problem-solving skills are perfect for software engineering',
            'You enjoy the logical challenges of coding and system design',
            'Your preference for focused, independent work aligns with development tasks'
          ],
          nextSteps: [
            'Master programming languages like Python, JavaScript, or Java',
            'Build personal projects to showcase your skills',
            'Learn software development methodologies and best practices',
            'Contribute to open-source projects'
          ]
        },
        {
          id: '5',
          title: 'Marketing Manager',
          description: 'Develop and execute marketing strategies to promote products and services, analyzing market trends and consumer behavior.',
          matchScore: 78,
          category: 'Marketing',
          salary: '$75,000 - $110,000',
          growth: '18%',
          education: 'Bachelor\'s Degree',
          skills: ['Marketing Strategy', 'Analytics', 'Communication', 'Campaign Management', 'SEO/SEM'],
          personality: ['Creative', 'Strategic', 'Communication'],
          workEnvironment: 'Office or hybrid',
          whyItFits: [
            'Your creative thinking and strategic mindset align well with marketing',
            'You enjoy understanding consumer behavior and market trends',
            'Your communication skills are essential for marketing campaigns'
          ],
          nextSteps: [
            'Study marketing principles and digital marketing strategies',
            'Gain experience with marketing analytics tools',
            'Build a portfolio of marketing campaigns or projects',
            'Stay updated on digital marketing trends and technologies'
          ]
        }
      ]
      
      setRecommendations(mockCareers)
      setIsLoading(false)
    }

    fetchRecommendations()
  }, [])

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-500'
    if (score >= 80) return 'from-blue-500 to-cyan-500'
    if (score >= 70) return 'from-purple-500 to-pink-500'
    return 'from-orange-500 to-red-500'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-theme-accent-primary/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-6 animation-delay-150"></div>
          </div>
          <h3 className="text-2xl font-bold text-theme-primary mb-4">Analyzing Your Profile</h3>
          <p className="text-theme-muted max-w-md mx-auto">
            Our AI is processing your assessment to generate personalized career recommendations...
          </p>
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-100"></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce animation-delay-200"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-4 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8 bg-theme-card backdrop-blur-xl border border-theme rounded-2xl p-8 shadow-sm"
      >
        <div className="text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-theme-primary mb-4">
            Your Career Matches
          </h1>
          <p className="text-xl text-theme-muted max-w-3xl mx-auto">
            Based on your assessment, here are the careers that best match your unique profile
          </p>
        </div>
      </motion.div>

      {/* Recommendations Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {recommendations.map((career, index) => (
            <motion.div
              key={career.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-theme-card rounded-2xl border border-theme hover:border-theme transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-theme-primary">{career.title}</h3>
                      <div className={`px-3 py-1 text-sm font-bold bg-gradient-to-r ${getMatchScoreColor(career.matchScore)} text-theme-primary rounded-lg`}>
                        {career.matchScore}% Match
                      </div>
                    </div>
                    <p className="text-sm text-theme-accent-primary font-medium mb-3">{career.category}</p>
                    <p className="text-theme-muted leading-relaxed">{career.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-theme-card-hover rounded-xl p-3">
                    <div className="flex items-center text-theme-secondary mb-1">
                      <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                      <span className="text-xs">Salary Range</span>
                    </div>
                    <p className="font-semibold text-theme-primary">{career.salary}</p>
                  </div>
                  <div className="bg-theme-card-hover rounded-xl p-3">
                    <div className="flex items-center text-theme-secondary mb-1">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                      <span className="text-xs">Growth Rate</span>
                    </div>
                    <p className="font-semibold text-green-400">{career.growth}</p>
                  </div>
                  <div className="bg-theme-card-hover rounded-xl p-3">
                    <div className="flex items-center text-theme-secondary mb-1">
                      <BookOpen className="w-4 h-4 mr-2 text-theme-accent-primary" />
                      <span className="text-xs">Education</span>
                    </div>
                    <p className="font-semibold text-theme-primary">{career.education}</p>
                  </div>
                  <div className="bg-theme-card-hover rounded-xl p-3">
                    <div className="flex items-center text-theme-secondary mb-1">
                      <Users className="w-4 h-4 mr-2 text-theme-accent-secondary" />
                      <span className="text-xs">Work Environment</span>
                    </div>
                    <p className="font-semibold text-theme-primary">{career.workEnvironment}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedCareer(career)}
                  className="w-full py-3 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary hover:from-theme-accent-primary hover:to-theme-accent-secondary text-theme-primary font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Find Real Jobs Link */}
        <div className="text-center mb-12">
          <button
            onClick={() => {
              navigate('/job-search', { 
                state: { 
                  careerMatch: {
                    title: 'Software Engineer',
                    career: 'Software Engineer',
                    category: 'Technology',
                    skills: ['JavaScript', 'React', 'Node.js']
                  }
                } 
              })
            }}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary hover:from-theme-accent-primary hover:to-theme-accent-secondary text-theme-primary font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            Find Real Jobs
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>

      {/* Career Detail Modal */}
      {selectedCareer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-theme-bg backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCareer(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-theme-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-theme"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 lg:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl lg:text-3xl font-bold text-theme-primary">{selectedCareer.title}</h2>
                    <div className={`px-3 py-1 text-lg font-bold bg-gradient-to-r ${getMatchScoreColor(selectedCareer.matchScore)} text-theme-primary rounded-lg`}>
                      {selectedCareer.matchScore}% Match
                    </div>
                  </div>
                  <p className="text-theme-muted">{selectedCareer.category}</p>
                </div>
                <button
                  onClick={() => setSelectedCareer(null)}
                  className="text-theme-muted hover:text-theme-secondary p-2 rounded-xl hover:bg-theme-card-hover transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-theme-primary mb-4">Career Overview</h3>
                  <p className="text-theme-secondary mb-6 leading-relaxed">{selectedCareer.description}</p>
                  
                  <div className="space-y-4">
                    <div className="bg-theme-card-hover rounded-xl p-4">
                      <div className="flex items-center text-theme-secondary mb-2">
                        <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                        <span className="font-medium">Salary Range</span>
                      </div>
                      <p className="font-semibold text-theme-primary">{selectedCareer.salary}</p>
                    </div>
                    <div className="bg-theme-card-hover rounded-xl p-4">
                      <div className="flex items-center text-theme-secondary mb-2">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                        <span className="font-medium">Job Growth</span>
                      </div>
                      <p className="font-semibold text-green-400">{selectedCareer.growth}</p>
                    </div>
                    <div className="bg-theme-card-hover rounded-xl p-4">
                      <div className="flex items-center text-theme-secondary mb-2">
                        <BookOpen className="w-5 h-5 mr-2 text-theme-accent-primary" />
                        <span className="font-medium">Education Required</span>
                      </div>
                      <p className="font-semibold text-theme-primary">{selectedCareer.education}</p>
                    </div>
                    <div className="bg-theme-card-hover rounded-xl p-4">
                      <div className="flex items-center text-theme-secondary mb-2">
                        <Users className="w-5 h-5 mr-2 text-theme-accent-secondary" />
                        <span className="font-medium">Work Environment</span>
                      </div>
                      <p className="font-semibold text-theme-primary">{selectedCareer.workEnvironment}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-theme-primary mb-4">Skills & Personality</h3>
                  <div className="mb-6">
                    <h4 className="font-medium text-theme-secondary mb-3">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCareer.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-2 bg-theme-accent-primary/10 border border-theme-accent-primary/20 text-indigo-300 rounded-lg text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-theme-secondary mb-3">Personality Fit</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCareer.personality.map((trait, index) => (
                        <span key={index} className="px-3 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg text-sm">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8 bg-theme-card-hover/30 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-theme-primary mb-4 flex items-center">
                  <BrainCircuit className="w-6 h-6 mr-3 text-theme-accent-primary" />
                  Why This Career Fits You
                </h3>
                <ul className="space-y-3">
                  {selectedCareer.whyItFits.map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-theme-secondary leading-relaxed">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8 bg-theme-card-hover/30 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-theme-primary mb-4 flex items-center">
                  <Target className="w-6 h-6 mr-3 text-theme-accent-secondary" />
                  Next Steps to Get Started
                </h3>
                <ol className="space-y-3">
                  {selectedCareer.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-7 h-7 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-theme-primary rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-theme-secondary leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedCareer(null)}
                  className="flex-1 px-6 py-3 border border-theme text-theme-secondary font-semibold rounded-xl hover:bg-theme-card-hover transition-all duration-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (selectedCareer) {
                      navigate('/job-search', { 
                        state: { 
                          careerMatch: {
                            title: selectedCareer.title,
                            career: selectedCareer.title,
                            category: selectedCareer.category,
                            skills: selectedCareer.skills
                          }
                        } 
                      })
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary hover:from-theme-accent-primary hover:to-theme-accent-secondary text-theme-primary font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] text-center"
                >
                  Find Real Jobs
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default AIRecommendations
