import React from 'react'
import './CircularProgress.css'

function CircularProgress({ percentage, status, size = 80, strokeWidth = 8 }) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedPercentage / 100) * circumference

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return '#10b981'
      case 'due-soon':
        return '#f59e0b'
      case 'overdue':
        return '#ef4444'
      case 'never':
        return '#9ca3af'
      default:
        return '#9ca3af'
    }
  }

  return (
    <div className="circular-progress-container">
      <svg width={size} height={size} className="circular-progress-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStatusColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="circular-progress-fill"
        />
      </svg>
      <div className="circular-progress-text">
        <span className="circular-progress-percentage">{Math.round(clampedPercentage)}%</span>
      </div>
    </div>
  )
}

export default CircularProgress
