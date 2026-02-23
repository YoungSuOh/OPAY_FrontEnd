import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Product, ShippingAddress, RecentProduct } from '../types'
import { getOrderList, getUserInfo, getDefaultShippingAddress, getShippingAddresses, getWalletBalance, getTransactions, addShippingAddress, updateShippingAddress, deleteShippingAddress, setDefaultShippingAddress, getTotalOrderCount, getMonthlyOrderCount } from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { useRecentProductsStore } from '../store/recentProductsStore'
import { getProduct } from '../utils/api'
import Button from '../components/Button'
import CartButton from '../components/CartButton'
import AddressModal from '../components/AddressModal'
import Header from '../components/Header'
import AuthModal from '../components/AuthModal'
import WalletChargeModal from '../components/WalletChargeModal'
import ConfirmModal from '../components/ConfirmModal'
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
  const { recentProducts } = useRecentProductsStore()
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [recentViewedProducts, setRecentViewedProducts] = useState<Product[]>([])
  const [userPoint, setUserPoint] = useState(0)
  const [userMoney, setUserMoney] = useState(0)
  const [monthlyOrderCount, setMonthlyOrderCount] = useState(0)
  const [totalOrderCount, setTotalOrderCount] = useState(0)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isWalletChargeModalOpen, setIsWalletChargeModalOpen] = useState(false)
  const [isLoginConfirmModalOpen, setIsLoginConfirmModalOpen] = useState(false)
  const [defaultAddress, setDefaultAddress] = useState<ShippingAddress | null>(null)
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null)
  
  // 비로그인 시 마이쇼핑 진입할 때마다 로그인 확인 모달 표시
  useEffect(() => {
    const isLogout = sessionStorage.getItem('is_logging_out')
    if (isLogout === 'true') {
      sessionStorage.removeItem('is_logging_out')
      return
    }
    if (isLoggedIn) {
      return
    }
    setIsLoginConfirmModalOpen(true)
  }, [isLoggedIn])

  // 로그인 성공 시 Auth 모달 닫기
  useEffect(() => {
    if (isLoggedIn && isAuthModalOpen) {
      setIsAuthModalOpen(false)
    }
  }, [isLoggedIn, isAuthModalOpen])
  
  // 데이터 로드 useEffect (모든 hooks는 early return 이전에 선언되어야 함)
  useEffect(() => {
    // 로그인하지 않은 경우 데이터 로드하지 않음
    if (!isLoggedIn) {
      return
    }
    const loadUserInfo = async () => {
      try {
        const userInfo = await getUserInfo()
        setUserPoint(userInfo.point)
        setUserMoney(userInfo.money)
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
      }
    }

    const loadDefaultAddress = async () => {
      try {
        const address = await getDefaultShippingAddress()
        if (address) {
          setDefaultAddress(address)
          setDefaultAddressId(address.id)
        }
        const allAddresses = await getShippingAddresses()
        setAddresses(allAddresses)
      } catch (error) {
        console.error('배송지 로드 실패:', error)
      }
    }

    const loadRecentTransactions = async () => {
      // 최근 결제 내역은 주문 목록으로 로드해 상품명·이미지(productImageUrl)를 확실히 표시
      try {
        const data = await getOrderList(1, 5)
        const payments: RecentPayment[] = data.orders.map((order) => {
          const firstItem = order.items?.[0] as { product?: { name?: string; imageUrl?: string }; productName?: string; productImageUrl?: string } | undefined
          const imgUrl = firstItem?.productImageUrl ?? firstItem?.product?.imageUrl
          const productName = firstItem?.productName ?? firstItem?.product?.name ?? '상품'
          return {
            orderId: order.orderId,
            productName,
            amount: order.totalAmount,
            status: order.deliveryStatus === 'DELIVERED' ? 'CONFIRMED' : 'COMPLETED',
            paidAt: order.createdAt,
            pointEarned: Math.floor(order.totalAmount * 0.025),
            imageUrl: imgUrl || undefined,
          }
        })
        setRecentPayments(payments)
      } catch (error) {
        console.error('최근 주문 내역 로드 실패:', error)
        try {
          const data = await getTransactions(0, 5)
          const payments: RecentPayment[] = data.content
            .filter((t) => t.type === 'PAYMENT' || t.type === 'CHARGE')
            .slice(0, 5)
            .map((t) => ({
              orderId: t.orderId ? String(t.orderId) : `TXN-${t.transactionId}`,
              productName: t.type === 'CHARGE' ? '머니 충전' : '상품 구매',
              amount: t.amount,
              status: t.status === 'COMPLETED' ? 'CONFIRMED' : t.status === 'PENDING' ? 'PROCESSING' : 'COMPLETED',
              paidAt: t.createdAt,
              pointEarned: t.type === 'PAYMENT' ? Math.floor(t.amount * 0.025) : undefined,
              imageUrl: undefined,
            }))
          setRecentPayments(payments)
        } catch (orderError) {
          console.error('주문 내역 로드 실패:', orderError)
          setRecentPayments([])
        }
      }
    }

    const loadRecentViewedProducts = async () => {
      if (recentProducts.length === 0) {
        setRecentViewedProducts([])
        return
      }
      try {
        const productDetails = await Promise.all(
          recentProducts.slice(0, 10).map(async (rp: RecentProduct) => {
            try {
              const product = await getProduct(rp.productId)
              return product
            } catch (error) {
              console.error(`상품 ID ${rp.productId} 로드 실패:`, error)
              return null
            }
          })
        )
        setRecentViewedProducts(productDetails.filter(p => p !== null) as Product[])
      } catch (error) {
        console.error('최근 조회한 상품 로드 실패:', error)
        setRecentViewedProducts([])
      }
    }

    const loadOrderStats = async () => {
      try {
        const [monthlyCount, totalCount] = await Promise.all([
          getMonthlyOrderCount(),
          getTotalOrderCount(),
        ])
        setMonthlyOrderCount(monthlyCount)
        setTotalOrderCount(totalCount)
      } catch (error) {
        console.error('주문 통계 로드 실패:', error)
        // 에러 발생 시 기본값 설정
        setMonthlyOrderCount(0)
        setTotalOrderCount(0)
      }
    }

    loadUserInfo()
    loadDefaultAddress()
    loadRecentTransactions()
    loadRecentViewedProducts()
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

  // early return은 모든 hooks 선언 이후에 위치해야 함
  if (!isLoggedIn) {
    return (
      <>
        <Header showSearch={true} showQButton={false} />
        {isLoginConfirmModalOpen && (
          <ConfirmModal
            isOpen={true}
            message="로그인이 필요한 서비스입니다. 로그인을 하시겠습니까?"
            confirmText="로그인"
            cancelText="취소"
            onConfirm={() => {
              setIsLoginConfirmModalOpen(false)
              setIsAuthModalOpen(true)
            }}
            onCancel={() => {
              setIsLoginConfirmModalOpen(false)
              navigate('/')
            }}
          />
        )}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => {
          setIsAuthModalOpen(false)
          if (!isLoggedIn) {
            navigate('/')
          }
        }} />
      </>
    )
  }

  return (
    <div className="my-shop-page">
      {/* 상단 헤더 */}
      <Header showSearch={true} showQButton={false} />

      <div className="my-shop-content">
        {/* 메인 콘텐츠 영역 */}
        <div className="main-content">         

          {/* 최근 결제 내역 (최근 5건, 더보기 → /order-history) */}
          <div className="recent-payments-section">
            <div className="recent-payments-section-header">
              <h2 className="section-title">최근 결제 내역</h2>
              <button
                type="button"
                className="recent-payments-more-btn"
                onClick={() => navigate('/order-history')}
              >
                더보기
              </button>
            </div>
            <div className="payments-list">
              {recentPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.orderId}
                  className="payment-item"
                  onClick={() => navigate(`/order-history?orderId=${payment.orderId}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/order-history?orderId=${payment.orderId}`)}
                >
                  <div className="payment-item-image-wrap">
                    {payment.imageUrl ? (
                      <img src={payment.imageUrl} alt={payment.productName} className="payment-item-image" />
                    ) : (
                      <span className="payment-item-image-placeholder">{payment.productName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="payment-item-content">
                    <h3 className="payment-product-name">{payment.productName}</h3>
                    <div className="payment-meta">
                      <span className="payment-date">{formatDate(payment.paidAt)}</span>
                      <span className="payment-status">{getStatusLabel(payment.status)}</span>
                    </div>
                    <div className="payment-amount">{payment.amount.toLocaleString()}원</div>
                    {payment.pointEarned != null && payment.pointEarned > 0 && (
                      <div className="payment-point">{payment.pointEarned}원 적립</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 본 상품 */}
          <div className="recent-viewed-section">
            <h2 className="section-title">최근 본 상품</h2>
            <div className="products-scroll">
              {recentViewedProducts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>최근 조회한 상품이 없습니다.</div>
              ) : (
                recentViewedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="product-card-small"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="product-image-placeholder">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        product.name.charAt(0)
                      )}
                    </div>
                    <div className="product-info-small">
                      <div 
                        className="product-name-small" 
                        title={product.name}
                      >
                        {product.name}
                      </div>
                      <div className="product-price-small">
                        {product.price.toLocaleString()}원
                      </div>
                      <div className="product-rating-small">
                        ★{product.averageRating?.toFixed(1) || 0} ({(product.reviewCount || 0)})
                      </div>
                    </div>
                  </div>
                ))
              )}
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
              {defaultAddress ? (
                <div className="default-address-info">
                  <div className="default-address-name">
                    {defaultAddress.name || '기본 배송지'}
                    {defaultAddress.isDefault && (
                      <span className="default-badge-small">기본</span>
                    )}
                  </div>
                  <div className="default-address-recipient">
                    {defaultAddress.recipient} ({defaultAddress.phone})
                  </div>
                  <div className="default-address-full">
                    {defaultAddress.postalCode && `(${defaultAddress.postalCode}) `}
                    {defaultAddress.address} {defaultAddress.detailAddress || ''}
                  </div>
                </div>
              ) : (
                <div className="default-address-info" style={{ color: '#999' }}>
                  등록된 배송지가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 마이쇼핑 */}
          <div className="my-shopping">
            <h3 className="sidebar-title">마이쇼핑</h3>
            <ul className="shopping-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/order-history'); }}>주문내역</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/my-reviews'); }}>내가 쓴 리뷰</a></li>
            </ul>
          </div>

          {/* 빠른 메뉴 */}
          <div className="quick-menu">
            <h3 className="sidebar-title">빠른 메뉴</h3>
            <ul className="menu-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); setIsWalletChargeModalOpen(true); }}>머니 충전</a></li>
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
        selectedAddressId={defaultAddressId || undefined}
        onSelectAddress={(addressId) => {
          setDefaultAddressId(addressId)
          setIsAddressModalOpen(false)
        }}
        onAddAddress={async (address) => {
          try {
            const newAddress = await addShippingAddress({
              name: address.name || null,
              recipient: address.recipient,
              phone: address.phone,
              address: address.address,
              detailAddress: address.detailAddress || null,
              postalCode: address.postalCode || null,
              isDefault: address.isDefault || false,
            })
            
            // 기본 배송지로 설정하는 경우
            if (newAddress.isDefault) {
              setDefaultAddress(newAddress)
              setDefaultAddressId(newAddress.id)
            }
            
            // 전체 배송지 목록 다시 로드
            const allAddresses = await getShippingAddresses()
            setAddresses(allAddresses)
          } catch (error) {
            console.error('배송지 추가 실패:', error)
            alert('배송지 추가에 실패했습니다.')
          }
        }}
        onSetDefault={async (addressId) => {
          try {
            const updatedAddress = await setDefaultShippingAddress(addressId)
            setDefaultAddress(updatedAddress)
            setDefaultAddressId(addressId)
            
            // 전체 배송지 목록 다시 로드
            const allAddresses = await getShippingAddresses()
            setAddresses(allAddresses)
          } catch (error) {
            console.error('기본 배송지 설정 실패:', error)
            alert('기본 배송지 설정에 실패했습니다.')
          }
        }}
      />

      {/* 머니 충전 모달 */}
      <WalletChargeModal
        isOpen={isWalletChargeModalOpen}
        onClose={() => setIsWalletChargeModalOpen(false)}
        onChargeSuccess={async () => {
          // 충전 성공 후 잔액 갱신
          try {
            const balance = await getWalletBalance()
            setUserMoney(balance)
          } catch (error) {
            console.error('잔액 갱신 실패:', error)
          }
        }}
      />
    </div>
  )
}

export default MyShop
