import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getOrderHistory, getOrderList } from '../utils/api'
import { OrderInfo, PaymentResult } from '../types'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './OrderHistoryPage.css'

const PAGE_SIZE = 10
const PAGES_PER_BLOCK = 5

// API 응답이 백엔드 OrderResponse 형태(id, items: { productName, productImageUrl, price })일 때 정규화
const normalizeOrderDetail = (data: {
  id?: number
  orderId?: string
  items?: Array<{
    productId?: number
    productName?: string
    productImageUrl?: string
    quantity: number
    price?: number
    totalPrice?: number
    product?: { name?: string; price?: number; imageUrl?: string }
  }>
  totalAmount?: number
  paymentMethod?: string
  paymentResult?: PaymentResult
  deliveryTimeline?: Array<{ status: string; message: string; timestamp: string }>
  createdAt?: string
}): OrderInfo & { paymentResult?: PaymentResult } => {
  const orderId = String(data.orderId ?? data.id ?? '')
  const items = (data.items ?? []).map((item) => ({
    product: {
      id: String(item.productId ?? item.product?.id ?? ''),
      name: item.productName ?? item.product?.name ?? '',
      price: Number(item.price ?? item.product?.price ?? 0),
      description: '',
      stock: 0,
      imageUrl: item.productImageUrl ?? item.product?.imageUrl,
    },
    quantity: item.quantity,
  }))
  return {
    orderId,
    items,
    totalAmount: Number(data.totalAmount ?? 0),
    paymentMethod: (data.paymentMethod as OrderInfo['paymentMethod']) ?? 'CARD',
    deliveryTimeline: data.deliveryTimeline,
    createdAt: data.createdAt ?? new Date().toISOString(),
    paymentResult: data.paymentResult,
  }
}

const OrderHistoryPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [orders, setOrders] = useState<OrderInfo[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [isListLoading, setIsListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // 목록 모드: 주문 목록 API (10개씩 페이징, 최근순)
  useEffect(() => {
    if (orderId) return
    const load = async () => {
      setIsListLoading(true)
      setListError(null)
      try {
        const data = await getOrderList(currentPage, PAGE_SIZE)
        setOrders(data.orders ?? [])
        const total = data.totalPages ?? 1
        setTotalPages(total)
        setHasNext(!!(data.hasNext ?? data.hasMore))
        setHasPrevious(currentPage > 1)
      } catch (err) {
        console.error('주문 목록 로드 실패:', err)
        setListError(err instanceof Error ? err.message : '주문 목록을 불러오지 못했습니다.')
        setOrders([])
      } finally {
        setIsListLoading(false)
      }
    }
    load()
  }, [orderId, currentPage])

  // 상세 모드: 주문 상세 API
  useEffect(() => {
    if (!orderId) {
      setOrderInfo(null)
      setPaymentResult(null)
      setDetailError(null)
      return
    }
    const load = async () => {
      setIsDetailLoading(true)
      setDetailError(null)
      try {
        const data = await getOrderHistory(orderId)
        const normalized = normalizeOrderDetail(data as unknown as Parameters<typeof normalizeOrderDetail>[0])
        setOrderInfo(normalized)
        setPaymentResult(normalized.paymentResult ?? null)
      } catch (err) {
        console.error('주문 내역 로드 실패:', err)
        setDetailError(err instanceof Error ? err.message : '주문 내역을 불러오지 못했습니다.')
        setOrderInfo(null)
        setPaymentResult(null)
      } finally {
        setIsDetailLoading(false)
      }
    }
    load()
  }, [orderId])

  const handleGoHome = () => navigate('/')
  const handleBackToList = () => navigate('/order-history')

  // 5개 단위 블록(1~5, 6~10 ...), 실제 주문 내역 페이지 수(totalPages)만큼만 버튼 생성
  const blockIndex = Math.floor((currentPage - 1) / PAGES_PER_BLOCK)
  const startPage = blockIndex * PAGES_PER_BLOCK + 1
  const endPageInBlock = Math.min(startPage + PAGES_PER_BLOCK - 1, totalPages)
  const pageNumbers = Array.from(
    { length: endPageInBlock - startPage + 1 },
    (_, i) => startPage + i
  )
  const canGoPrevBlock = blockIndex > 0
  const goPrevBlock = () => setCurrentPage(startPage - 1)
  const goNextBlock = () => setCurrentPage(startPage + PAGES_PER_BLOCK)

  // ---------- 목록 뷰 ----------
  if (!orderId) {
    return (
      <div className="order-history-page">
        <Header showSearch={false} showQButton={false} />
        <div className="order-history-content">
          <h1 className="order-history-page-title">주문 내역</h1>

          {listError && (
            <div className="order-section order-history-error-section">
              <p className="error-message">{listError}</p>
              <Button onClick={() => setCurrentPage(1)} variant="primary">다시 시도</Button>
            </div>
          )}

          {!listError && orders.length === 0 && !isListLoading && (
            <div className="order-section order-history-empty-section">
              <p className="empty-message">주문 내역이 없습니다.</p>
              <Button onClick={handleGoHome} variant="primary">메인으로 이동</Button>
            </div>
          )}

          {!listError && (orders.length > 0 || isListLoading) && (
            <>
            <div className="order-history-list">
              {orders.map((order, index) => {
                const oid = order.orderId ?? String((order as { id?: number }).id ?? index)
                return (
                <div
                  key={oid}
                  className="order-section order-history-card"
                  onClick={() => navigate(`/order-history?orderId=${oid}`)}
                >
                  <div className="order-card-header">
                    <span className="order-id">주문 번호: <strong>{oid}</strong></span>
                    <span className="order-date">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ko-KR') : ''}
                    </span>
                  </div>
                  <div className="order-card-items">
                    {(order.items ?? []).slice(0, 3).map((item, idx) => {
                      const name = item.product?.name ?? (item as { productName?: string }).productName ?? ''
                      const imgUrl = item.product?.imageUrl ?? (item as { productImageUrl?: string }).productImageUrl
                      return (
                      <div key={idx} className="order-card-item-preview">
                        <div className="order-item-image">
                          {imgUrl ? (
                            <img src={imgUrl} alt={name} />
                          ) : (
                            <span className="order-item-image-placeholder">{name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="order-card-item-name">{name}</span>
                        {item.quantity > 1 && <span className="order-card-item-qty">×{item.quantity}</span>}
                      </div>
                    );
                    })}
                    {(order.items ?? []).length > 3 && (
                      <span className="order-card-more">외 {(order.items ?? []).length - 3}건</span>
                    )}
                  </div>
                  <div className="order-card-footer">
                    <span className="order-card-total">총 {order.totalAmount?.toLocaleString() ?? 0}원</span>
                    <span className="order-card-link">상세 보기 ›</span>
                  </div>
                </div>
              );
              })}
            </div>
            {isListLoading && <div className="order-history-paging-loading"><LoadingSpinner /></div>}
            <div className="order-history-paging">
              <Button
                variant="secondary"
                onClick={goPrevBlock}
                disabled={!canGoPrevBlock || isListLoading}
              >
                이전
              </Button>
              <div className="order-history-page-numbers">
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`order-history-page-num ${num === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(num)}
                    disabled={isListLoading}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={goNextBlock}
                disabled={!hasNext || isListLoading}
              >
                다음
              </Button>
            </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ---------- 상세 뷰 (로딩) ----------
  if (isDetailLoading) {
    return (
      <div className="order-history-page">
        <Header showSearch={false} showQButton={false} />
        <div className="order-history-content">
          <LoadingSpinner />
          <p className="order-review-loading-text">주문 내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // ---------- 상세 뷰 (에러) ----------
  if (detailError) {
    return (
      <div className="order-history-page">
        <Header showSearch={false} showQButton={false} />
        <div className="order-history-content">
          <h1 className="order-history-page-title">주문 내역</h1>
          <div className="order-section order-history-error-section">
            <p className="error-message">{detailError}</p>
            <div className="empty-actions">
              <Button onClick={() => window.location.reload()} variant="primary">다시 시도</Button>
              <Button onClick={handleBackToList} variant="secondary">목록으로</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------- 상세 뷰 (데이터 없음) ----------
  if (!orderInfo) {
    return (
      <div className="order-history-page">
        <Header showSearch={false} showQButton={false} />
        <div className="order-history-content">
          <h1 className="order-history-page-title">주문 내역</h1>
          <div className="order-section order-history-empty-section">
            <p className="empty-message">주문 정보를 찾을 수 없습니다.</p>
            <Button onClick={handleBackToList} variant="primary">목록으로</Button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- 상세 뷰 (정상) ----------
  const productName = (item: OrderInfo['items'][0]) =>
    item.product?.name ?? (item as { productName?: string }).productName ?? ''
  const productPrice = (item: OrderInfo['items'][0]) =>
    item.product?.price ?? (item as { price?: number }).price ?? 0
  const productImageUrl = (item: OrderInfo['items'][0]) =>
    item.product?.imageUrl ?? (item as { productImageUrl?: string }).productImageUrl

  return (
    <div className="order-history-page">
      <Header showSearch={false} showQButton={false} />
      <div className="order-history-content">
        <h1 className="order-history-page-title">주문 내역</h1>

        <div className="order-history">
          <div className="order-section">
            <h2 className="section-title">주문 정보</h2>
            <div className="order-id">주문 번호: <strong>{orderInfo.orderId}</strong></div>
            <div className="order-items">
              {orderInfo.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="order-item-image">
                    {productImageUrl(item) ? (
                      <img src={productImageUrl(item)!} alt={productName(item)} />
                    ) : (
                      <span className="order-item-image-placeholder">{productName(item).charAt(0)}</span>
                    )}
                  </div>
                  <div className="item-info">
                    <span className="item-name">{productName(item)}</span>
                    <span className="item-quantity">수량: {item.quantity}</span>
                  </div>
                  <div className="item-price">
                    {(productPrice(item) * item.quantity).toLocaleString()}원
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

          {paymentResult && (
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
                <span className="detail-value">{paymentResult.amount.toLocaleString()}원</span>
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
          )}

          <div className="order-section total-section">
            <div className="total-amount">
              <span className="total-label">총 결제 금액</span>
              <span className="total-value">{orderInfo.totalAmount.toLocaleString()}원</span>
            </div>
          </div>

          <div className="order-history-actions">
            <Button onClick={handleBackToList} variant="secondary">목록으로</Button>
            <Button onClick={handleGoHome} variant="primary">메인으로 이동</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderHistoryPage
