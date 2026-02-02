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
  const headers = getAuthHeaders()
  
  console.log('장바구니 추가 요청:', {
    url,
    method: 'POST',
    headers,
    body: requestBody,
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
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
  const headers = getAuthHeaders()
  
  console.log('장바구니 조회 요청:', {
    url,
    method: 'GET',
    headers,
  })

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
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
  const response = await fetch(`${API_BASE_URL}/carts/${cartId}/quantity?quantity=${quantity}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
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
  const response = await fetch(`${API_BASE_URL}/carts/${cartId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '장바구니 삭제에 실패했습니다.' }))
    throw new Error(error.message || '장바구니 삭제에 실패했습니다.')
  }
}

// 장바구니 전체 비우기
export const clearCart = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/carts`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '장바구니 비우기에 실패했습니다.' }))
    throw new Error(error.message || '장바구니 비우기에 실패했습니다.')
  }
}

// 장바구니 항목 개수 조회
export const getCartItemCount = async (): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/carts/count`, {
    method: 'GET',
    headers: getAuthHeaders(),
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
  // 백엔드 응답 형식에 맞게 변환
  return {
    reviews: data.reviews?.map((r: any) => ({
      ...r,
      id: String(r.id),
      productId: String(r.productId),
      userId: String(r.userId),
    })) || [],
    hasMore: data.hasNext || false,
  }
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

// 상품 상세 조회
export const getProduct = async (id: string): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('상품 조회에 실패했습니다.')
  }

  const data = await response.json()
  // 백엔드의 id를 string으로 변환
  return {
    ...data,
    id: String(data.id),
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
