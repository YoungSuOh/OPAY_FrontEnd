import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RecentProduct, Product } from '../types'

interface RecentProductsState {
  recentProducts: RecentProduct[]
  maxCount: number
  
  // Actions
  addRecentProduct: (productId: string) => void
  getRecentProducts: () => Promise<Product[]>
  clearRecentProducts: () => void
  syncToServer: () => Promise<void>
}

const RECENT_PRODUCTS_STORAGE_KEY = 'opay_recent_products'
const MAX_RECENT_PRODUCTS = 20

export const useRecentProductsStore = create<RecentProductsState>()(
  persist(
    (set, get) => ({
      recentProducts: [],
      maxCount: MAX_RECENT_PRODUCTS,

      addRecentProduct: (productId) => {
        set((state) => {
          // 중복 제거 (최신순 유지)
          const filtered = state.recentProducts.filter(
            (p) => p.productId !== productId
          )
          const updated = [
            { productId, viewedAt: new Date().toISOString() },
            ...filtered,
          ].slice(0, state.maxCount)
          
          return { recentProducts: updated }
        })
        
        // 서버 동기화 (로그인 시)
        get().syncToServer().catch(console.error)
      },

      getRecentProducts: async () => {
        const { recentProducts } = get()
        // 실제로는 서버에서 상품 정보를 가져와야 함
        // 여기서는 구조만 제공
        return []
      },

      clearRecentProducts: () => {
        set({ recentProducts: [] })
        get().syncToServer().catch(console.error)
      },

      syncToServer: async () => {
        const { recentProducts } = get()
        const isLoggedIn = false // 실제로는 인증 상태 확인
        
        if (!isLoggedIn) {
          // 로그인 전: 브라우저 저장만 사용
          return
        }

        try {
          // 서버에 최근 본 상품 동기화
          // await syncRecentProductsToServer(recentProducts)
        } catch (error) {
          console.error('최근 본 상품 동기화 실패:', error)
        }
      },
    }),
    {
      name: RECENT_PRODUCTS_STORAGE_KEY,
    }
  )
)
