import { useNavigate } from 'react-router-dom'
import { usePaymentStore } from '../store/paymentStore'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import Header from '../components/Header'
import './PaymentSuccessPage.css'

const PaymentSuccessPage = () => {
  const navigate = useNavigate()
  const { paymentResult, currentOrder, resetPayment } = usePaymentStore()

  // UI 확인을 위해 검증 제거
  // useEffect(() => {
  //   // 결제 결과가 없으면 상품 페이지로 이동
  //   if (!paymentResult || paymentResult.status !== 'SUCCESS') {
  //     navigate('/products')
  //   }
  // }, [paymentResult, navigate])

  const handleViewHistory = () => {
    navigate('/order-history')
  }

  const handleGoHome = () => {
    resetPayment()
    navigate('/products')
  }

  // UI 확인을 위해 샘플 데이터 사용
  const displayResult = paymentResult || {
    paymentId: 'PAY-DEMO-12345',
    status: 'SUCCESS' as const,
    amount: 9900,
    paymentMethod: 'CARD' as const,
    paymentNo: 'PAY-2024-001',
    approvedAt: new Date().toISOString(),
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
      <div className="payment-success">
        <div className="success-icon">✓</div>
        <h2 className="success-title">결제가 완료되었습니다</h2>
        <p className="success-message">
          결제가 성공적으로 처리되었습니다.
        </p>

        <div className="payment-details">
          <div className="detail-section">
            <h3 className="detail-title">결제 정보</h3>
            <div className="detail-item">
              <span className="detail-label">결제 금액</span>
              <span className="detail-value">
                {displayResult.amount.toLocaleString()}원
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">결제 수단</span>
              <span className="detail-value">
                {displayResult.paymentMethod === 'CARD' && '신용카드'}
                {displayResult.paymentMethod === 'BANK_TRANSFER' && '계좌이체'}
                {displayResult.paymentMethod === 'VIRTUAL_ACCOUNT' && '가상계좌'}
              </span>
            </div>
            {displayResult.paymentNo && (
              <div className="detail-item">
                <span className="detail-label">결제 번호</span>
                <span className="detail-value">{displayResult.paymentNo}</span>
              </div>
            )}
            {displayResult.approvedAt && (
              <div className="detail-item">
                <span className="detail-label">결제 승인 시각</span>
                <span className="detail-value">
                  {new Date(displayResult.approvedAt).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">주문 번호</span>
              <span className="detail-value">{displayOrder.orderId}</span>
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
    </PageContainer>
  )
}

export default PaymentSuccessPage
