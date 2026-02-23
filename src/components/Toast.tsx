import { memo, useEffect, useCallback } from 'react'
import './Toast.css'

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

const Toast = memo(({ message, isVisible, onClose, duration = 2000 }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className="toast-container">
      <div className="toast">
        <div className="toast-icon">✓</div>
        <div className="toast-message">{message}</div>
      </div>
    </div>
  )
})

Toast.displayName = 'Toast'

export default Toast
