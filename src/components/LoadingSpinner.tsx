import { memo } from 'react'
import './LoadingSpinner.css'

const LoadingSpinner = memo(() => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  )
})

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner
