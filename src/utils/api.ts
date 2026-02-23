import { OrderInfo, PaymentResult, PaymentMethod, CartItem, Product, Review, DeliveryStatus, UserInfo, ShippingAddress, Transaction, WalletInfo } from '../types'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// 세션 만료 시 콜백 (앱에서 설정 가능)
let onSessionExpired: () => void = () => {
  useAuthStore.getState().clearAuth()
  sessionStorage.setItem('showLogoutToast', 'true')
  window.location.href = '/'
}
export const setOnSessionExpired = (fn: () => void): void => {
  onSessionExpired = fn
}

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

// 리프레시 진행 시 동시 요청이 하나의 리프레시만 하도록
let refreshPromise: Promise<AuthResponse | null> | null = null

/**
 * 401/403 시 리프레시 1회 시도 후 재요청, 실패 시 세션 만료 처리 후 throw
 */
async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit & { _retry?: boolean }
): Promise<Response> {
  const { _retry, ...fetchInit } = init ?? {}
  const headers = { ...getAuthHeaders(), ...(fetchInit.headers as Record<string, string>) }
  const res = await fetch(input, { ...fetchInit, headers })
  if (res.status !== 401 && res.status !== 403) return res
  if (_retry) {
    onSessionExpired()
    throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
  }
  try {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const auth = await refreshAccessTokenInternal()
          return auth
        } catch {
          return null
        } finally {
          refreshPromise = null
        }
      })()
    }
    const auth = await refreshPromise
    if (!auth) {
      onSessionExpired()
      throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
    }
    useAuthStore.getState().setAuth(auth)
    return authFetch(input, { ...fetchInit, _retry: true })
  } catch (e) {
    if (e instanceof Error && e.message.includes('세션이 만료')) throw e
    onSessionExpired()
    throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
  }
}

// 리프레시 API (authFetch 사용하지 않음, 쿠키만 사용)
async function refreshAccessTokenInternal(): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) throw new Error('토큰 갱신에 실패했습니다.')
  return response.json()
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

// 현재 사용자 정보 조회
export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await authFetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '사용자 정보 조회에 실패했습니다.' }))
    throw new Error(error.message || '사용자 정보 조회에 실패했습니다.')
  }

  return response.json()
}

// Access Token 갱신 (만료 전 주기 갱신용, 403 시 자동 재시도는 authFetch에서 처리)
export const refreshAccessToken = async (): Promise<AuthResponse> => {
  return refreshAccessTokenInternal()
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
// clearCart: false면 주문 확인 페이지 진입 시 장바구니 유지, 결제 완료 후 별도 비우기
export const createOrder = async (
  items: Array<{ productId: string | number; quantity: number }>,
  options?: { clearCart?: boolean }
): Promise<OrderInfo> => {
  const clearCart = options?.clearCart ?? false
  const bodyItems = items.map((item) => ({
    productId: Number(item.productId),
    quantity: item.quantity,
  }))
  const url = `${API_BASE_URL}/orders?clearCart=${clearCart}`
  const response = await authFetch(url, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ items: bodyItems }),
  })

  if (!response.ok) {
    throw new Error('주문 생성에 실패했습니다.')
  }

  const data = await response.json()
  // 백엔드 응답(id, items: { productName, price })를 OrderInfo 형태로 정규화
  return {
    orderId: String(data.id ?? data.orderId),
    totalAmount: data.totalAmount ?? 0,
    paymentMethod: 'CARD' as PaymentMethod,
    createdAt: data.createdAt ?? new Date().toISOString(),
    items: (data.items ?? []).map((item: { productId?: number; productName?: string; product?: { name?: string; imageUrl?: string; price?: number }; productImageUrl?: string; quantity: number; price?: number }) => ({
      product: {
        id: String(item.productId ?? ''),
        name: item.productName ?? item.product?.name ?? '',
        price: Number(item.price ?? item.product?.price ?? 0),
        description: '',
        stock: 0,
        imageUrl: item.productImageUrl ?? item.product?.imageUrl ?? '',
      },
      quantity: item.quantity,
    })),
  }
}

