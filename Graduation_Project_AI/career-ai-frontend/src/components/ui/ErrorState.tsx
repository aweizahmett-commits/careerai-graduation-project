import React from 'react'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'page' | 'card' | 'inline'
  className?: string
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onDismiss,
  variant = 'page',
  className = ''
}) => {
  const variantClasses = {
    page: 'text-center py-12 px-4',
    card: 'text-center p-6 bg-red-50 rounded-lg border border-red-200',
    inline: 'flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200'
  }

  const iconSizes = {
    page: 'w-16 h-16',
    card: 'w-12 h-12',
    inline: 'w-8 h-8'
  }

  const ErrorIcon = () => (
    <svg
      className={`${iconSizes[variant]} text-red-500`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.5V6.5c0-1.833-1.962-3.5-2.502-3.5H5.082c-1.54 0-2.502 1.667-2.502 3.5v8.5c0 1.833 1.962 3.5 2.502 3.5z"
      />
    </svg>
  )

  if (variant === 'inline') {
    return (
      <div className={`${variantClasses[variant]} ${className}`}>
        <div className="flex items-center space-x-3">
          <ErrorIcon />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800">{title}</h4>
            <p className="text-sm text-red-600">{message}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1 text-sm bg-white text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="bg-red-100 rounded-full p-3">
          <ErrorIcon />
        </div>
      </div>
      
      <h3 className={`font-semibold text-red-900 mb-2 ${
        variant === 'page' ? 'text-xl' : 'text-lg'
      }`}>
        {title}
      </h3>
      
      <p className={`text-red-600 mb-6 ${
        variant === 'page' ? 'text-base max-w-md mx-auto' : 'text-sm'
      }`}>
        {message}
      </p>
      
      <div className="flex justify-center space-x-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
          >
            Try Again
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-6 py-3 bg-white text-red-600 font-medium rounded-lg border border-red-300 hover:bg-red-50 transition-colors shadow-sm hover:shadow-md"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorState
