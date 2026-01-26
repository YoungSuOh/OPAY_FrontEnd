import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentStore } from '../store/paymentStore'
import { useCartStore } from '../store/cartStore'
import { PaymentMethod } from '../types'
import { createOrder, requestPaymentId, generateIdempotencyKey, validateCartBeforeCheckout } from '../utils/api'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './OrderReviewPage.css'

const OrderReviewPage = () => {
  const navigate = useNavigate()
  const { setCurrentOrder, setProcessing, setPaymentSession } = usePaymentStore()
  const { localCart } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [orderInfo, setOrderInfo] = useState<{
    orderId: string
    totalAmount: number
    items: Array<{ name: string; quantity: number; price: number }>
  } | null>(null)
  const [serverOrder, setServerOrder] = useState<import('../types').OrderInfo | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    outOfStock?: string[]
    priceChanged?: string[]
  }>({})

  useEffect(() => {
    // 결제 페이지 진입 시 재고 및 가격 재확인
    const loadOrderInfo = async () => {
      setIsValidating(true)
      
      // UI 확인을 위해 샘플 데이터 사용
      if (localCart.size === 0) {
        setOrderInfo({
          orderId: 'ORDER-DEMO-12345',
          totalAmount: 9900,
          items: [
            { name: '프리미엄 플랜', quantity: 1, price: 9900 },
          ],
        })
        setIsValidating(false)
        setIsLoading(false)
        return
      }

      try {
        // 재고 및 가격 재확인
        const validation = await validateCartBeforeCheckout()
        
        if (!validation.isValid) {
          setValidationErrors({
            outOfStock: validation.outOfStockItems,
            priceChanged: validation.priceChangedItems,
          })
          
          if (validation.outOfStockItems && validation.outOfStockItems.length > 0) {
            alert('재고가 부족한 상품이 있습니다. 장바구니를 확인해주세요.')
            navigate('/cart')
            return
          }
        }

        // 주문 정보 생성
        const items = Array.from(localCart.entries()).map(([productId, quantity]) => ({
          productId,
          quantity,
        }))

        const order = await createOrder(items)
        setServerOrder(order)
        setOrderInfo({
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          items: order.items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        })
      } catch (error) {
        console.error('주문 정보 로드 실패:', error)
        // API 실패 시에도 샘플 데이터로 표시
        setOrderInfo({
          orderId: 'ORDER-DEMO-12345',
          totalAmount: 9900,
          items: [
            { name: '프리미엄 플랜', quantity: 1, price: 9900 },
          ],
        })
      } finally {
        setIsValidating(false)
        setIsLoading(false)
      }
    }

    loadOrderInfo()
  }, [localCart, navigate])

  const handlePayment = async () => {
    if (!orderInfo) return

    setIsLoading(true)
    setProcessing(true)

    try {
      const idempotencyKey = generateIdempotencyKey()

      // PaymentId 발급 요청
      const { paymentId } = await requestPaymentId(
        orderInfo.orderId,
        paymentMethod,
        idempotencyKey
      )

      // 결제 세션 생성 (이탈 대비)
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setPaymentSession(sessionId)

      // 주문 정보 저장 (서버에서 받은 정보 사용)
      if (!serverOrder) {
        throw new Error('주문 정보가 없습니다.')
      }
      
      setCurrentOrder({
        ...serverOrder,
        paymentMethod,
        paymentId,
        idempotencyKey,
        createdAt: new Date().toISOString(),
      })

      // PG 연동이 필요한 경우
      if (paymentMethod === 'TOSS' || paymentMethod === 'KAKAO' || paymentMethod === 'NAVER') {
        // PG 결제 페이지로 리다이렉트 (실제 구현 필요)
        // const { redirectUrl } = await requestPGPayment(paymentId, paymentMethod)
        // window.location.href = redirectUrl
        // return
      }

      // 결제 처리 중 페이지로 이동
      navigate('/payment-processing')
    } catch (error) {
      console.error('결제 요청 실패:', error)
      alert('결제 요청에 실패했습니다.')
      setIsLoading(false)
      setProcessing(false)
    }
  }

  if (isValidating || (isLoading && !orderInfo)) {
    return (
      <PageContainer>
        <LoadingSpinner />
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#64748b' }}>
          재고 및 가격을 확인 중입니다...
        </p>
      </PageContainer>
    )
  }

  if (!orderInfo) {
    return null
  }

  return (
    <PageContainer title="주문 확인">
      <Header showSearch={false} showQButton={false} />
      <div className="order-review">
        <div className="order-section">
          <h2 className="section-title">주문 정보</h2>
          <div className="order-id">
            주문 번호: <strong>{orderInfo.orderId}</strong>
          </div>
          <div className="order-items">
            {orderInfo.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">수량: {item.quantity}</span>
                </div>
                <div className="item-price">
                  {(item.price * item.quantity).toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-section">
          <h2 className="section-title">결제 수단</h2>
          <div className="payment-methods">
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="CARD"
                checked={paymentMethod === 'CARD'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              />
              <span>신용카드</span>
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="BANK_TRANSFER"
                checked={paymentMethod === 'BANK_TRANSFER'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              />
              <span>계좌이체</span>
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="VIRTUAL_ACCOUNT"
                checked={paymentMethod === 'VIRTUAL_ACCOUNT'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              />
              <span>가상계좌</span>
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="TOSS"
                checked={paymentMethod === 'TOSS'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              />
              <span>토스페이</span>
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="KAKAO"
                checked={paymentMethod === 'KAKAO'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              />
              <span>카카오페이</span>
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="NAVER"
                checked={paymentMethod === 'NAVER'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              />
              <span>네이버페이</span>
            </label>
          </div>
        </div>
        
        {validationErrors.outOfStock && validationErrors.outOfStock.length > 0 && (
          <div className="validation-error">
            <p>재고가 부족한 상품이 있습니다:</p>
            <ul>
              {validationErrors.outOfStock.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {validationErrors.priceChanged && validationErrors.priceChanged.length > 0 && (
          <div className="validation-warning">
            <p>가격이 변경된 상품이 있습니다. 확인 후 주문해주세요.</p>
          </div>
        )}

        <div className="order-section total-section">
          <div className="total-amount">
            <span className="total-label">총 결제 금액</span>
            <span className="total-value">
              {orderInfo.totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>

        <Button
          fullWidth
          onClick={handlePayment}
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? '처리 중...' : '결제하기'}
        </Button>
      </div>
    </PageContainer>
  )
}

export default OrderReviewPage
