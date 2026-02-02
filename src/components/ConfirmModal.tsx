import './ConfirmModal.css'

interface ConfirmModalProps {
  isOpen: boolean
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmModal = ({
  isOpen,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) return null

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-content">
          <div className="confirm-modal-icon">⚠️</div>
          <h3 className="confirm-modal-title">확인</h3>
          <p className="confirm-modal-message">{message}</p>
        </div>
        <div className="confirm-modal-actions">
          <button className="confirm-modal-btn cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-modal-btn confirm-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
