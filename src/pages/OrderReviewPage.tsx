import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentStore } from '../store/paymentStore'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { PaymentMethod } from '../types'
import { createOrder, requestPaymentId, generateIdempotencyKey, validateCartBeforeCheckout, getWalletBalance, getUserInfo } from '../utils/api'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import ConfirmModal from '../components/ConfirmModal'
import './OrderReviewPage.css'

const OrderReviewPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const { setCurrentOrder, setProcessing, setPaymentSession } = usePaymentStore()
  const { getCartItems, serverCartItems } = useCartStore()
  const [useOpayMoney, setUseOpayMoney] = useState(false)
  const [useOpayPoint, setUseOpayPoint] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [userPoint, setUserPoint] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [orderInfo, setOrderInfo] = useState<{
    orderId: string
    totalAmount: number
    items: Array<{ name: string; quantity: number; price: number; imageUrl?: string }>
  } | null>(null)
  const [serverOrder, setServerOrder] = useState<import('../types').OrderInfo | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    outOfStock?: string[]
    priceChanged?: string[]
  }>({})
  const [cartEmpty, setCartEmpty] = useState(false)
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null)
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false)

  const loadOrderInfo = async () => {
    setIsValidating(true)
    setCartEmpty(false)
    setOrderLoadError(null)
    const cartItems = getCartItems()

    if (cartItems.length === 0) {
      setOrderInfo(null)
      setCartEmpty(true)
      setIsValidating(false)
      setIsLoading(false)
      return
    }

    try {
      const validation = await validateCartBeforeCheckout()

      if (!validation.isValid) {
        setValidationErrors({
          outOfStock: validation.outOfStockItems,
          priceChanged: validation.priceChangedItems,
        })

        if (validation.outOfStockItems && validation.outOfStockItems.length > 0) {
          alert('재고가 부족한 상품이 있습니다. 장바구니를 확인해주세요.')
          navigate('/cart')
          setIsValidating(false)
          setIsLoading(false)
          return
        }
      }

      const items = cartItems.map((item) => ({
        productId: Number(item.product.id),
        quantity: item.quantity,
      }))

      const order = await createOrder(items, { clearCart: false })
      setServerOrder(order)
      setOrderInfo({
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        items: order.items.map((item) => ({
          name: item.product?.name ?? (item as { productName?: string }).productName ?? '',
          quantity: item.quantity,
          price: item.product?.price ?? (item as { price?: number }).price ?? 0,
          imageUrl: item.product?.imageUrl ?? (item as { productImageUrl?: string }).productImageUrl,
        })),
      })
    } catch (error) {
      console.error('주문 정보 로드 실패:', error)
      setOrderInfo(null)
      setOrderLoadError(error instanceof Error ? error.message : '주문 정보를 불러오지 못했습니다.')
    } finally {
      setIsValidating(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrderInfo()
  }, [serverCartItems, navigate, getCartItems])

  // 로그인 시 회원 머니·포인트 조회
  useEffect(() => {
    if (!isLoggedIn) return
    const loadBalanceAndPoint = async () => {
      try {
        const [balance, userInfo] = await Promise.all([
          getWalletBalance(),
          getUserInfo(),
        ])
        setWalletBalance(balance)
        setUserPoint(userInfo.point ?? 0)
      } catch (error) {
        console.error('잔액/포인트 조회 실패:', error)
      }
    }
    loadBalanceAndPoint()
  }, [isLoggedIn])

  const handlePayment = async () => {
    if (!orderInfo) return

    // 결제 수단 선택 시 잔액·포인트 부족 여부 사전 검사 (payment-processing 이동 전 처리)
    const totalAvailable =
      (useOpayMoney ? (walletBalance ?? 0) : 0) + (useOpayPoint ? (userPoint ?? 0) : 0)
    if (totalAvailable < orderInfo.totalAmount) {
      setShowInsufficientBalanceModal(true)
      return
    }

    setIsLoading(true)
    setProcessing(true)

    try {
      const idempotencyKey = generateIdempotencyKey()

      // PaymentId 발급 요청
      const { paymentId } = await requestPaymentId(
        orderInfo.orderId,
        orderInfo.totalAmount,
        'CARD' as PaymentMethod,
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
        paymentMethod: 'CARD',
        paymentId,
        idempotencyKey,
        createdAt: new Date().toISOString(),
      })

      // PG 연동이 필요한 경우
      if (false) {
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

  if (isValidating || (isLoading && !orderInfo && !cartEmpty && !orderLoadError)) {
    return (
      <div className="order-review-page">
        <Header showSearch={false} showQButton={false} />
        <div className="order-review-content">
          <LoadingSpinner />
          <p className="order-review-loading-text">재고 및 가격을 확인 중입니다...</p>
        </div>
      </div>
    )
  }

  if (cartEmpty) {
    return (
      <div className="order-review-page">
        <Header showSearch={false} showQButton={false} />
        <div className="order-review-content">
          <div className="order-review order-review-empty">
            <h1 className="order-review-page-title">주문 확인</h1>
            <div className="order-section empty-message-section">
              <p className="empty-message">장바구니가 비어 있습니다.</p>
              <p className="empty-message-sub">상품을 담은 후 주문해 주세요.</p>
              <div className="empty-actions">
                <Button variant="primary" onClick={() => navigate('/cart')}>
                  장바구니로 이동
                </Button>
                <Button variant="secondary" onClick={() => navigate('/')}>
                  상품 목록 보기
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (orderLoadError) {
    return (
      <div className="order-review-page">
        <Header showSearch={false} showQButton={false} />
        <div className="order-review-content">
          <div className="order-review order-review-error">
            <h1 className="order-review-page-title">주문 확인</h1>
            <div className="order-section error-message-section">
              <p className="error-message-title">주문 정보를 불러오지 못했습니다</p>
              <p className="error-message-detail">{orderLoadError}</p>
              <div className="empty-actions">
                <Button variant="primary" onClick={() => loadOrderInfo()}>
                  다시 시도
                </Button>
                <Button variant="secondary" onClick={() => navigate('/cart')}>
                  장바구니로 이동
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!orderInfo) {
    return null
  }

  const hasPaymentSelected = useOpayMoney || useOpayPoint

  return (
    <div className="order-review-page">
      <Header showSearch={false} showQButton={false} />
      <div className="order-review-content">
        <div className="order-review">
          <h1 className="order-review-page-title">주문 확인</h1>

        <div className="order-section">
          <h2 className="section-title">주문 정보</h2>
          <div className="order-id">
            주문 번호: <strong>{orderInfo.orderId}</strong>
          </div>
          <div className="order-items">
            {orderInfo.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="order-item-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <span className="order-item-image-placeholder">{item.name.charAt(0)}</span>
                  )}
                </div>
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

        {/* 회원 머니·포인트 잔액 */}
        {isLoggedIn && (walletBalance !== null || userPoint !== null) && (
          <div className="order-section balance-section">
            <h2 className="section-title">보유 잔액</h2>
            <div className="balance-cards">
              <div className="balance-card">
                <span className="balance-label">OPAY 머니</span>
                <span className="balance-value">
                  {walletBalance !== null ? walletBalance.toLocaleString() : '-'}원
                </span>
              </div>
              <div className="balance-card">
                <span className="balance-label">O포인트</span>
                <span className="balance-value">
                  {userPoint !== null ? userPoint.toLocaleString() : '-'}P
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="order-section">
          <h2 className="section-title">결제 수단</h2>
          <p className="payment-hint">OPAY 머니와 O포인트를 단일 또는 중복 선택할 수 있습니다.</p>
          <div className="payment-methods payment-methods-opay">
            <label className="payment-method-option payment-method-checkbox">
              <input
                type="checkbox"
                checked={useOpayMoney}
                onChange={(e) => setUseOpayMoney(e.target.checked)}
              />
              <span>OPAY 머니</span>
              {walletBalance !== null && (
                <span className="payment-amount-hint">(보유: {walletBalance.toLocaleString()}원)</span>
              )}
            </label>
            <label className="payment-method-option payment-method-checkbox">
              <input
                type="checkbox"
                checked={useOpayPoint}
                onChange={(e) => setUseOpayPoint(e.target.checked)}
              />
              <span>O포인트</span>
              {userPoint !== null && (
                <span className="payment-amount-hint">(보유: {userPoint.toLocaleString()}P)</span>
              )}
            </label>
          </div>
          {!hasPaymentSelected && (
            <p className="payment-required-hint">결제 수단을 하나 이상 선택해주세요.</p>
          )}
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
          disabled={isLoading || !hasPaymentSelected}
        >
          {isLoading ? '처리 중...' : '결제하기'}
        </Button>

        {/* 잔액 부족 시 OPay 스타일 확인 모달 */}
        <ConfirmModal
          isOpen={showInsufficientBalanceModal}
          title="잔액 부족"
          message="OPAY 머니·O포인트 잔액이 부족합니다. 충전 후 결제해 주세요."
          cancelText="닫기"
          confirmText="충전하러 가기"
          onCancel={() => setShowInsufficientBalanceModal(false)}
          onConfirm={() => {
            setShowInsufficientBalanceModal(false)
            navigate('/my-shop')
          }}
        />
        </div>
      </div>
    </div>
  )
}

export default OrderReviewPage
