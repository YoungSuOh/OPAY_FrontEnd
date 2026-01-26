import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MyShop from './pages/MyShop'
import CartPage from './pages/CartPage'
import OrderReviewPage from './pages/OrderReviewPage'
import PaymentProcessingPage from './pages/PaymentProcessingPage'
import PaymentStatusCheckPage from './pages/PaymentStatusCheckPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentFailPage from './pages/PaymentFailPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import OrderListPage from './pages/OrderListPage'
import ProductDetailPage from './pages/ProductDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/my-shop" element={<MyShop />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-review" element={<OrderReviewPage />} />
        <Route path="/payment-processing" element={<PaymentProcessingPage />} />
        <Route path="/payment-status-check" element={<PaymentStatusCheckPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-fail" element={<PaymentFailPage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/order-history" element={<OrderHistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
