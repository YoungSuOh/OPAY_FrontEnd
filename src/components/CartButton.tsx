import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import './CartButton.css'

const CartButton = () => {
  const navigate = useNavigate()
  const { localCart } = useCartStore()
  const itemCount = localCart.size

  return (
    <button className="cart-button" onClick={() => navigate('/cart')}>
      <span className="cart-icon">🛒</span>
      {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
    </button>
  )
}

export default CartButton
