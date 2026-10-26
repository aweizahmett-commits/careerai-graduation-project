import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, 
  ThumbsUp, ThumbsDown, Copy, RefreshCw, Paperclip, Mic, MicOff
} from 'lucide-react'
import { chatbotApi, ChatMessage, ChatSession, ChatbotResponse } from '../services/api'

interface AIChatbotProps {
  isOpen: boolean
  onClose: () => void
  onMinimize?: () => void
}

const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose, onMinimize }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [showSessions, setShowSessions] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && !sessionId) {
      createNewSession()
      loadSessions()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const createNewSession = async () => {
    try {
      const response = await chatbotApi.createSession()
      setSessionId(response.data.session_id)
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your AI career assistant. I can help you with resume analysis, job recommendations, skill development, and career advice. What would you like to know today?',
        timestamp: new Date().toISOString(),
        metadata: { intent: 'greeting', confidence: 1.0 }
      }])
    } catch (error) {
      console.error('Error creating session:', error)
      // Set a temporary session ID to allow sending messages
      setSessionId('temp-session')
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your AI career assistant. I can help you with resume analysis, job recommendations, skill development, and career advice. What would you like to know today?',
        timestamp: new Date().toISOString(),
        metadata: { intent: 'greeting', confidence: 1.0 }
      }])
    }
  }

  const loadSessions = async () => {
    try {
      const response = await chatbotApi.getUserSessions()
      setSessions(response.data.sessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadChatHistory = async (session_id: string) => {
    try {
      const response = await chatbotApi.getChatHistory(session_id)
      setMessages(response.data.history)
      setSessionId(session_id)
      setShowSessions(false)
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    // If no session ID, create one first
    let currentSessionId = sessionId
    if (!currentSessionId) {
      try {
        const response = await chatbotApi.createSession()
        currentSessionId = response.data.session_id
        setSessionId(currentSessionId)
      } catch (error) {
        console.error('Error creating session before sending message:', error)
        currentSessionId = 'temp-session'
        setSessionId(currentSessionId)
      }
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setSuggestions([])

    try {
      const response = await chatbotApi.sendMessage(currentSessionId, message)
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        metadata: {
          intent: response.data.intent,
          confidence: response.data.confidence
        }
      }

      setMessages(prev => [...prev, assistantMessage])
      
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Fallback response for demo purposes
      const fallbackResponse = getFallbackResponse(message)
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date().toISOString(),
        metadata: { intent: 'fallback', confidence: 0.8 }
      }
      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const getFallbackResponse = (message: string): string => {
    const messageLower = message.toLowerCase()
    
    const resumeResponses = [
      "To create an effective resume, focus on quantifiable achievements, use action verbs, and tailor it to each job application. Include your contact information, professional summary, work experience, education, and relevant skills.",
      "Your resume should highlight accomplishments with specific metrics, use strong action verbs, be ATS-friendly, and be customized for each role. Keep it to 1-2 pages and focus on relevant experience.",
      "A great resume includes a compelling summary, quantifiable achievements, relevant keywords from job descriptions, clean formatting, and showcases your unique value proposition to employers."
    ]
    
    const interviewResponses = [
      "Interview preparation includes researching the company, practicing common questions, preparing STAR method examples, dressing appropriately, and preparing thoughtful questions to ask the interviewer.",
      "Ace your interview by researching the company culture, preparing behavioral examples using the STAR method, practicing technical questions, and having thoughtful questions ready for the interviewer.",
      "Interview success comes from thorough preparation: research the company, practice answers to common questions, prepare STAR examples, dress professionally, and bring questions to ask."
    ]
    
    const skillResponses = [
      "In-demand skills include programming languages (Python, JavaScript), cloud computing (AWS, Azure), data analysis, machine learning, cybersecurity, and soft skills like communication and leadership.",
      "Top skills employers seek include: technical skills in programming and cloud computing, data analysis capabilities, AI/ML knowledge, cybersecurity expertise, and strong soft skills like communication and problem-solving.",
      "Develop skills that are in high demand: programming languages, cloud platforms, data science, AI/machine learning, cybersecurity, and essential soft skills like leadership and communication."
    ]
    
    const jobResponses = [
      "Effective job searching involves using multiple platforms, networking with professionals, customizing applications, following up, and preparing thoroughly for interviews.",
      "Find your ideal job by using multiple job boards, networking strategically, customizing each application, following up professionally, and preparing thoroughly for interviews.",
      "Successful job searching requires a multi-platform approach, strategic networking, tailored applications, professional follow-ups, and comprehensive interview preparation."
    ]
    
    const salaryResponses = [
      "Salary research should include checking Glassdoor, LinkedIn Salary, and Bureau of Labor Statistics. Consider location, experience level, company size, and market conditions.",
      "Research salary data using multiple sources like Glassdoor, LinkedIn Salary, and BLS. Factor in location, experience, company size, and industry standards for accurate expectations.",
      "Determine fair salary by researching market rates on Glassdoor and LinkedIn Salary, considering location and experience, and understanding the total compensation package."
    ]
    
    const generalResponses = [
      "I'm here to help with your career journey! I can assist with resume writing, job searching, interview preparation, skill development, and career advice. What specific area would you like help with?",
      "Let me help you succeed in your career! I provide guidance on resumes, interviews, job searches, skill development, and career planning. What would you like to explore?",
      "I'm your AI career assistant! I can help with resume optimization, interview preparation, job search strategies, skill development, and career planning. How can I assist you today?"
    ]
    
    // Randomly select from appropriate response array
    const getRandomResponse = (responses: string[]) => {
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    if (messageLower.includes('resume') || messageLower.includes('cv')) {
      return getRandomResponse(resumeResponses)
    }
    
    if (messageLower.includes('interview')) {
      return getRandomResponse(interviewResponses)
    }
    
    if (messageLower.includes('skill') || messageLower.includes('learn')) {
      return getRandomResponse(skillResponses)
    }
    
    if (messageLower.includes('job') || messageLower.includes('career')) {
      return getRandomResponse(jobResponses)
    }
    
    if (messageLower.includes('salary') || messageLower.includes('pay')) {
      return getRandomResponse(salaryResponses)
    }
    
    return getRandomResponse(generalResponses)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleFeedback = async (messageIndex: number, feedback: 'positive' | 'negative') => {
    // This would send feedback to improve the AI responses
    console.log(`Feedback: ${feedback} for message ${messageIndex}`)
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    onMinimize?.()
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className={`bg-slate-800 rounded-xl border border-slate-700 shadow-2xl ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      } flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Career Assistant</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-400">Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMinimize}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Sessions Sidebar */}
            <AnimatePresence>
              {showSessions && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="absolute inset-0 bg-slate-800 rounded-xl z-10"
                >
                  <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Chat Sessions</h4>
                      <button
                        onClick={() => setShowSessions(false)}
                        className="p-1 hover:bg-slate-700 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                    <button
                      onClick={createNewSession}
                      className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
                    >
                      New Chat
                    </button>
                    
                    {sessions.map((session) => (
                      <button
                        key={session.session_id}
                        onClick={() => loadChatHistory(session.session_id)}
                        className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-colors"
                      >
                        <div className="font-medium text-sm truncate">{session.title}</div>
                        <div className="text-xs text-slate-400">
                          {session.message_count} messages • {new Date(session.updated_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-start space-x-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-700 text-slate-100'
                    } rounded-lg p-3`}>
                      <div className="text-sm">{message.content}</div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        
                        {message.role === 'assistant' && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleFeedback(index, 'positive')}
                              className="p-1 hover:bg-slate-600 rounded transition-colors"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(index, 'negative')}
                              className="p-1 hover:bg-slate-600 rounded transition-colors"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => copyMessage(message.content)}
                              className="p-1 hover:bg-slate-600 rounded transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {message.metadata?.intent && (
                        <div className="text-xs opacity-70 mt-1">
                          Intent: {message.metadata.intent} • Confidence: {Math.round((message.metadata.confidence || 0) * 100)}%
                        </div>
                      )}
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !isLoading && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-xs text-slate-300 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                </button>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your career..."
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  disabled={isLoading}
                />
                
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'hover:bg-slate-700'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-slate-400" />}
                </button>
                
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="text-xs text-slate-500 mt-2 text-center">
                Powered by AI • Your conversations help improve my responses
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default AIChatbot
