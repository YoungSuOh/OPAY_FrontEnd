import { useState } from 'react'
import { chargeWallet } from '../utils/api'
import './WalletChargeModal.css'

interface WalletChargeModalProps {
  isOpen: boolean
  onClose: () => void
  onChargeSuccess?: () => void
}

const WalletChargeModal = ({ isOpen, onClose, onChargeSuccess }: WalletChargeModalProps) => {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quickAmounts = [10000, 30000, 50000, 100000, 300000, 500000]

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setAmount(value)
    setError(null)
  }

  const handleQuickAmountClick = (quickAmount: number) => {
    setAmount(quickAmount.toString())
    setError(null)
  }

  const handleCharge = async () => {
    const chargeAmount = parseInt(amount)
    
    if (!chargeAmount || chargeAmount <= 0) {
      setError('충전할 금액을 입력해주세요.')
      return
    }

    if (chargeAmount < 1000) {
      setError('최소 충전 금액은 1,000원입니다.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await chargeWallet(chargeAmount)
      setAmount('')
      onChargeSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '머니 충전에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="wallet-charge-modal-overlay" onClick={handleClose}>
      <div className="wallet-charge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-charge-modal-header">
          <h2>O머니 충전</h2>
          <button className="wallet-charge-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="wallet-charge-modal-content">
          <div className="wallet-charge-amount-section">
            <label className="wallet-charge-label">충전 금액</label>
            <div className="wallet-charge-input-wrapper">
              <input
                type="text"
                className="wallet-charge-input"
                value={amount ? parseInt(amount).toLocaleString() : ''}
                onChange={handleAmountChange}
                placeholder="충전할 금액을 입력하세요"
                disabled={isLoading}
              />
              <span className="wallet-charge-currency">원</span>
            </div>
            {error && <div className="wallet-charge-error">{error}</div>}
          </div>

          <div className="wallet-charge-quick-amounts">
            <label className="wallet-charge-label">빠른 선택</label>
            <div className="wallet-charge-quick-buttons">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  className={`wallet-charge-quick-btn ${
                    amount === quickAmount.toString() ? 'active' : ''
                  }`}
                  onClick={() => handleQuickAmountClick(quickAmount)}
                  disabled={isLoading}
                >
                  {quickAmount.toLocaleString()}원
                </button>
              ))}
            </div>
          </div>

          <div className="wallet-charge-info">
            <p>• 최소 충전 금액: 1,000원</p>
            <p>• 충전된 머니는 즉시 사용 가능합니다.</p>
          </div>
        </div>

        <div className="wallet-charge-modal-footer">
          <button
            className="wallet-charge-cancel-btn"
            onClick={handleClose}
            disabled={isLoading}
          >
            취소
          </button>
          <button
            className="wallet-charge-confirm-btn"
            onClick={handleCharge}
            disabled={isLoading || !amount}
          >
            {isLoading ? '충전 중...' : '충전하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WalletChargeModal