// PaymentId 발급 요청 (백엔드: orderId, amount, method, idempotencyKey)
export const requestPaymentId = async (
  orderId: string,
  amount: number,
  paymentMethod: PaymentMethod,
  idempotencyKey: string
): Promise<{ paymentId: string }> => {
  const response = await authFetch(`${API_BASE_URL}/payments/request`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      orderId: Number(orderId),
      amount: Number(amount),
      method: paymentMethod,
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
  const response = await authFetch(`${API_BASE_URL}/payments/approve`, {
    method: 'POST',
    credentials: 'include',
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
  const response = await authFetch(`${API_BASE_URL}/payments/${paymentId}/status`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('결제 상태 조회에 실패했습니다.')
  }

  return response.json()
}

// 주문 내역 조회
export const getOrderHistory = async (orderId: string): Promise<OrderInfo & { paymentResult: PaymentResult }> => {
  const response = await authFetch(`${API_BASE_URL}/orders/${orderId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('주문 내역 조회에 실패했습니다.')
  }

  return response.json()
}

// 장바구니 관련 API
// 백엔드 응답 타입
export interface CartResponse {
  id: number
  userId: number
  productId: number
  productName: string
  productImageUrl?: string
  productPrice: number
  stock: number
  quantity: number
  totalPrice: number
  addedAt: string
}

export interface CartListResponse {
  items: CartResponse[]
  totalItems: number
  totalAmount: number
}

// 장바구니에 상품 추가
export const addToCart = async (productId: string, quantity: number = 1): Promise<CartResponse> => {
  const url = `${API_BASE_URL}/carts`
  const requestBody = {
    productId: Number(productId),
    quantity,
  }
  try {
    const response = await authFetch(url, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(requestBody),
    })

    console.log('장바구니 추가 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '장바구니 추가에 실패했습니다.' }))
      console.error('장바구니 추가 실패:', response.status, errorData)
      throw new Error(errorData.message || `장바구니 추가에 실패했습니다. (${response.status})`)
    }

    const result = await response.json()
    console.log('장바구니 추가 성공:', result)
    return result
  } catch (error) {
    console.error('장바구니 추가 예외:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('장바구니 추가 중 오류가 발생했습니다.')
  }
}

// 장바구니 목록 조회
export const getCartItems = async (): Promise<CartListResponse> => {
  const url = `${API_BASE_URL}/carts`
  try {
    const response = await authFetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    console.log('장바구니 조회 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '장바구니 조회에 실패했습니다.' }))
      console.error('장바구니 조회 실패:', response.status, error)
      throw new Error(error.message || `장바구니 조회에 실패했습니다. (${response.status})`)
    }

    const result = await response.json()
    console.log('장바구니 조회 성공:', result)
    return result
  } catch (error) {
    console.error('장바구니 조회 예외:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('장바구니 조회 중 오류가 발생했습니다.')
  }
}

// 장바구니 수량 수정
export const updateCartQuantity = async (cartId: number, quantity: number): Promise<CartResponse> => {
  const response = await authFetch(`${API_BASE_URL}/carts/${cartId}/quantity?quantity=${quantity}`, {
    method: 'PATCH',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '장바구니 수량 수정에 실패했습니다.' }))
    throw new Error(error.message || '장바구니 수량 수정에 실패했습니다.')
  }

  return response.json()
}

// 장바구니 항목 삭제
export const removeFromCart = async (cartId: number): Promise<void> => {
  const response = await authFetch(`${API_BASE_URL}/carts/${cartId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '장바구니 삭제에 실패했습니다.' }))
    throw new Error(error.message || '장바구니 삭제에 실패했습니다.')
  }
}

// 장바구니 전체 비우기
export const clearCart = async (): Promise<void> => {
  const response = await authFetch(`${API_BASE_URL}/carts`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '장바구니 비우기에 실패했습니다.' }))
    throw new Error(error.message || '장바구니 비우기에 실패했습니다.')
  }
}

