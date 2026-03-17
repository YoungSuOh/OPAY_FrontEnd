import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'
import AdminRoute from './components/AdminRoute'

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

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'))
const AdminMembersPage = lazy(() => import('./pages/admin/AdminMembersPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage'))
const AdminRefundsPage = lazy(() => import('./pages/admin/AdminRefundsPage'))

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

            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="members" element={<AdminMembersPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="refunds" element={<AdminRefundsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
