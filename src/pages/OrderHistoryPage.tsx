import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getOrderHistory } from '../utils/api'
import { OrderInfo, PaymentResult } from '../types'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './OrderHistoryPage.css'

const OrderHistoryPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadOrderHistory = async () => {
      // UI 확인을 위해 샘플 데이터 사용
      // URL 파라미터로 상태 변경 가능: ?status=SUCCESS, ?status=FAIL, ?status=PENDING 등
      if (!orderId) {
        const statusParam = searchParams.get('status') || 'SUCCESS'
        const status = statusParam.toUpperCase() as 'SUCCESS' | 'FAIL' | 'PENDING' | 'PROCESSING' | 'UNKNOWN'
        
        setOrderInfo({
          orderId: 'ORDER-DEMO-12345',
          items: [
            {
              product: {
                id: '1',
                name: '프리미엄 플랜',
                description: '모든 기능을 사용할 수 있는 프리미엄 플랜입니다.',
                price: 9900,
                stock: 100,
              },
              quantity: 1,
            },
            {
              product: {
                id: '2',
                name: '베이직 플랜',
                description: '기본 기능을 사용할 수 있는 베이직 플랜입니다.',
                price: 4900,
                stock: 50,
              },
              quantity: 2,
            },
          ],
          totalAmount: 19700,
          paymentMethod: 'CARD',
          paymentId: 'PAY-DEMO-12345',
          idempotencyKey: 'idemp-demo-key',
          createdAt: new Date().toISOString(),
        })
        
        const basePaymentResult = {
          paymentId: 'PAY-DEMO-12345',
          status,
          amount: 19700,
          paymentMethod: 'CARD' as const,
        }
        
        if (status === 'SUCCESS') {
          setPaymentResult({
            ...basePaymentResult,
            paymentNo: 'PAY-2024-001',
            approvedAt: new Date().toISOString(),
          })
        } else if (status === 'FAIL') {
          setPaymentResult({
            ...basePaymentResult,
            failReason: '카드 한도 초과로 인한 결제 실패',
            canRetry: true,
          })
        } else {
          setPaymentResult(basePaymentResult)
        }
        
        setIsLoading(false)
        return
      }

      try {
        const data = await getOrderHistory(orderId)
        setOrderInfo({
          orderId: data.orderId,
          items: data.items,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          paymentId: data.paymentId,
          idempotencyKey: data.idempotencyKey,
          createdAt: data.createdAt || new Date().toISOString(),
        })
        setPaymentResult(data.paymentResult)
      } catch (err) {
        console.error('주문 내역 로드 실패:', err)
        // API 실패 시에도 샘플 데이터로 표시
        setOrderInfo({
          orderId: orderId || 'ORDER-DEMO-12345',
          items: [
            {
              product: {
                id: '1',
                name: '프리미엄 플랜',
                description: '모든 기능을 사용할 수 있는 프리미엄 플랜입니다.',
                price: 9900,
                stock: 100,
              },
              quantity: 1,
            },
          ],
          totalAmount: 9900,
          paymentMethod: 'CARD',
          paymentId: 'PAY-DEMO-12345',
          idempotencyKey: 'idemp-demo-key',
          createdAt: new Date().toISOString(),
        })
        setPaymentResult({
          paymentId: 'PAY-DEMO-12345',
          status: 'SUCCESS',
          amount: 9900,
          paymentMethod: 'CARD',
          paymentNo: 'PAY-2024-001',
          approvedAt: new Date().toISOString(),
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrderHistory()
  }, [orderId, searchParams])

  const handleGoHome = () => {
    navigate('/products')
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    )
  }

  // UI 확인을 위해 항상 표시 (에러가 있어도 샘플 데이터로 표시)
  if (!orderInfo || !paymentResult) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="주문 내역">
      <Header showSearch={false} showQButton={false} />
      {/* UI 확인용 안내 */}
      {!orderId && (
        <div style={{
          background: '#e0f2fe',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: '#0369a1',
        }}>
          <strong>UI 확인 모드:</strong> 샘플 데이터로 표시 중입니다.
          <br />
          상태 변경: <code>?status=SUCCESS</code>, <code>?status=FAIL</code>, <code>?status=PENDING</code>, <code>?status=PROCESSING</code>, <code>?status=UNKNOWN</code>
        </div>
      )}
      <div className="order-history">
        <div className="order-section">
          <h2 className="section-title">주문 정보</h2>
          <div className="order-id">
            주문 번호: <strong>{orderInfo.orderId}</strong>
          </div>
          <div className="order-items">
            {orderInfo.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-info">
                  <span className="item-name">{item.product.name}</span>
                  <span className="item-quantity">수량: {item.quantity}</span>
                </div>
                <div className="item-price">
                  {(item.product.price * item.quantity).toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        </div>

        {orderInfo.deliveryTimeline && orderInfo.deliveryTimeline.length > 0 && (
          <div className="order-section">
            <h2 className="section-title">배송 상태</h2>
            <div className="delivery-timeline">
              {orderInfo.deliveryTimeline.map((timeline, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-status">{timeline.status}</div>
                  <div className="timeline-message">{timeline.message}</div>
                  <div className="timeline-date">
                    {new Date(timeline.timestamp).toLocaleString('ko-KR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="order-section">
          <h2 className="section-title">결제 정보</h2>
          <div className="payment-status">
            <span className="status-label">결제 상태</span>
            <span className={`status-badge status-${paymentResult.status.toLowerCase()}`}>
              {paymentResult.status === 'SUCCESS' && '성공'}
              {paymentResult.status === 'FAIL' && '실패'}
              {paymentResult.status === 'PENDING' && '대기 중'}
              {paymentResult.status === 'PROCESSING' && '처리 중'}
              {paymentResult.status === 'UNKNOWN' && '확인 중'}
            </span>
          </div>
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
              <span className="detail-label">결제 시각</span>
              <span className="detail-value">
                {new Date(paymentResult.approvedAt).toLocaleString('ko-KR')}
              </span>
            </div>
          )}
        </div>

        <Button fullWidth onClick={handleGoHome} variant="primary">
          메인으로 이동
        </Button>
      </div>
    </PageContainer>
  )
}

export default OrderHistoryPage