// 장바구니 항목 개수 조회
export const getCartItemCount = async (): Promise<number> => {
  const response = await authFetch(`${API_BASE_URL}/carts/count`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    // 에러가 발생해도 0을 반환 (로그인하지 않은 경우 등)
    return 0
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
  try {
    // 장바구니 목록을 가져와서 검증
    const cartList = await getCartItems()
    
    // CartResponse를 CartItem으로 변환
    const items: CartItem[] = cartList.items.map((item) => {
      const cartItem: CartItem = {
        product: {
          id: String(item.productId),
          name: item.productName,
          description: '',
          price: item.productPrice,
          stock: item.stock,
          imageUrl: item.productImageUrl,
        },
        quantity: item.quantity,
        addedAt: item.addedAt,
      }
      if (item.id) {
        Object.assign(cartItem, { cartId: item.id })
      }
      return cartItem
    })

    const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const outOfStockItems: string[] = []
    const priceChangedItems: string[] = []

    // 재고 확인
    items.forEach((item) => {
      if (item.product.stock < item.quantity) {
        outOfStockItems.push(item.product.id)
      }
    })

    return {
      isValid: outOfStockItems.length === 0 && priceChangedItems.length === 0,
      items,
      totalAmount,
      outOfStockItems: outOfStockItems.length > 0 ? outOfStockItems : undefined,
      priceChangedItems: priceChangedItems.length > 0 ? priceChangedItems : undefined,
    }
  } catch (error) {
    console.error('장바구니 검증 실패:', error)
    throw new Error('장바구니 검증에 실패했습니다.')
  }
}

// 기존 API (하위 호환성을 위해 유지)
export const getCart = async (): Promise<CartItem[]> => {
  try {
    const cartListResponse = await getCartItems()
    // CartListResponse를 CartItem[]로 변환
    return cartListResponse.items.map((item) => ({
      product: {
        id: String(item.productId),
        name: item.productName,
        description: '',
        price: item.productPrice,
        stock: item.stock,
        imageUrl: item.productImageUrl,
      },
      quantity: item.quantity,
      addedAt: item.addedAt,
    }))
  } catch (error) {
    throw new Error('장바구니 조회에 실패했습니다.')
  }
}

export const syncCartToServer = async (items: Array<{ productId: string; quantity: number }>): Promise<CartItem[]> => {
  // 각 아이템을 서버에 추가/업데이트
  const promises = items.map((item) => addToCart(item.productId, item.quantity))
  await Promise.all(promises)
  return getCart()
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

// 리뷰 응답 정규화 (id, productId, userId를 string으로)
const normalizeReview = (r: { id?: number; productId?: number; userId?: number; [key: string]: unknown }): Review => ({
  ...r,
  id: String(r.id ?? ''),
  productId: String(r.productId ?? ''),
  userId: String(r.userId ?? ''),
  createdAt: (r.createdAt as string) ?? new Date().toISOString(),
} as Review)

// 리뷰 관련 API
export const getProductReviews = async (
  productId: string,
  page: number = 0,
  size: number = 10
): Promise<{ reviews: Review[]; hasMore: boolean }> => {
  const response = await fetch(
    `${API_BASE_URL}/reviews/product/${productId}?page=${page}&size=${size}`
  )

  if (!response.ok) {
    throw new Error('리뷰 조회에 실패했습니다.')
  }

  const data = await response.json()
  return {
    reviews: (data.reviews ?? []).map(normalizeReview),
    hasMore: data.hasNext ?? false,
  }
}

/** 리뷰 단건 조회 */
export const getReview = async (reviewId: string): Promise<Review> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    credentials: 'include',
  })
  if (!response.ok) throw new Error('리뷰를 불러오지 못했습니다.')
  const data = await response.json()
  return normalizeReview(data)
}

