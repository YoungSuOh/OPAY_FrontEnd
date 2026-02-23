import { useNavigate } from 'react-router-dom'
import { usePaymentStore } from '../store/paymentStore'
import Button from '../components/Button'
import Header from '../components/Header'
import './PaymentSuccessPage.css'

const PaymentSuccessPage = () => {
  const navigate = useNavigate()
  const { paymentResult, currentOrder, resetPayment } = usePaymentStore()

  const handleViewHistory = () => {
    navigate('/order-history')
  }

  const handleGoHome = () => {
    resetPayment()
    navigate('/')
  }

  if (!paymentResult || !currentOrder) {
    return (
      <div className="payment-success-page">
        <Header showSearch={false} showQButton={false} />
        <div className="payment-success-content">
          <h1 className="payment-success-page-title">결제 완료</h1>
          <p className="success-message">결제 정보를 불러올 수 없습니다.</p>
          <div className="success-actions">
            <Button fullWidth onClick={handleGoHome} variant="primary">
              메인으로 이동
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-success-page">
      <Header showSearch={false} showQButton={false} />
      <div className="payment-success-content">
        <h1 className="payment-success-page-title">결제 완료</h1>

        <div className="payment-success">
          <div className="success-icon">✓</div>
          <h2 className="success-title">결제가 완료되었습니다</h2>
          <p className="success-message">
            결제가 성공적으로 처리되었습니다.
          </p>

          <div className="order-section">
            <h2 className="section-title">결제 정보</h2>
            <div className="detail-section">
              <div className="detail-item">
                <span className="detail-label">결제 금액</span>
                <span className="detail-value">
                  {paymentResult.amount.toLocaleString()}원
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">결제 수단</span>
                <span className="detail-value">
                  {paymentResult.paymentMethod === 'CARD' && '신용카드'}
                  {paymentResult.paymentMethod === 'BANK_TRANSFER' && '계좌이체'}
                  {paymentResult.paymentMethod === 'VIRTUAL_ACCOUNT' && '가상계좌'}
                </span>
              </div>
              {paymentResult.paymentNo && (
                <div className="detail-item">
                  <span className="detail-label">결제 번호</span>
                  <span className="detail-value">{paymentResult.paymentNo}</span>
                </div>
              )}
              {paymentResult.approvedAt && (
                <div className="detail-item">
                  <span className="detail-label">결제 승인 시각</span>
                  <span className="detail-value">
                    {new Date(paymentResult.approvedAt).toLocaleString('ko-KR')}
                  </span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">주문 번호</span>
                <span className="detail-value">{currentOrder.orderId}</span>
              </div>
            </div>
          </div>

          <div className="success-actions">
            <Button fullWidth onClick={handleViewHistory} variant="primary">
              주문 내역 보기
            </Button>
            <Button fullWidth onClick={handleGoHome} variant="secondary">
              메인으로 이동
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage
