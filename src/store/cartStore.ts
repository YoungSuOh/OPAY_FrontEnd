import { create } from 'zustand'
import { CartItem, Product } from '../types'
import { 
  addToCart as apiAddToCart, 
  getCartItems as apiGetCartItems, 
  updateCartQuantity, 
  removeFromCart as apiRemoveFromCart, 
  clearCart as apiClearCart,
  getCartItemCount,
  CartResponse,
  CartListResponse
} from '../utils/api'
import { useAuthStore } from './authStore'

interface CartState {
  serverCartItems: CartItem[]
  cartItemCount: number
  isLoading: boolean
  isSyncing: boolean
  
  addToCart: (product: Product, quantity: number) => Promise<void>
  updateQuantity: (cartId: number, productId: string, quantity: number) => Promise<void>
  removeFromCart: (cartId: number) => Promise<void>
  removeFromCartByProductId: (productId: string) => void
  clearCart: () => Promise<void>
  loadCartItems: () => Promise<void>
  loadCartItemCount: () => Promise<void>
  getCartItems: () => CartItem[]
  getCartTotal: () => number
}

const convertCartResponseToCartItem = (response: CartResponse): CartItem => {
  const item: CartItem = {
    product: {
      id: String(response.productId),
      name: response.productName,
      description: '',
      price: response.productPrice,
      stock: response.stock,
      imageUrl: response.productImageUrl,
    },
    quantity: response.quantity,
    addedAt: response.addedAt,
  }
  if (response.id) {
    Object.assign(item, { cartId: response.id })
  }
  return item
}

export const useCartStore = create<CartState>()(
  (set, get) => ({
    serverCartItems: [],
    cartItemCount: 0,
    isLoading: false,
    isSyncing: false,

    addToCart: async (product, quantity) => {
      const { isLoggedIn } = useAuthStore.getState()
      
      if (!isLoggedIn) {
        throw new Error('로그인이 필요한 서비스입니다. 로그인 후 이용해주세요.')
      }

      set({ isSyncing: true })
      try {
        console.log('장바구니에 상품 추가 시작:', { productId: product.id, quantity })
        const result = await apiAddToCart(product.id, quantity)
        console.log('장바구니 추가 완료, 목록 다시 로드:', result)
        await get().loadCartItems()
        await get().loadCartItemCount()
      } catch (error) {
        console.error('장바구니 추가 실패:', error)
        throw error
      } finally {
        set({ isSyncing: false })
      }
    },

    updateQuantity: async (cartId, _productId, quantity) => {
      const { isLoggedIn } = useAuthStore.getState()
      
      if (!isLoggedIn) {
        throw new Error('로그인이 필요한 서비스입니다.')
      }

      set({ isSyncing: true })
      try {
        await updateCartQuantity(cartId, quantity)
        await get().loadCartItems()
        await get().loadCartItemCount()
      } catch (error) {
        console.error('장바구니 수량 수정 실패:', error)
        throw error
      } finally {
        set({ isSyncing: false })
      }
    },

    removeFromCart: async (cartId: number) => {
      const { isLoggedIn } = useAuthStore.getState()
      
      if (!isLoggedIn || cartId === 0) {
        return
      }

      set({ isSyncing: true })
      try {
        await apiRemoveFromCart(cartId)
        await get().loadCartItems()
        await get().loadCartItemCount()
      } catch (error) {
        console.error('장바구니 삭제 실패:', error)
        throw error
      } finally {
        set({ isSyncing: false })
      }
    },

    removeFromCartByProductId: (_productId: string) => {
      const { isLoggedIn } = useAuthStore.getState()
      if (!isLoggedIn) {
        throw new Error('로그인이 필요한 서비스입니다.')
      }
    },

    clearCart: async () => {
      const { isLoggedIn } = useAuthStore.getState()
      
      if (!isLoggedIn) {
        throw new Error('로그인이 필요한 서비스입니다.')
      }

      set({ isSyncing: true })
      try {
        await apiClearCart()
        set({ serverCartItems: [], cartItemCount: 0 })
      } catch (error) {
        console.error('장바구니 비우기 실패:', error)
        throw error
      } finally {
        set({ isSyncing: false })
      }
    },

    loadCartItems: async () => {
      const { isLoggedIn } = useAuthStore.getState()
      
      if (!isLoggedIn) {
        return
      }

      set({ isLoading: true })
      try {
        const response: CartListResponse = await apiGetCartItems()
        const cartItems = response.items.map(convertCartResponseToCartItem)
        set({ serverCartItems: cartItems })
      } catch (error) {
        console.error('장바구니 로드 실패:', error)
        set({ serverCartItems: [] })
      } finally {
        set({ isLoading: false })
      }
    },

    loadCartItemCount: async () => {
      const { isLoggedIn } = useAuthStore.getState()
      
      if (!isLoggedIn) {
        set({ cartItemCount: 0 })
        return
      }

      try {
        const count = await getCartItemCount()
        set({ cartItemCount: count })
      } catch (error) {
        console.error('장바구니 개수 로드 실패:', error)
        set({ cartItemCount: 0 })
      }
    },

    getCartItems: () => {
      const { isLoggedIn } = useAuthStore.getState()
      const { serverCartItems } = get()
      
      if (!isLoggedIn) {
        return []
      }
      
      return serverCartItems
    },

    getCartTotal: () => {
      const items = get().getCartItems()
      return items.reduce((total, item) => {
        return total + (item.product.price * item.quantity)
      }, 0)
    },
  })
)
