import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentStore } from '../store/paymentStore'
import { approvePayment } from '../utils/api'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import Header from '../components/Header'
import './PaymentFailPage.css'

const PaymentFailPage = () => {
  const navigate = useNavigate()
  const { paymentResult, currentOrder, setPaymentResult, setProcessing } = usePaymentStore()
  const [isRetrying, setIsRetrying] = useState(false)

  // UI 확인을 위해 검증 제거
  // useEffect(() => {
  //   // 결제 결과가 없거나 실패가 아니면 상품 페이지로 이동
  //   if (!paymentResult || paymentResult.status !== 'FAIL') {
  //     navigate('/products')
  //   }
  // }, [paymentResult, navigate])

  const handleRetry = async () => {
    if (!currentOrder || !currentOrder.paymentId || !currentOrder.idempotencyKey) {
      return
    }

    setIsRetrying(true)
    setProcessing(true)

    try {
      // 동일한 Idempotency Key와 PaymentId로 재시도
      const result = await approvePayment(
        currentOrder.paymentId,
        currentOrder.idempotencyKey
      )

      setPaymentResult(result)

      if (result.status === 'SUCCESS') {
        navigate('/payment-success')
      } else if (result.status === 'FAIL') {
        // 재시도 후에도 실패
        setIsRetrying(false)
        setProcessing(false)
      } else if (result.status === 'UNKNOWN') {
        navigate('/payment-status-check')
      }
    } catch (error) {
      console.error('결제 재시도 실패:', error)
      alert('결제 재시도에 실패했습니다.')
      setIsRetrying(false)
      setProcessing(false)
    }
  }

  const handleCancel = () => {
    navigate('/products')
  }

  // UI 확인을 위해 샘플 데이터 사용
  const displayResult = paymentResult || {
    paymentId: 'PAY-DEMO-12345',
    status: 'FAIL' as const,
    amount: 9900,
    paymentMethod: 'CARD' as const,
    failReason: '카드 한도 초과로 인한 결제 실패',
    canRetry: true,
  }
  
  const displayOrder = currentOrder || {
    orderId: 'ORDER-DEMO-12345',
    items: [],
    totalAmount: 9900,
    paymentMethod: 'CARD' as const,
  }

  return (
    <PageContainer>
      <Header showSearch={false} showQButton={false} />
      <div className="payment-fail">
        <div className="fail-icon">✕</div>
        <h2 className="fail-title">결제에 실패했습니다</h2>
        <p className="fail-message">
          {displayResult.failReason || '결제 처리 중 오류가 발생했습니다.'}
        </p>

        <div className="fail-details">
          <div className="detail-section">
            <div className="detail-item">
              <span className="detail-label">결제 금액</span>
              <span className="detail-value">
                {displayResult.amount.toLocaleString()}원
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">주문 번호</span>
              <span className="detail-value">{displayOrder.orderId}</span>
            </div>
          </div>
        </div>

        <div className="fail-actions">
          {displayResult.canRetry !== false && (
            <Button
              fullWidth
              onClick={handleRetry}
              variant="primary"
              disabled={isRetrying}
            >
              {isRetrying ? '재시도 중...' : '다시 결제하기'}
            </Button>
          )}
          <Button fullWidth onClick={handleCancel} variant="secondary">
            주문 취소
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}

export default PaymentFailPage
