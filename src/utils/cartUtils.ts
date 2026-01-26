import { CartItem, Product } from '../types'

// LocalStorage에서 장바구니 불러오기
export const loadCartFromLocalStorage = (): Map<string, number> => {
  try {
    const stored = localStorage.getItem('opay_local_cart')
    if (!stored) return new Map()
    
    const parsed = JSON.parse(stored)
    if (parsed.state?.localCart) {
      return new Map(parsed.state.localCart)
    }
    return new Map()
  } catch {
    return new Map()
  }
}

// 서버 장바구니와 병합
export const mergeCarts = (
  localCart: Map<string, number>,
  serverCart: CartItem[]
): Map<string, number> => {
  const merged = new Map(localCart)
  
  // 서버 장바구니 우선 (로그인 후)
  serverCart.forEach((item) => {
    merged.set(item.product.id, item.quantity)
  })
  
  return merged
}

// 장바구니 총액 계산 (참고용, 실제는 서버 값 사용)
export const calculateCartTotal = (
  items: CartItem[]
): number => {
  return items.reduce((total, item) => {
    return total + item.product.price * item.quantity
  }, 0)
}
