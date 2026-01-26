import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '../types'

interface CartState {
  // LocalStorage 기반 임시 장바구니
  localCart: Map<string, number> // productId -> quantity
  isSyncing: boolean
  
  // Actions
  addToCart: (product: Product, quantity: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  getCartItems: () => CartItem[]
  getCartTotal: () => number
  mergeWithServerCart: (serverCart: CartItem[]) => void
  syncToServer: () => Promise<void>
}

const CART_STORAGE_KEY = 'opay_local_cart'

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      localCart: new Map(),
      isSyncing: false,

      addToCart: (product, quantity) => {
        set((state) => {
          const newMap = new Map(state.localCart)
          const current = newMap.get(product.id) || 0
          newMap.set(product.id, current + quantity)
          return { localCart: newMap }
        })
        // Optimistic UI: 즉시 반영
        get().syncToServer().catch(console.error)
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          const newMap = new Map(state.localCart)
          if (quantity <= 0) {
            newMap.delete(productId)
          } else {
            newMap.set(productId, quantity)
          }
          return { localCart: newMap }
        })
        // Optimistic UI: 즉시 반영
        get().syncToServer().catch(console.error)
      },

      removeFromCart: (productId) => {
        set((state) => {
          const newMap = new Map(state.localCart)
          newMap.delete(productId)
          return { localCart: newMap }
        })
        // Optimistic UI: 즉시 반영
        get().syncToServer().catch(console.error)
      },

      clearCart: () => {
        set({ localCart: new Map() })
        get().syncToServer().catch(console.error)
      },

      getCartItems: () => {
        const { localCart } = get()
        // 실제로는 상품 정보를 가져와야 하지만, 여기서는 구조만 제공
        const items: CartItem[] = []
        localCart.forEach((quantity, productId) => {
          // 상품 정보는 별도로 가져와야 함
          items.push({
            product: {
              id: productId,
              name: '',
              description: '',
              price: 0,
              stock: 0,
            },
            quantity,
            addedAt: new Date().toISOString(),
          })
        })
        return items
      },

      getCartTotal: () => {
        const { localCart } = get()
        let total = 0
        localCart.forEach((quantity, productId) => {
          // 실제로는 상품 가격을 가져와야 함
          // 여기서는 구조만 제공
        })
        return total
      },

      mergeWithServerCart: (serverCart) => {
        set((state) => {
          const newMap = new Map(state.localCart)
          // 서버 장바구니와 병합 (서버 우선)
          serverCart.forEach((item) => {
            newMap.set(item.product.id, item.quantity)
          })
          return { localCart: newMap }
        })
      },

      syncToServer: async () => {
        const { localCart } = get()
        // 로그인 상태 확인
        const isLoggedIn = false // 실제로는 인증 상태 확인
        
        if (!isLoggedIn) {
          // 로그인 전: LocalStorage만 사용
          return
        }

        set({ isSyncing: true })
        try {
          // 서버에 장바구니 동기화
          // await syncCartToServer(Array.from(localCart.entries()))
        } catch (error) {
          console.error('장바구니 동기화 실패:', error)
        } finally {
          set({ isSyncing: false })
        }
      },
    }),
    {
      name: CART_STORAGE_KEY,
      // LocalStorage에 Map을 저장하기 위한 커스텀 직렬화
      serialize: (state) => {
        const cartArray = Array.from(state.state.localCart.entries())
        return JSON.stringify({ localCart: cartArray })
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str)
        return {
          localCart: new Map(parsed.localCart || []),
          isSyncing: false,
        }
      },
    }
  )
)
