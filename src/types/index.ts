// 상품 관련
export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  stock: number
  category?: string
  averageRating?: number
  reviewCount?: number
}

// 장바구니 관련
export interface CartItem {
  product: Product
  quantity: number
  addedAt: string
}

export interface Cart {
  items: CartItem[]
  totalAmount: number
  lastSyncedAt?: string
}

// 주문 관련
export interface OrderItem {
  product: Product
  quantity: number
}

export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT' | 'TOSS' | 'KAKAO' | 'NAVER'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAIL' | 'UNKNOWN'

export type DeliveryStatus = 'PREPARING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'

export interface DeliveryTimeline {
  status: DeliveryStatus
  message: string
  timestamp: string
}

export interface OrderInfo {
  orderId: string
  items: OrderItem[]
  totalAmount: number
  paymentMethod: PaymentMethod
  paymentId?: string
  idempotencyKey?: string
  deliveryStatus?: DeliveryStatus
  deliveryTimeline?: DeliveryTimeline[]
  shippingAddress?: string
  createdAt: string
}

export interface PaymentResult {
  paymentId: string
  status: PaymentStatus
  amount: number
  paymentMethod: PaymentMethod
  paymentNo?: string
  approvedAt?: string
  failReason?: string
  canRetry?: boolean
}

// 리뷰 관련
export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  content: string
  images?: string[]
  createdAt: string
  updatedAt?: string
  isMine?: boolean
}

export interface ReviewFormData {
  rating: number
  content: string
  images: File[]
}

// 최근 본 상품
export interface RecentProduct {
  productId: string
  viewedAt: string
}

// 사용자 관련
export interface User {
  id: string
  email: string
  name: string
  isLoggedIn: boolean
}

// 배송지 관련
export interface ShippingAddress {
  id: string
  name?: string | null
  recipient: string
  phone: string
  address: string
  detailAddress?: string | null
  postalCode?: string | null
  isDefault: boolean
  createdAt: string
}

export interface ShippingAddressRequest {
  name?: string | null
  recipient: string
  phone: string
  address: string
  detailAddress?: string | null
  postalCode?: string | null
  isDefault?: boolean
}

// 사용자 정보 관련
export interface UserInfo {
  id: number
  email: string
  name: string
  point: number
  money: number
}

// 거래 내역 관련
export interface Transaction {
  transactionId: number
  userId: number
  walletId?: number
  orderId?: number
  paymentId?: number
  type: 'CHARGE' | 'PAYMENT' | 'REFUND' | 'POINT_EARNED' | 'POINT_USED'
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  idempotencyKey?: string
  createdAt: string
}

// 지갑 관련
export interface WalletInfo {
  id: number
  userId: number
  balance: number
}
