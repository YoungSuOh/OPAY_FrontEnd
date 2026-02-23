import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { CartItem, ShippingAddress } from '../types'
import Button from '../components/Button'
import CartButton from '../components/CartButton'
import AddressModal from '../components/AddressModal'
import AuthModal from '../components/AuthModal'
import ConfirmModal from '../components/ConfirmModal'
import Header from '../components/Header'
import './CartPage.css'

const CartPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const { 
    getCartItems, 
    loadCartItems, 
    updateQuantity, 
    removeFromCart,
    removeFromCartByProductId,
    isSyncing,
    isLoading 
  } = useCartStore()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isLoginConfirmModalOpen, setIsLoginConfirmModalOpen] = useState(false)

  // 비로그인 시 장바구니 진입할 때마다 로그인 확인 모달 표시
  useEffect(() => {
    const isLogout = sessionStorage.getItem('is_logging_out')
    if (isLogout === 'true') {
      sessionStorage.removeItem('is_logging_out')
      return
    }
    if (!isLoggedIn) {
      setIsLoginConfirmModalOpen(true)
    }
  }, [isLoggedIn])
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
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
  const [selectedAddressId, setSelectedAddressId] = useState<string>('1')

  useEffect(() => {
    // 서버에서 장바구니 로드
    const loadCart = async () => {
      if (isLoggedIn) {
        await loadCartItems()
      }
      const items = getCartItems() || []
      setCartItems(items)
      // 초기 선택 상태: 모든 아이템 선택
      if (items.length > 0) {
        setSelectedItems(new Set(items.map((item) => item.product.id)))
      } else {
        setSelectedItems(new Set())
        setSelectAll(false)
      }
    }
    loadCart()
  }, [isLoggedIn, loadCartItems, getCartItems])

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set())
      setSelectAll(false)
    } else {
      const items = cartItems || []
      setSelectedItems(new Set(items.map((item) => item.product.id)))
      setSelectAll(true)
    }
  }

  // 개별 아이템 선택/해제
  const handleItemSelect = (productId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedItems(newSelected)
    setSelectAll(newSelected.size === cartItems.length)
  }

  // 선택된 아이템 삭제 확인 모달 열기
  const handleDeleteSelectedClick = () => {
    if (selectedItems.size === 0) {
      return
    }
    setIsConfirmModalOpen(true)
  }

  // 선택된 아이템 삭제 실행
  const handleDeleteSelected = async () => {
    setIsConfirmModalOpen(false)
    const itemsToDelete = cartItems.filter((item) => selectedItems.has(item.product.id))
    for (const item of itemsToDelete) {
      if (item.cartId) {
        // 서버 장바구니 항목 삭제
        await removeFromCart(item.cartId)
      } else {
        // 로컬 장바구니 항목 삭제 (비로그인 상태)
        removeFromCartByProductId(item.product.id)
      }
    }
    // 장바구니 다시 로드
    if (isLoggedIn) {
      await loadCartItems()
    }
    const items = getCartItems()
    setCartItems(items)
    setSelectedItems(new Set())
    setSelectAll(false)
  }

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      alert('주문할 상품을 선택해주세요.')
      return
    }
    navigate('/order-review')
  }

  // 선택된 아이템들의 총액 계산
  const selectedItemsList = (cartItems || []).filter((item) =>
    selectedItems.has(item.product.id)
  )

  const selectedProductAmount = selectedItemsList.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  // 할인 금액 (예시: 10% 할인)
  const discountAmount = Math.floor(selectedProductAmount * 0.1)
  const orderAmount = selectedProductAmount - discountAmount
  const shippingFee = selectedProductAmount >= 50000 ? 0 : 3000

  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId) || addresses[0]

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId)
    setIsAddressModalOpen(false)
  }

  const handleAddAddress = (address: Omit<ShippingAddress, 'id' | 'createdAt'>) => {
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
    }
    
    setAddresses((prev) => [...prev, newAddress])
    
    if (address.isDefault) {
      setSelectedAddressId(newAddress.id)
    }
  }

  const handleSetDefault = (addressId: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      }))
    )
    setSelectedAddressId(addressId)
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
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false)
            if (!isLoggedIn) {
              navigate('/')
            }
          }}
        />
      </>
    )
  }

  return (
    <div className="cart-page">
      {/* 상단 헤더 */}
      <Header showSearch={true} showQButton={false} />

      {/* 빵부스러기 네비게이션 */}
      <div className="breadcrumbs">
        <span>장바구니</span>
        <span className="breadcrumb-separator">{'>'}</span>
        <span>주문/결제</span>
        <span className="breadcrumb-separator">{'>'}</span>
        <span>완료</span>
      </div>

      {isSyncing && (
        <div className="sync-indicator">동기화 중...</div>
      )}

      {(cartItems || []).length === 0 ? (
        <div className="empty-cart">
          <p>장바구니가 비어있습니다.</p>
          <Button onClick={() => navigate('/')} variant="primary">
            상품 보러가기
          </Button>
        </div>
      ) : (
        <div className="cart-content">
          {/* 배송 정보 섹션 */}
          <div className="delivery-section">
            <div className="delivery-type">
              <span>일반배송 {cartItems.length}</span>
              <span className="delivery-separator">|</span>
              <span>컬리N마트ㆍ지금배달 0</span>
            </div>
            <div className="delivery-address">
              <span className="address-label">배송지 :</span>
              <span className="address-text">
                {selectedAddress.recipient} {selectedAddress.address} {selectedAddress.detailAddress}
              </span>
              <button
                className="change-address-btn"
                onClick={() => setIsAddressModalOpen(true)}
              >
                변경
              </button>
            </div>
            <div className="delivery-info-banner">
              등록한 배송지 기준 빠른배송 상품을 보실 수 있습니다.
            </div>
          </div>

          {/* 전체 선택 및 삭제 */}
          <div className="cart-controls">
            <label className="select-all-checkbox">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <span>전체 선택</span>
            </label>
            {selectedItems.size > 0 && (
              <button className="delete-selected-btn" onClick={handleDeleteSelectedClick}>
                X 선택 삭제
              </button>
            )}
          </div>

          {/* 판매자별 상품 그룹 */}
          <div className="seller-group">
            <div className="seller-header">
              <div className="seller-info">
                <span className="seller-verified">✓</span>
                <span className="seller-name">OPAY 공식인증점</span>
                <span className="seller-badge">스마트스토어</span>
              </div>
              <button className="coupon-btn">쿠폰받기</button>
            </div>

            {/* 상품 목록 */}
            <div className="products-in-cart">
              {(cartItems || []).map((item) => {
                const isSelected = selectedItems.has(item.product.id)
                const originalPrice = item.product.price * 1.5 // 예시 할인가
                const discountRate = Math.floor(
                  ((originalPrice - item.product.price) / originalPrice) * 100
                )

                return (
                  <div key={item.product.id} className="cart-product-item">
                    <div className="product-select">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleItemSelect(item.product.id)}
                      />
                    </div>

                    <div className="product-main-info">
                      {/* 태그 */}
                      <div className="product-tags">
                        <span className="tag gift">선물가능상품</span>
                        <span className="tag return">무료교환반품</span>
                      </div>

                      {/* 배송 정보 */}
                      <div className="delivery-info">
                        <span className="delivery-time">
                          오늘출발 16:00 이후 주문 시 1.26.(월) 발송 예정?
                        </span>
                        <span className="arrival-info">
                          1. 27.(화) 도착확률 91%
                        </span>
                      </div>

                      <div className="product-details-row">
                        {/* 상품 이미지 */}
                        <div className="product-image-cart">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} />
                          ) : (
                            <div className="product-image-placeholder">
                              {item.product.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* 상품 정보 */}
                        <div className="product-info-cart">
                          <h3 className="product-name-cart">{item.product.name}</h3>
                          <div className="product-price-row">
                            <span className="discount-rate">{discountRate}%</span>
                            <span className="product-price-current">
                              {item.product.price.toLocaleString()}원
                            </span>
                            <span className="product-price-original">
                              {originalPrice.toLocaleString()}원
                            </span>
                          </div>
                          <div className="seller-info-cart">
                            OPAY 공식인증점 | 스마트스토어
                          </div>
                          <div className="product-option">
                            <span>제품선택 : {item.product.name} / {item.quantity}개</span>
                            <button
                              className="modify-order-btn"
                              onClick={() => navigate(`/products/${item.product.id}`)}
                            >
                              주문수정
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 개별 주문 정보 */}
                      <div className="individual-order">
                        <div className="order-amount">
                          상품금액 {item.product.price.toLocaleString()}원
                        </div>
                        <button
                          className="individual-order-btn"
                          onClick={() => {
                            const singleItem = new Set([item.product.id])
                            setSelectedItems(singleItem)
                            navigate('/order-review')
                          }}
                        >
                          주문하기
                        </button>
                      </div>

                      {/* 배송비 */}
                      <div className="shipping-info">
                        배송비 무료
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 하단 주문 요약 (고정) */}
          <div className="order-summary-sticky">
            <div className="summary-content">
              <div className="summary-row">
                <span>선택상품금액</span>
                <span>{selectedProductAmount.toLocaleString()}원</span>
              </div>
              <div className="summary-row">
                <span>총 배송비</span>
                <span>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</span>
              </div>
              <div className="summary-row discount">
                <span>할인예상금액</span>
                <span className="discount-amount">-{discountAmount.toLocaleString()}원</span>
              </div>
              <div className="summary-row total">
                <span>주문금액</span>
                <span className="total-amount">
                  {(orderAmount + shippingFee).toLocaleString()}원
                </span>
              </div>
              <Button
                fullWidth
                onClick={handleCheckout}
                variant="primary"
                disabled={selectedItems.size === 0}
                className="checkout-btn"
              >
                OPAY 공식인증점 {selectedItems.size}건 주문하기
              </Button>
            </div>
          </div>
        </div>
      )}

      <CartButton />

      {/* 배송지 선택 모달 */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={handleSelectAddress}
        onAddAddress={handleAddAddress}
        onSetDefault={handleSetDefault}
      />

      {/* 로그인 모달 */}
      {/* 로그인 확인 모달 */}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false)
          if (!isLoggedIn) {
            navigate('/')
          }
        }}
      />

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        message="장바구니에서 삭제하겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteSelected}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  )
}

export default CartPage
