import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BrainCircuit, ArrowRight, ArrowLeft, CheckCircle, GraduationCap } from 'lucide-react'

interface Question {
  id: string
  question: string
  type: 'single' | 'multiple'
  options: string[]
  category: string
  description?: string
}

interface MajorQuestions {
  [key: string]: Question[]
}

const CareerQuestionnaire = () => {
  const navigate = useNavigate()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMajor, setSelectedMajor] = useState('')
  const [majorQuestions, setMajorQuestions] = useState<Question[]>([])

  const majors = [
    'Computer Engineering',
    'Software Engineering', 
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Computer Science',
    'Information Technology',
    'Business Administration',
    'Marketing',
    'Finance',
    'Accounting',
    'Medicine',
    'Nursing',
    'Psychology',
    'Education',
    'Graphic Design',
    'Architecture',
    'Law',
    'Journalism',
    'Biology',
    'Chemistry',
    'Physics',
    'Mathematics',
    'English Literature',
    'History',
    'Sociology',
    'Other'
  ]

  const majorSpecificQuestions: MajorQuestions = {
    'Computer Engineering': [
      {
        id: 'ce_hardware_interest',
        question: 'Which computer hardware area interests you most?',
        type: 'single',
        category: 'Technical Interest',
        description: 'Choose the hardware specialization that appeals to you',
        options: [
          'Microprocessor design and architecture',
          'Embedded systems and IoT',
          'Computer networks and communications',
          'Digital systems and VLSI',
          'Computer architecture and organization',
          'Hardware-software co-design'
        ]
      },
      {
        id: 'ce_software_preference',
        question: 'What type of software development do you prefer?',
        type: 'single',
        category: 'Software Preference',
        description: 'Select your preferred software development area',
        options: [
          'Low-level programming (Assembly, C)',
          'System programming (Operating systems, drivers)',
          'Firmware development',
          'Hardware-software integration',
          'Real-time systems',
          'Embedded software development'
        ]
      },
      {
        id: 'ce_career_focus',
        question: 'Which career path in Computer Engineering appeals to you?',
        type: 'single',
        category: 'Career Focus',
        description: 'Choose your preferred career direction',
        options: [
          'Hardware design engineer',
          'Embedded systems developer',
          'Network engineer',
          'Systems architect',
          'R&D engineer',
          'Technical consultant'
        ]
      },
      {
        id: 'ce_skills',
        question: 'What technical skills do you want to develop?',
        type: 'multiple',
        category: 'Skills Development',
        description: 'Select all skills you want to develop',
        options: [
          'Circuit design and PCB layout',
          'VHDL/Verilog programming',
          'Microcontroller programming',
          'Network protocol implementation',
          'System optimization',
          'Hardware testing and validation'
        ]
      },
      {
        id: 'ce_industry',
        question: 'Which industry interests you most?',
        type: 'single',
        category: 'Industry Preference',
        description: 'Choose your preferred industry',
        options: [
          'Semiconductor manufacturing',
          'Telecommunications',
          'Automotive electronics',
          'Consumer electronics',
          'Aerospace and defense',
          'IoT and smart devices'
        ]
      }
    ],
    'Software Engineering': [
      {
        id: 'se_development_focus',
        question: 'What type of software development interests you most?',
        type: 'single',
        category: 'Development Focus',
        description: 'Choose your primary area of interest',
        options: [
          'Web development (Frontend/Backend)',
          'Mobile app development',
          'Enterprise software',
          'Game development',
          'Cloud computing and DevOps',
          'AI/Machine Learning engineering'
        ]
      },
      {
        id: 'se_programming_preference',
        question: 'Which programming paradigm do you prefer?',
        type: 'single',
        category: 'Programming Style',
        description: 'Select your preferred programming approach',
        options: [
          'Object-oriented programming',
          'Functional programming',
          'Procedural programming',
          'Event-driven programming',
          'Aspect-oriented programming',
          'Domain-driven design'
        ]
      },
      {
        id: 'se_team_role',
        question: 'What role do you prefer in a software team?',
        type: 'single',
        category: 'Team Role',
        description: 'Choose your ideal team position',
        options: [
          'Full-stack developer',
          'Frontend specialist',
          'Backend specialist',
          'DevOps engineer',
          'Software architect',
          'Technical lead'
        ]
      },
      {
        id: 'se_technologies',
        question: 'Which technologies excite you most?',
        type: 'multiple',
        category: 'Technology Interest',
        description: 'Select all technologies that interest you',
        options: [
          'React/Vue/Angular frameworks',
          'Node.js/Python backend',
          'AWS/Azure/Google Cloud',
          'Docker/Kubernetes',
          'Machine learning frameworks',
          'Blockchain technology'
        ]
      },
      {
        id: 'se_project_type',
        question: 'What type of software projects do you enjoy?',
        type: 'single',
        category: 'Project Preference',
        description: 'Choose your preferred project type',
        options: [
          'Consumer applications',
          'Business software solutions',
          'Open-source projects',
          'Research and prototyping',
          'Large-scale enterprise systems',
          'Startup products'
        ]
      }
    ],
    'Computer Science': [
      {
        id: 'cs_specialization',
        question: 'Which computer science specialization interests you most?',
        type: 'single',
        category: 'Specialization',
        description: 'Choose your preferred area',
        options: [
          'Artificial Intelligence/Machine Learning',
          'Data Science and Analytics',
          'Cybersecurity',
          'Distributed Systems',
          'Computer Graphics',
          'Theory of Computation'
        ]
      },
      {
        id: 'cs_research',
        question: 'What type of research interests you?',
        type: 'multiple',
        category: 'Research Interest',
        description: 'Select research areas that interest you',
        options: [
          'Algorithm design and analysis',
          'Machine learning research',
          'Network protocols',
          'Database systems',
          'Human-computer interaction',
          'Quantum computing'
        ]
      }
    ],
    'Business Administration': [
      {
        id: 'ba_concentration',
        question: 'Which business concentration interests you most?',
        type: 'single',
        category: 'Concentration',
        description: 'Choose your preferred business focus',
        options: [
          'Management and leadership',
          'Marketing and sales',
          'Finance and banking',
          'International business',
          'Entrepreneurship',
          'Supply chain management'
        ]
      }
    ],
    'Medicine': [
      {
        id: 'med_specialty',
        question: 'Which medical specialty interests you most?',
        type: 'single',
        category: 'Specialty',
        description: 'Choose your preferred medical field',
        options: [
          'Internal medicine',
          'Surgery',
          'Pediatrics',
          'Emergency medicine',
          'Psychiatry',
          'Family medicine'
        ]
      }
    ],
    'Other': [
      {
        id: 'general_interests',
        question: 'What type of work environment do you prefer?',
        type: 'single',
        category: 'Work Environment',
        description: 'Choose your ideal work setting',
        options: [
          'Office environment',
          'Remote work',
          'Hands-on/field work',
          'Laboratory/research setting',
          'Customer-facing role',
          'Creative studio'
        ]
      },
      {
        id: 'general_skills',
        question: 'What are your strongest skills?',
        type: 'multiple',
        category: 'Skills',
        description: 'Select your strongest areas',
        options: [
          'Problem-solving',
          'Communication',
          'Technical skills',
          'Creativity',
          'Leadership',
          'Analytical thinking'
        ]
      }
    ]
  }

  const majorSelectionQuestion: Question = {
    id: 'major_selection',
    question: 'What is your field of study or major?',
    type: 'single',
    category: 'Academic Background',
    description: 'Select your current or intended major to get personalized questions',
    options: majors
  }

  const [questions, setQuestions] = useState<Question[]>([majorSelectionQuestion])

  const handleMajorSelection = (major: string) => {
    setSelectedMajor(major)
    setAnswers({ ...answers, major_selection: major })
    
    // Get major-specific questions or default questions
    const specificQuestions = majorSpecificQuestions[major] || majorSpecificQuestions['Other']
    
    // Add some general career questions for everyone
    const generalQuestions: Question[] = [
      {
        id: 'work_environment',
        question: 'What type of work environment do you prefer?',
        type: 'single',
        category: 'Work Style',
        description: 'Choose the environment where you feel most productive',
        options: [
          'Office setting with structured routine',
          'Remote work with flexibility',
          'Hands-on, physical work environment',
          'Creative studio or workshop',
          'Customer-facing environment',
          'Laboratory or research facility'
        ]
      },
      {
        id: 'career_goals',
        question: 'What are your long-term career goals?',
        type: 'single',
        category: 'Career Goals',
        description: 'Consider what you want to achieve in your career',
        options: [
          'Leadership and management positions',
          'Technical expertise and specialization',
          'Entrepreneurship and starting a business',
          'Work-life balance and flexibility',
          'Making a positive impact on society',
          'Continuous learning and growth'
        ]
      },
      {
        id: 'industry_preference',
        question: 'What type of industry interests you most?',
        type: 'single',
        category: 'Industry Preference',
        description: 'Choose your preferred industry sector',
        options: [
          'Technology and software',
          'Healthcare and medicine',
          'Finance and banking',
          'Education and research',
          'Creative and media',
          'Manufacturing and engineering'
        ]
      }
    ]
    
    // Combine major-specific questions with general questions
    const allQuestions = [majorSelectionQuestion, ...specificQuestions, ...generalQuestions]
    
    // Randomize the order of major-specific questions (but keep major selection first)
    const shuffledSpecific = [...specificQuestions].sort(() => Math.random() - 0.5)
    const shuffledGeneral = [...generalQuestions].sort(() => Math.random() - 0.5)
    
    setQuestions([majorSelectionQuestion, ...shuffledSpecific, ...shuffledGeneral])
    setMajorQuestions([majorSelectionQuestion, ...shuffledSpecific, ...shuffledGeneral])
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    
    // If this is the major selection question, load major-specific questions
    if (questionId === 'major_selection') {
      handleMajorSelection(answer)
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    console.log('Assessment answers:', answers)
    localStorage.setItem('assessment_answers', JSON.stringify(answers))
    localStorage.setItem('assessment_completed', 'true')
    localStorage.setItem('user_major', selectedMajor)
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    navigate('/recommendations')
  }

  const getProgress = () => {
    const answeredQuestions = Object.keys(answers).length
    return Math.round((answeredQuestions / questions.length) * 100)
  }

  const currentQ = questions[currentQuestion]
  const hasAnswer = answers[currentQ?.id]
  const isLastQuestion = currentQuestion === questions.length - 1
  const isFirstQuestion = currentQuestion === 0

  if (!currentQ) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-transparent p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8 bg-theme-card backdrop-blur-xl border border-theme rounded-2xl p-8 shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary rounded-2xl shadow-lg shadow-indigo-500/25 mb-4">
            <BrainCircuit className="w-8 h-8 text-theme-primary" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-theme-primary mb-4">
            Personalized Career Assessment
          </h1>
          <p className="text-lg text-theme-muted">
            Answer questions tailored to your academic background
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-theme-muted mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{getProgress()}% Complete</span>
          </div>
          <div className="w-full bg-theme-card-hover rounded-full h-3 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgress()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          className="bg-theme-card rounded-2xl border border-theme p-6 lg:p-8"
        >
          {/* Question Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              {currentQ.id === 'major_selection' && (
                <GraduationCap className="w-6 h-6 text-theme-accent-primary" />
              )}
              <span className="px-3 py-1 bg-theme-accent-primary/10 border border-theme-accent-primary/20 text-indigo-300 rounded-lg text-sm font-medium">
                {currentQ.category}
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-semibold text-theme-primary mb-2">
              {currentQ.question}
            </h2>
            {currentQ.description && (
              <p className="text-theme-muted">{currentQ.description}</p>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            <AnimatePresence>
              {currentQ.options.map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  onClick={() => handleAnswer(currentQ.id, option)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    answers[currentQ.id] === option
                      ? 'bg-theme-accent-primary/10 border-theme-accent-primary text-indigo-300'
                      : 'bg-theme-card-hover border-theme text-theme-secondary hover:bg-theme-card-hover hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      answers[currentQ.id] === option
                        ? 'border-theme-accent-primary bg-indigo-500'
                        : 'border-slate-500'
                    }`}>
                      {answers[currentQ.id] === option && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              className="px-6 py-3 bg-theme-card-hover hover:bg-theme-border text-theme-secondary font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={!hasAnswer || isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary hover:from-theme-accent-primary hover:to-theme-accent-secondary text-theme-primary font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Complete Assessment
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!hasAnswer}
                className="px-8 py-3 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary hover:from-theme-accent-primary hover:to-theme-accent-secondary text-theme-primary font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Skip Assessment */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/recommendations')}
            className="text-theme-muted hover:text-theme-secondary transition-colors duration-200"
          >
            Skip assessment and go to recommendations
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default CareerQuestionnaire
