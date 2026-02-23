import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const ProductListPage = lazy(() => import('./pages/ProductListPage'))
const MyShop = lazy(() => import('./pages/MyShop'))
const CartPage = lazy(() => import('./pages/CartPage'))
const OrderReviewPage = lazy(() => import('./pages/OrderReviewPage'))
const PaymentProcessingPage = lazy(() => import('./pages/PaymentProcessingPage'))
const PaymentStatusCheckPage = lazy(() => import('./pages/PaymentStatusCheckPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const PaymentFailPage = lazy(() => import('./pages/PaymentFailPage'))
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const WriteReviewPage = lazy(() => import('./pages/WriteReviewPage'))
const EditReviewPage = lazy(() => import('./pages/EditReviewPage'))
const MyReviewsPage = lazy(() => import('./pages/MyReviewsPage'))

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/my-shop" element={<MyShop />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products/:productId/write-review" element={<WriteReviewPage />} />
            <Route path="/my-reviews" element={<MyReviewsPage />} />
            <Route path="/my-reviews/edit/:reviewId" element={<EditReviewPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/order-review" element={<OrderReviewPage />} />
            <Route path="/payment-processing" element={<PaymentProcessingPage />} />
            <Route path="/payment-status-check" element={<PaymentStatusCheckPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/payment-fail" element={<PaymentFailPage />} />
            <Route path="/order-history" element={<OrderHistoryPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
