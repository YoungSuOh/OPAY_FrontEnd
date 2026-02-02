import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import './CartButton.css'

const CartButton = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const { cartItemCount, loadCartItemCount, localCart } = useCartStore()
  
  // localCart가 undefined일 수 있으므로 안전하게 처리
  const itemCount = localCart?.size ?? cartItemCount ?? 0

  useEffect(() => {
    if (isLoggedIn) {
      loadCartItemCount()
    } else {
      useCartStore.setState({ cartItemCount: 0 })
    }
  }, [isLoggedIn, loadCartItemCount])

  if (!isLoggedIn) {
    return null
  }

  return (
    <button className="cart-button" onClick={() => navigate('/cart')}>
      <span className="cart-icon">🛒</span>
      {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
    </button>
  )
}

export default CartButton