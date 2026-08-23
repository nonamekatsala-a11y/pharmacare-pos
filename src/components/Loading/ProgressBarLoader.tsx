import { useState, useEffect } from 'react'

interface ProgressBarLoaderProps {
  progress?: number
  message?: string
  className?: string
  showPercentage?: boolean
  animated?: boolean
}

export default function ProgressBarLoader({ 
  progress = 0, 
  message = 'Loading...',
  className = '',
  showPercentage = true,
  animated = false
}: ProgressBarLoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    if (animated) {
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          if (prev >= progress) {
            clearInterval(interval)
            return progress
          }
          return prev + 1
        })
      }, 20)
      return () => clearInterval(interval)
    } else {
      setDisplayProgress(progress)
    }
  }, [progress, animated])

  const currentProgress = animated ? displayProgress : progress

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-600">{message}</span>
        {showPercentage && (
          <span className="text-sm text-gray-600 font-medium">{currentProgress}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${currentProgress}%` }}
        ></div>
      </div>
    </div>
  )
}
