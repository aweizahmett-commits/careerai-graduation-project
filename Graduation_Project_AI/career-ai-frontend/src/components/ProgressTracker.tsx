import React from 'react'
import { Check, Circle, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProgressStep {
  id: string
  name: string
  href: string
  completed: boolean
  locked: boolean
  current: boolean
}

interface ProgressTrackerProps {
  steps: ProgressStep[]
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps }) => {
  return (
    <div className="bg-theme-card backdrop-blur-sm rounded-xl border border-theme p-6 mb-8">
      <h3 className="text-lg font-semibold text-theme-primary mb-6">Your Career Journey</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              {step.completed ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              ) : step.locked ? (
                <div className="w-8 h-8 bg-theme-card flex items-center justify-center border-2 border-theme rounded-full">
                  <Lock className="w-3 h-3 text-theme-muted" />
                </div>
              ) : step.current ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-8 h-8 bg-theme-accent-primary rounded-full flex items-center justify-center"
                >
                  <Circle className="w-3 h-3 text-white" />
                </motion.div>
              ) : (
                <div className="w-8 h-8 bg-theme-card flex items-center justify-center border-2 border-theme rounded-full">
                  <Circle className="w-3 h-3 text-theme-muted" />
                </div>
              )}
            </div>

            {/* Step content */}
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-medium ${
                    step.completed 
                      ? 'text-green-400' 
                      : step.locked 
                        ? 'text-theme-muted' 
                        : step.current 
                          ? 'text-theme-accent-primary' 
                          : 'text-theme-secondary'
                  }`}>
                    {step.name}
                  </h4>
                  {step.completed && (
                    <p className="text-xs text-theme-muted mt-1">Completed</p>
                  )}
                  {step.locked && (
                    <p className="text-xs text-theme-muted mt-1">Complete previous steps to unlock</p>
                  )}
                  {step.current && !step.completed && (
                    <p className="text-xs text-theme-accent-primary mt-1">In Progress</p>
                  )}
                </div>
                
                {/* Status indicator */}
                <div className={`text-xs px-2 py-1 rounded-full ${
                  step.completed 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : step.locked 
                      ? 'bg-theme-card-hover text-theme-muted border border-theme/50'
                      : step.current 
                        ? 'bg-theme-accent-primary/10 text-theme-accent-primary border border-theme-accent-primary/20'
                        : 'bg-theme-card text-theme-secondary border border-theme/50'
                }`}>
                  {step.completed ? 'Done' : step.locked ? 'Locked' : step.current ? 'Current' : 'Upcoming'}
                </div>
              </div>
            </div>

            {/* Connection line */}
            {index < steps.length - 1 && (
              <div className={`absolute left-5 w-0.5 h-12 ${
                step.completed ? 'bg-green-500' : 'bg-theme-bg'
              }`} style={{ marginTop: '2.5rem' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressTracker
