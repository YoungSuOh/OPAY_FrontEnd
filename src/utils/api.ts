import { OrderInfo, PaymentResult, PaymentMethod, CartItem, Product, Review, ReviewFormData, DeliveryStatus } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Access Token을 가져오는 헬퍼 함수
const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken')
}

// API 요청 헤더 생성
const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// 인증 관련 API
export interface SignupRequest {
  email: string
  password: string
  name: string
  phone?: string
  shippingRecipient?: string
  shippingPhone?: string
  shippingAddress?: string
  shippingDetailAddress?: string
  shippingPostalCode?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  userId: number
  email: string
  name: string
  accessToken: string
}

// 회원가입
export const signup = async (request: SignupRequest): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 쿠키 포함
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '회원가입에 실패했습니다.' }))
    throw new Error(error.message || '회원가입에 실패했습니다.')
  }

  return response.json()
}

// 로그인
export const login = async (request: LoginRequest): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 쿠키 포함
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '로그인에 실패했습니다.' }))
    throw new Error(error.message || '로그인에 실패했습니다.')
  }

  return response.json()
}

// 로그아웃
export const logout = async (): Promise<void> => {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include', // 쿠키 포함
  })
  
  localStorage.removeItem('accessToken')
}

// Access Token 갱신
export const refreshAccessToken = async (): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // 쿠키 포함
  })

  if (!response.ok) {
    throw new Error('토큰 갱신에 실패했습니다.')
  }

  return response.json()
}

// 이메일 중복확인
export const checkEmailAvailability = async (email: string): Promise<{ available: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || '이메일 중복확인에 실패했습니다.')
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('이메일 중복확인에 실패했습니다.')
  }
}

// Idempotency Key 생성
export const generateIdempotencyKey = (): string => {
  return `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 주문 정보 생성 및 서버 검증
export const createOrder = async (items: Array<{ productId: string; quantity: number }>): Promise<OrderInfo> => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ items }),
  })

  if (!response.ok) {
    throw new Error('주문 생성에 실패했습니다.')
  }

  return response.json()
}

// PaymentId 발급 요청
export const requestPaymentId = async (
  orderId: string,
  paymentMethod: PaymentMethod,
  idempotencyKey: string
): Promise<{ paymentId: string }> => {
  const response = await fetch(`${API_BASE_URL}/payments/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId,
      paymentMethod,
      idempotencyKey,
    }),
  })

  if (!response.ok) {
    throw new Error('결제 ID 발급에 실패했습니다.')
  }

  return response.json()
}

// 결제 승인 API 호출
export const approvePayment = async (
  paymentId: string,
  idempotencyKey: string
): Promise<PaymentResult> => {
  const response = await fetch(`${API_BASE_URL}/payments/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentId,
      idempotencyKey,
    }),
  })

  if (!response.ok) {
    throw new Error('결제 승인 요청에 실패했습니다.')
  }

  return response.json()
}

// 결제 상태 조회
export const checkPaymentStatus = async (paymentId: string): Promise<PaymentResult> => {
  const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/status`)

  if (!response.ok) {
    throw new Error('결제 상태 조회에 실패했습니다.')
  }

  return response.json()
}

// 주문 내역 조회
export const getOrderHistory = async (orderId: string): Promise<OrderInfo & { paymentResult: PaymentResult }> => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`)

  if (!response.ok) {
    throw new Error('주문 내역 조회에 실패했습니다.')
  }

  return response.json()
}

// 장바구니 관련 API
export const getCart = async (): Promise<CartItem[]> => {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('장바구니 조회에 실패했습니다.')
  }

  return response.json()
}

export const syncCartToServer = async (items: Array<{ productId: string; quantity: number }>): Promise<CartItem[]> => {
  const response = await fetch(`${API_BASE_URL}/cart/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ items }),
  })

  if (!response.ok) {
    throw new Error('장바구니 동기화에 실패했습니다.')
  }

  return response.json()
}

// 결제 페이지 진입 시 재고 및 가격 재확인
export const validateCartBeforeCheckout = async (): Promise<{
  isValid: boolean
  items: CartItem[]
  totalAmount: number
  outOfStockItems?: string[]
  priceChangedItems?: string[]
}> => {
  const response = await fetch(`${API_BASE_URL}/cart/validate`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('장바구니 검증에 실패했습니다.')
  }

  return response.json()
}

// 최근 본 상품 관련 API
export const getRecentProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/recent-products`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('최근 본 상품 조회에 실패했습니다.')
  }

  return response.json()
}

export const syncRecentProductsToServer = async (productIds: string[]): Promise<void> => {
  await fetch(`${API_BASE_URL}/recent-products/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ productIds }),
  })
}

// 리뷰 관련 API
export const getProductReviews = async (
  productId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: Review[]; hasMore: boolean }> => {
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/reviews?page=${page}&limit=${limit}`
  )

  if (!response.ok) {
    throw new Error('리뷰 조회에 실패했습니다.')
  }

  return response.json()
}

export const createReview = async (
  productId: string,
  reviewData: ReviewFormData
): Promise<Review> => {
  const formData = new FormData()
  formData.append('rating', reviewData.rating.toString())
  formData.append('content', reviewData.content)
  reviewData.images.forEach((image) => {
    formData.append('images', image)
  })

  const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('리뷰 작성에 실패했습니다.')
  }

  return response.json()
}

export const updateReview = async (
  reviewId: string,
  reviewData: ReviewFormData
): Promise<Review> => {
  const formData = new FormData()
  formData.append('rating', reviewData.rating.toString())
  formData.append('content', reviewData.content)
  reviewData.images.forEach((image) => {
    formData.append('images', image)
  })

  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('리뷰 수정에 실패했습니다.')
  }

  return response.json()
}

export const deleteReview = async (reviewId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('리뷰 삭제에 실패했습니다.')
  }
}

// 구매 내역 관련 API
export const getOrderList = async (page: number = 1, limit: number = 10): Promise<{
  orders: OrderInfo[]
  hasMore: boolean
}> => {
  const response = await fetch(
    `${API_BASE_URL}/orders?page=${page}&limit=${limit}`,
    {
      credentials: 'include',
    }
  )

  if (!response.ok) {
    throw new Error('주문 목록 조회에 실패했습니다.')
  }

  return response.json()
}

export const getOrderDetail = async (orderId: string): Promise<OrderInfo & {
  paymentResult: PaymentResult
  deliveryTimeline: Array<{ status: DeliveryStatus; message: string; timestamp: string }>
}> => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('주문 상세 조회에 실패했습니다.')
  }

  return response.json()
}

// PG 연동 관련 (토스, 카카오, 네이버페이)
export const requestPGPayment = async (
  paymentId: string,
  pgProvider: 'TOSS' | 'KAKAO' | 'NAVER'
): Promise<{ redirectUrl: string }> => {
  const response = await fetch(`${API_BASE_URL}/payments/pg/${pgProvider}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ paymentId }),
  })

  if (!response.ok) {
    throw new Error('PG 결제 요청에 실패했습니다.')
  }

  return response.json()
}
