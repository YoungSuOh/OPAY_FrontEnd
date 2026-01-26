import { RecentProduct, Product } from '../types'

// LocalStorage에서 최근 본 상품 불러오기
export const loadRecentProductsFromLocalStorage = (): RecentProduct[] => {
  try {
    const stored = localStorage.getItem('opay_recent_products')
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    return parsed.state?.recentProducts || []
  } catch {
    return []
  }
}

// 최근 본 상품 추가 (중복 제거, 최신순 유지)
export const addRecentProduct = (
  current: RecentProduct[],
  productId: string,
  maxCount: number = 20
): RecentProduct[] => {
  const filtered = current.filter((p) => p.productId !== productId)
  return [
    { productId, viewedAt: new Date().toISOString() },
    ...filtered,
  ].slice(0, maxCount)
}
