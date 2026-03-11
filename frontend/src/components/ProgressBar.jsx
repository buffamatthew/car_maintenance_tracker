import React from 'react'
import './ProgressBar.css'

function ProgressBar({ percentage, status, showLabel = true }) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

  const displayPercentage = clampedPercentage

  const getStatusClass = () => {
    switch (status) {
      case 'good':
        return 'progress-good'
      case 'due-soon':
        return 'progress-due-soon'
      case 'overdue':
        return 'progress-overdue'
      case 'never':
        return 'progress-never'
      default:
        return ''
    }
  }

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${getStatusClass()}`}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="progress-bar-label">
          {clampedPercentage}% remaining
        </div>
      )}
    </div>
  )
}

export default ProgressBar