/** 내가 쓴 리뷰 목록 (페이지네이션) */
export const getMyReviews = async (
  userId: string,
  page: number = 0,
  size: number = 10
): Promise<{ reviews: Review[]; totalPages: number; hasNext: boolean }> => {
  const response = await authFetch(
    `${API_BASE_URL}/reviews/user/${userId}?page=${page}&size=${size}`,
    { credentials: 'include' }
  )

  if (!response.ok) {
    throw new Error('내 리뷰 목록을 불러오지 못했습니다.')
  }

  const data = await response.json()
  return {
    reviews: (data.reviews ?? []).map(normalizeReview),
    totalPages: data.totalPages ?? 0,
    hasNext: data.hasNext ?? false,
  }
}

export const createReview = async (
  productId: string,
  reviewData: { rating: number; content: string }
): Promise<Review> => {
  const response = await authFetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      productId: Number(productId),
      rating: reviewData.rating,
      content: reviewData.content || '',
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || '리뷰 작성에 실패했습니다.')
  }

  const data = await response.json()
  return normalizeReview(data)
}

export const updateReview = async (
  reviewId: string,
  productId: string,
  reviewData: { rating: number; content: string }
): Promise<Review> => {
  const response = await authFetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify({
      productId: Number(productId),
      rating: reviewData.rating,
      content: reviewData.content || '',
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || '리뷰 수정에 실패했습니다.')
  }

  const data = await response.json()
  return normalizeReview(data)
}

export const deleteReview = async (reviewId: string): Promise<void> => {
  const response = await authFetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('리뷰 삭제에 실패했습니다.')
  }
}

// 상품 관련 API
export interface ProductListParams {
  keyword?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'created' | 'price' | 'name' | 'rating' | 'reviews'
  sortDirection?: 'asc' | 'desc'
  page?: number
  size?: number
}

export interface ProductListResponse {
  products: Product[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}

// 상품 목록 조회
export const getProducts = async (params: ProductListParams = {}): Promise<ProductListResponse> => {
  const queryParams = new URLSearchParams()
  
  if (params.keyword) queryParams.append('keyword', params.keyword)
  if (params.category) queryParams.append('category', params.category)
  if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString())
  if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString())
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)
  queryParams.append('page', (params.page || 0).toString())
  queryParams.append('size', (params.size || 20).toString())

  const response = await fetch(`${API_BASE_URL}/products?${queryParams.toString()}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('상품 목록 조회에 실패했습니다.')
  }

  const data = await response.json()
  // 백엔드의 id를 string으로 변환
  return {
    ...data,
    products: data.products.map((p: any) => ({
      ...p,
      id: String(p.id),
    })),
  }
}

// 상품 상세 조회 (리뷰 수·별점 API 연동, 없으면 0 기본값)
export const getProduct = async (id: string): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('상품 조회에 실패했습니다.')
  }

  const data = await response.json()
  const averageRating = data.averageRating != null ? Number(data.averageRating) : 0
  const reviewCount = data.reviewCount != null ? Number(data.reviewCount) : 0
  return {
    ...data,
    id: String(data.id),
    averageRating,
    reviewCount,
  }
}

// 카테고리 목록 조회
export const getCategories = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/products/categories`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('카테고리 목록 조회에 실패했습니다.')
  }

  return response.json()
}

// 구매 내역 관련 API (page: 1-based, 백엔드는 0-based page + size 사용)
export const getOrderList = async (page: number = 1, limit: number = 10): Promise<{
  orders: OrderInfo[]
  hasMore?: boolean
  hasNext?: boolean
  totalPages?: number
  totalElements?: number
}> => {
  const response = await authFetch(
    `${API_BASE_URL}/orders?page=${page - 1}&size=${limit}`,
    {
      credentials: 'include',
    }
  )

  if (!response.ok) {
    throw new Error('주문 목록 조회에 실패했습니다.')
  }

  const data = await response.json()
  const rawOrders = data.orders ?? []
  const orders = rawOrders.map((o: { id?: number; orderId?: string; [key: string]: unknown }) => ({
    ...o,
    orderId: o.orderId ?? String(o.id ?? ''),
  }))
  return {
    orders,
    hasMore: data.hasMore ?? data.hasNext ?? false,
    hasNext: data.hasNext,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
  }
}

