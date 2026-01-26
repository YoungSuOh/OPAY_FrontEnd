import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrderList } from '../utils/api'
import { OrderInfo, DeliveryStatus } from '../types'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './OrderListPage.css'

const OrderListPage = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderInfo[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getOrderList(page, 10)
        if (page === 1) {
          setOrders(data.orders)
        } else {
          setOrders((prev) => [...prev, ...data.orders])
        }
        setHasMore(data.hasMore)
      } catch (error) {
        console.error('주문 목록 로드 실패:', error)
        // 샘플 데이터
        setOrders([
          {
            orderId: 'ORDER-001',
            items: [],
            totalAmount: 9900,
            paymentMethod: 'CARD',
            deliveryStatus: 'DELIVERED',
            createdAt: new Date().toISOString(),
          },
        ])
        setHasMore(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [page])

  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastOrderElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setPage((prev) => prev + 1)
      }
    })
    if (node) observerRef.current.observe(node)
  }, [isLoading, hasMore])

  const getStatusLabel = (status?: DeliveryStatus) => {
    switch (status) {
      case 'PREPARING':
        return '준비 중'
      case 'SHIPPED':
        return '배송 중'
      case 'IN_TRANSIT':
        return '배송 중'
      case 'DELIVERED':
        return '배송 완료'
      case 'CANCELLED':
        return '취소됨'
      default:
        return '처리 중'
    }
  }

  const getStatusColor = (status?: DeliveryStatus) => {
    switch (status) {
      case 'DELIVERED':
        return '#10b981'
      case 'CANCELLED':
        return '#ef4444'
      default:
        return '#0284c7' // sky-blue-600
    }
  }

  if (isLoading && orders.length === 0) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="구매 내역">
      <Header showSearch={false} showQButton={false} />
      {orders.length === 0 ? (
        <div className="empty-orders">
          <p>주문 내역이 없습니다.</p>
          <Button onClick={() => navigate('/products')} variant="primary">
            상품 보러가기
          </Button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order, index) => (
            <div
              key={order.orderId}
              className="order-card"
              onClick={() => navigate(`/order-history?orderId=${order.orderId}`)}
              ref={index === orders.length - 1 ? lastOrderElementRef : null}
            >
              <div className="order-header">
                <div className="order-id">
                  주문번호: <strong>{order.orderId}</strong>
                </div>
                <div
                  className="order-status"
                  style={{ color: getStatusColor(order.deliveryStatus) }}
                >
                  {getStatusLabel(order.deliveryStatus)}
                </div>
              </div>
              <div className="order-info">
                <div className="order-date">
                  {new Date(order.createdAt).toLocaleString('ko-KR')}
                </div>
                <div className="order-amount">
                  {order.totalAmount.toLocaleString()}원
                </div>
              </div>
              <div className="order-items-preview">
                {order.items.slice(0, 2).map((item, idx) => (
                  <span key={idx} className="item-preview">
                    {item.product.name} {item.quantity}개
                  </span>
                ))}
                {order.items.length > 2 && (
                  <span className="item-more">외 {order.items.length - 2}개</span>
                )}
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="load-more-container">
              <LoadingSpinner />
            </div>
          )}
          {!hasMore && orders.length > 0 && (
            <p style={{ textAlign: 'center', color: '#64748b' }}>
              모든 주문을 불러왔습니다.
            </p>
          )}
        </div>
      )}
    </PageContainer>
  )
}

export default OrderListPage
