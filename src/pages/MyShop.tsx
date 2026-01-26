import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Product, ShippingAddress } from '../types'
import { getOrderList, getRecentProducts } from '../utils/api'
import { useAuthStore } from '../store/authStore'
import Button from '../components/Button'
import CartButton from '../components/CartButton'
import AddressModal from '../components/AddressModal'
import Header from '../components/Header'
import AuthModal from '../components/AuthModal'
import './MyShop.css'

interface RecentPayment {
  orderId: string
  productName: string
  amount: number
  status: 'COMPLETED' | 'CONFIRMED' | 'PROCESSING'
  paidAt: string
  pointEarned?: number
  imageUrl?: string
}

const MyShop = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [userPoint] = useState(412)
  const [userMoney] = useState(3114)
  const [monthlyOrderCount, setMonthlyOrderCount] = useState(0)
  const [totalOrderCount, setTotalOrderCount] = useState(0)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  // 로그인 체크 (컴포넌트 마운트 시 한 번만 실행)
  useEffect(() => {
    // 이미 확인했거나 로그인되어 있으면 실행하지 않음
    const hasChecked = sessionStorage.getItem('myshop_login_checked')
    if (hasChecked === 'true' || isLoggedIn) {
      return
    }
    
    // 확인 표시
    sessionStorage.setItem('myshop_login_checked', 'true')
    const shouldLogin = window.confirm('로그인이 필요한 서비스입니다. 로그인을 하시겠습니까?')
    if (shouldLogin) {
      setIsAuthModalOpen(true)
    } else {
      navigate('/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 의존성 배열로 마운트 시 한 번만 실행
  
  // 로그인 성공 시 모달 닫기 및 체크 플래그 초기화
  useEffect(() => {
    if (isLoggedIn) {
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false)
      }
      // 로그인 성공 시 체크 플래그 초기화 (다음 방문 시 다시 확인 가능)
      sessionStorage.removeItem('myshop_login_checked')
    }
  }, [isLoggedIn, isAuthModalOpen])
  
  if (!isLoggedIn) {
    return (
      <>
        <Header showSearch={true} showQButton={false} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => {
          setIsAuthModalOpen(false)
          if (!isLoggedIn) {
            navigate('/')
          }
        }} />
      </>
    )
  }
  const [addresses, setAddresses] = useState<ShippingAddress[]>([
    {
      id: '1',
      name: '집',
      recipient: '오영수',
      phone: '010-1234-5678',
      address: '경기도 성남시 분당구 발이봉남로31번길 10',
      detailAddress: '3층',
      postalCode: '13558',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: '회사',
      recipient: '오영수',
      phone: '010-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      detailAddress: '10층',
      postalCode: '06142',
      isDefault: false,
      createdAt: new Date().toISOString(),
    },
  ])
  const [defaultAddressId, setDefaultAddressId] = useState<string>('1')

  useEffect(() => {
    // 최근 결제 내역 로드
    const loadRecentPayments = async () => {
      try {
        const data = await getOrderList(1, 5)
        const payments: RecentPayment[] = data.orders.map((order) => ({
          orderId: order.orderId,
          productName: order.items[0]?.product.name || '상품',
          amount: order.totalAmount,
          status: order.deliveryStatus === 'DELIVERED' ? 'CONFIRMED' : 'COMPLETED',
          paidAt: order.createdAt,
          pointEarned: Math.floor(order.totalAmount * 0.025), // 2.5% 적립
        }))
        setRecentPayments(payments)
      } catch (error) {
        // 샘플 데이터
        setRecentPayments([
          {
            orderId: 'ORDER-001',
            productName: '프리미엄 플랜',
            amount: 9900,
            status: 'CONFIRMED',
            paidAt: new Date().toISOString(),
            pointEarned: 247,
          },
          {
            orderId: 'ORDER-002',
            productName: '베이직 플랜',
            amount: 4900,
            status: 'COMPLETED',
            paidAt: new Date(Date.now() - 3600000).toISOString(),
            pointEarned: 122,
          },
        ])
      }
    }

    // 추천 상품 로드
    const loadRecommendedProducts = async () => {
      try {
        const products = await getRecentProducts()
        setRecommendedProducts(products)
      } catch (error) {
        // 샘플 데이터
        setRecommendedProducts([
          {
            id: '1',
            name: '프리미엄 플랜',
            description: '모든 기능을 사용할 수 있는 프리미엄 플랜입니다.',
            price: 9900,
            stock: 100,
            averageRating: 5.0,
            reviewCount: 7,
          },
          {
            id: '2',
            name: '베이직 플랜',
            description: '기본 기능을 사용할 수 있는 베이직 플랜입니다.',
            price: 4900,
            stock: 50,
            averageRating: 4.8,
            reviewCount: 4475,
          },
          {
            id: '3',
            name: '스타터 플랜',
            description: '시작하기 좋은 스타터 플랜입니다.',
            price: 2900,
            stock: 30,
            averageRating: 4.8,
            reviewCount: 630,
          },
        ])
      }
    }

    // 주문 통계 로드
    const loadOrderStats = async () => {
      try {
        // 이달의 주문 건수
        const monthlyData = await getOrderList(1, 1000) // 충분히 큰 수로 전체 조회
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        const monthlyOrders = monthlyData.orders.filter((order) => {
          const orderDate = new Date(order.createdAt)
          return (
            orderDate.getMonth() === currentMonth &&
            orderDate.getFullYear() === currentYear
          )
        })
        setMonthlyOrderCount(monthlyOrders.length)
        setTotalOrderCount(monthlyData.orders.length)
      } catch (error) {
        // 샘플 데이터
        setMonthlyOrderCount(3)
        setTotalOrderCount(12)
      }
    }

    loadRecentPayments()
    loadRecommendedProducts()
    loadOrderStats()
  }, [])

  const getStatusLabel = (status: RecentPayment['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return '구매확정완료'
      case 'COMPLETED':
        return '결제완료'
      case 'PROCESSING':
        return '처리중'
      default:
        return '결제완료'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="my-shop-page">
      {/* 상단 헤더 */}
      <Header showSearch={true} showQButton={false} />

      <div className="my-shop-content">
        {/* 메인 콘텐츠 영역 */}
        <div className="main-content">
          {/* 서브 네비게이션 */}
          <div className="sub-nav">
            <button className="sub-nav-item active">전체</button>
            <button className="sub-nav-item">쇼핑</button>
            <button className="sub-nav-item">현장결제</button>
          </div>

          {/* 최근 결제 내역 */}
          <div className="recent-payments-section">
            <h2 className="section-title">최근 결제 내역</h2>
            <div className="payments-list">
              {recentPayments.map((payment) => (
                <div key={payment.orderId} className="payment-item">
                  <div className="payment-header">
                    <span className="payment-status">{getStatusLabel(payment.status)}</span>
                    <span className="payment-date">{formatDate(payment.paidAt)}</span>
                  </div>
                  <div className="payment-body">
                    <div className="payment-info">
                      <h3 className="payment-product-name">{payment.productName}</h3>
                      <div className="payment-amount">{payment.amount.toLocaleString()}원</div>
                      {payment.pointEarned && (
                        <div className="payment-point">
                          {payment.pointEarned}원 적립 완료
                        </div>
                      )}
                    </div>
                  </div>
                  {payment.status === 'COMPLETED' && (
                    <div className="payment-actions">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/order-history?orderId=${payment.orderId}`)}
                      >
                        포인트 뽑기
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 추천 상품 */}
          <div className="recommended-section">
            <h2 className="section-title">관심 있을만한 상품</h2>
            <div className="products-scroll">
              {recommendedProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card-small"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div className="product-badge">구매 {(product.reviewCount || 0)}+</div>
                  <div className="product-image-placeholder">
                    {product.name.charAt(0)}
                  </div>
                  <div className="product-info-small">
                    <div className="product-name-small">{product.name}</div>
                    <div className="product-price-small">
                      {product.price.toLocaleString()}원
                    </div>
                    <div className="product-rating-small">
                      ★{product.averageRating} ({(product.reviewCount || 0)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="sidebar">
          {/* 사용자 프로필 */}
          <div className="user-profile">
            <div className="profile-header">
              <h3 className="user-name">사용자</h3>
              <span className="user-id">user123</span>
            </div>
            
            {/* 포인트/머니 정보 */}
            <div className="profile-wallet-info">
              <div className="wallet-info-item">
                <span className="wallet-info-label">O포인트</span>
                <span className="wallet-info-amount">{userPoint.toLocaleString()}원</span>
              </div>
              <div className="wallet-info-item">
                <span className="wallet-info-label">O머니</span>
                <span className="wallet-info-amount">{userMoney.toLocaleString()}원</span>
              </div>
            </div>

            {/* 주문 통계 */}
            <div className="order-stats">
              <div className="order-stat-item">
                <span className="order-stat-label">이달의 주문</span>
                <span className="order-stat-value">{monthlyOrderCount}건</span>
              </div>
              <div className="order-stat-item">
                <span className="order-stat-label">전체 주문</span>
                <span className="order-stat-value">{totalOrderCount}건</span>
              </div>
            </div>

            {/* 기본 배송지 */}
            <div className="default-address-section">
              <div className="address-section-header">
                <h4 className="address-section-title">기본 배송지</h4>
                <button
                  className="change-default-address-btn"
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  변경
                </button>
              </div>
              {(() => {
                const defaultAddress = addresses.find((addr) => addr.id === defaultAddressId) || addresses.find((addr) => addr.isDefault)
                if (!defaultAddress) return null
                return (
                  <div className="default-address-info">
                    <div className="default-address-name">
                      {defaultAddress.name}
                      {defaultAddress.isDefault && (
                        <span className="default-badge-small">기본</span>
                      )}
                    </div>
                    <div className="default-address-recipient">
                      {defaultAddress.recipient} ({defaultAddress.phone})
                    </div>
                    <div className="default-address-full">
                      ({defaultAddress.postalCode}) {defaultAddress.address} {defaultAddress.detailAddress}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* 마이쇼핑 */}
          <div className="my-shopping">
            <h3 className="sidebar-title">마이쇼핑</h3>
            <ul className="shopping-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/orders'); }}>주문내역</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>찜한상품</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>최근본상품</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/products/1'); }}>상품리뷰</a></li>
            </ul>
          </div>

          {/* 빠른 메뉴 */}
          <div className="quick-menu">
            <h3 className="sidebar-title">빠른 메뉴</h3>
            <ul className="menu-links">
              <li><a href="#">포인트내역</a></li>
              <li><a href="#">머니 내역</a></li>
              <li><a href="#">머니 충전</a></li>
            </ul>
          </div>
        </div>
      </div>

      <CartButton />

      {/* 배송지 선택 모달 */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={addresses}
        selectedAddressId={defaultAddressId}
        onSelectAddress={(addressId) => {
          setDefaultAddressId(addressId)
          setIsAddressModalOpen(false)
        }}
        onAddAddress={(address) => {
          const newAddress: ShippingAddress = {
            ...address,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          }
          
          // 기본 배송지로 설정하는 경우 기존 기본 배송지 해제
          if (address.isDefault) {
            setAddresses((prev) =>
              prev.map((addr) => ({ ...addr, isDefault: false }))
            )
            setDefaultAddressId(newAddress.id)
          }
          
          setAddresses((prev) => [...prev, newAddress])
        }}
        onSetDefault={(addressId) => {
          setAddresses((prev) =>
            prev.map((addr) => ({
              ...addr,
              isDefault: addr.id === addressId,
            }))
          )
          setDefaultAddressId(addressId)
        }}
      />
    </div>
  )
}

export default MyShop