// 전체 주문 개수 조회
export const getTotalOrderCount = async (): Promise<number> => {
  const response = await authFetch(`${API_BASE_URL}/orders/count`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '전체 주문 개수 조회에 실패했습니다.' }))
    throw new Error(error.message || '전체 주문 개수 조회에 실패했습니다.')
  }

  return response.json()
}

// 이달의 주문 개수 조회
export const getMonthlyOrderCount = async (): Promise<number> => {
  const response = await authFetch(`${API_BASE_URL}/orders/count/monthly`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '이달의 주문 개수 조회에 실패했습니다.' }))
    throw new Error(error.message || '이달의 주문 개수 조회에 실패했습니다.')
  }

  return response.json()
}

export const getOrderDetail = async (orderId: string): Promise<OrderInfo & {
  paymentResult: PaymentResult
  deliveryTimeline: Array<{ status: DeliveryStatus; message: string; timestamp: string }>
}> => {
  const response = await authFetch(`${API_BASE_URL}/orders/${orderId}`, {
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
  const response = await authFetch(`${API_BASE_URL}/payments/pg/${pgProvider}`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ paymentId }),
  })

  if (!response.ok) {
    throw new Error('PG 결제 요청에 실패했습니다.')
  }

  return response.json()
}

// 배송지 관련 API
export const getShippingAddresses = async (): Promise<ShippingAddress[]> => {
  const response = await authFetch(`${API_BASE_URL}/shipping-addresses`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '배송지 조회에 실패했습니다.' }))
    throw new Error(error.message || '배송지 조회에 실패했습니다.')
  }

  const addresses = await response.json()
  return addresses.map((addr: any) => ({
    id: String(addr.id),
    name: addr.name || null,
    recipient: addr.recipient,
    phone: addr.phone,
    address: addr.address,
    detailAddress: addr.detailAddress || null,
    postalCode: addr.postalCode || null,
    isDefault: addr.isDefault || false,
    createdAt: addr.createdAt || new Date().toISOString(),
  }))
}

export const getDefaultShippingAddress = async (): Promise<ShippingAddress | null> => {
  const response = await authFetch(`${API_BASE_URL}/shipping-addresses/default`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    const error = await response.json().catch(() => ({ message: '기본 배송지 조회에 실패했습니다.' }))
    throw new Error(error.message || '기본 배송지 조회에 실패했습니다.')
  }

  const addr = await response.json()
  return {
    id: String(addr.id),
    name: addr.name || null,
    recipient: addr.recipient,
    phone: addr.phone,
    address: addr.address,
    detailAddress: addr.detailAddress || null,
    postalCode: addr.postalCode || null,
    isDefault: addr.isDefault || false,
    createdAt: addr.createdAt || new Date().toISOString(),
  }
}

// 배송지 추가
export const addShippingAddress = async (request: {
  name?: string | null
  recipient: string
  phone: string
  address: string
  detailAddress?: string | null
  postalCode?: string | null
  isDefault?: boolean
}): Promise<ShippingAddress> => {
  const response = await authFetch(`${API_BASE_URL}/shipping-addresses`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '배송지 추가에 실패했습니다.' }))
    throw new Error(error.message || '배송지 추가에 실패했습니다.')
  }

  const addr = await response.json()
  return {
    id: String(addr.id),
    name: addr.name || null,
    recipient: addr.recipient,
    phone: addr.phone,
    address: addr.address,
    detailAddress: addr.detailAddress || null,
    postalCode: addr.postalCode || null,
    isDefault: addr.isDefault || false,
    createdAt: addr.createdAt || new Date().toISOString(),
  }
}

// 배송지 수정
export const updateShippingAddress = async (
  id: string,
  request: {
    name?: string | null
    recipient: string
    phone: string
    address: string
    detailAddress?: string | null
    postalCode?: string | null
    isDefault?: boolean
  }
): Promise<ShippingAddress> => {
  const response = await authFetch(`${API_BASE_URL}/shipping-addresses/${id}`, {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '배송지 수정에 실패했습니다.' }))
    throw new Error(error.message || '배송지 수정에 실패했습니다.')
  }

  const addr = await response.json()
  return {
    id: String(addr.id),
    name: addr.name || null,
    recipient: addr.recipient,
    phone: addr.phone,
    address: addr.address,
    detailAddress: addr.detailAddress || null,
    postalCode: addr.postalCode || null,
    isDefault: addr.isDefault || false,
    createdAt: addr.createdAt || new Date().toISOString(),
  }
}

// 배송지 삭제
export const deleteShippingAddress = async (id: string): Promise<void> => {
  const response = await authFetch(`${API_BASE_URL}/shipping-addresses/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '배송지 삭제에 실패했습니다.' }))
    throw new Error(error.message || '배송지 삭제에 실패했습니다.')
  }
}

// 기본 배송지 설정
export const setDefaultShippingAddress = async (id: string): Promise<ShippingAddress> => {
  const response = await authFetch(`${API_BASE_URL}/shipping-addresses/${id}/default`, {
    method: 'PATCH',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '기본 배송지 설정에 실패했습니다.' }))
    throw new Error(error.message || '기본 배송지 설정에 실패했습니다.')
  }

  const addr = await response.json()
  return {
    id: String(addr.id),
    name: addr.name || null,
    recipient: addr.recipient,
    phone: addr.phone,
    address: addr.address,
    detailAddress: addr.detailAddress || null,
    postalCode: addr.postalCode || null,
    isDefault: addr.isDefault || false,
    createdAt: addr.createdAt || new Date().toISOString(),
  }
}

// 지갑 관련 API
export const getWalletBalance = async (): Promise<number> => {
  const response = await authFetch(`${API_BASE_URL}/wallets/balance`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '지갑 잔액 조회에 실패했습니다.' }))
    throw new Error(error.message || '지갑 잔액 조회에 실패했습니다.')
  }

  return response.json()
}

export const getWallet = async (): Promise<WalletInfo> => {
  const response = await authFetch(`${API_BASE_URL}/wallets`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '지갑 조회에 실패했습니다.' }))
    throw new Error(error.message || '지갑 조회에 실패했습니다.')
  }

  const wallet = await response.json()
  return {
    ...wallet,
    id: wallet.id,
    userId: wallet.userId,
    balance: wallet.balance,
  }
}

export const chargeWallet = async (amount: number): Promise<WalletInfo> => {
  const response = await authFetch(`${API_BASE_URL}/wallets/charge`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '머니 충전에 실패했습니다.' }))
    throw new Error(error.message || '머니 충전에 실패했습니다.')
  }

  const wallet = await response.json()
  return {
    ...wallet,
    id: wallet.id,
    userId: wallet.userId,
    balance: wallet.balance,
  }
}

// 거래 내역 관련 API
export const getTransactions = async (page: number = 0, size: number = 20): Promise<{
  content: Transaction[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}> => {
  const response = await authFetch(`${API_BASE_URL}/transactions?page=${page}&size=${size}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '거래 내역 조회에 실패했습니다.' }))
    throw new Error(error.message || '거래 내역 조회에 실패했습니다.')
  }

  const data = await response.json()
  return {
    content: (data.content || []).map((t: any) => ({
      transactionId: t.transactionId,
      userId: t.userId,
      walletId: t.walletId,
      orderId: t.orderId,
      paymentId: t.paymentId,
      type: t.type === 'PAY' ? 'PAYMENT' : t.type === 'EARN' ? 'POINT_EARNED' : t.type === 'REFUND' ? 'REFUND' : 'CHARGE',
      amount: t.amount,
      status: t.status === 'SUCCESS' ? 'COMPLETED' : t.status === 'FAIL' ? 'FAILED' : 'PENDING',
      idempotencyKey: t.idempotencyKey,
      createdAt: t.createdAt,
    })),
    totalElements: data.totalElements || 0,
    totalPages: data.totalPages || 0,
    currentPage: data.number || page,
    pageSize: data.size || size,
    hasNext: !data.last || false,
    hasPrevious: !data.first || false,
  }
}
