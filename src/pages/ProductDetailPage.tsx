import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useRecentProductsStore } from '../store/recentProductsStore'
import { Product, Review } from '../types'
import { getProduct, getProductReviews } from '../utils/api'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import CartButton from '../components/CartButton'
import AuthModal from '../components/AuthModal'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import './ProductDetailPage.css'

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuthStore()
  const { addToCart } = useCartStore()
  const { addRecentProduct } = useRecentProductsStore()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [isLoginConfirmModalOpen, setIsLoginConfirmModalOpen] = useState(false)
  
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [reviewPage, setReviewPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)

  useEffect(() => {
    // 상품 정보 로드
    const loadProduct = async () => {
      if (!id) return
      
      setIsLoading(true)
      try {
        const productData = await getProduct(id)
        setProduct(productData)
        addRecentProduct(productData.id)
      } catch (error) {
        console.error('상품 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [id, addRecentProduct])

  useEffect(() => {
    // 리뷰 로드
    if (!id) return
    
    const loadReviews = async () => {
      setIsLoadingReviews(true)
      try {
        const pageIndex = reviewPage - 1
        const data = await getProductReviews(id, pageIndex, 10)
        if (reviewPage === 1) {
          setReviews(data.reviews ?? [])
        } else {
          setReviews((prev) => [...prev, ...(data.reviews ?? [])])
        }
        setHasMore(data.hasMore ?? false)
      } catch (error) {
        console.error('리뷰 로드 실패:', error)
        setReviews([])
        setHasMore(false)
      } finally {
        setIsLoadingReviews(false)
      }
    }

    loadReviews()
  }, [id, reviewPage])

  const handleAddToCart = async () => {
    if (!product) return
    
    if (!isLoggedIn) {
      setIsLoginConfirmModalOpen(true)
      return
    }

    try {
      await addToCart(product, 1)
      setShowToast(true)
    } catch (error) {
      console.error('장바구니 추가 실패:', error)
      if (error instanceof Error) {
        if (error.message.includes('로그인')) {
          setIsLoginConfirmModalOpen(true)
        } else {
          alert(error.message)
        }
      } else {
        alert('장바구니 추가에 실패했습니다.')
      }
    }
  }

  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastReviewElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingReviews) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingReviews) {
          setReviewPage((prev) => prev + 1)
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    )
    
    if (node) observerRef.current.observe(node)
  }, [isLoadingReviews, hasMore])

  if (isLoading || !product) {
    return (
      <div className="product-detail-page">
        <Header showSearch={true} showQButton={false} />
        <div className="product-detail-content">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail-page">
      <Header showSearch={true} showQButton={false} />
      <div className="product-detail-content">
        <div className="product-info-section">
          <div className="product-image-container">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="product-image-placeholder">
                {product.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-rating">
              {'★'.repeat(Math.floor(Number(product.averageRating ?? 0)))}
              <span className="rating-text">
                {Number(product.averageRating ?? 0).toFixed(1)} ({Number(product.reviewCount ?? 0)}개 리뷰)
              </span>
            </div>
            <div className="product-price-large">
              {product.price.toLocaleString()}원
            </div>
            <div className="product-stock">
              재고: {product.stock}개
            </div>
            <p className="product-description">{product.description}</p>
            <div className="product-actions-section">
              <Button
                fullWidth
                onClick={handleAddToCart}
                variant="primary"
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? '품절' : '장바구니 담기'}
              </Button>
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <div className="reviews-section-header">
            <h2 className="section-title">리뷰 ({Number(product.reviewCount ?? 0)})</h2>
            <Button
              variant="secondary"
              onClick={() => {
                if (!isLoggedIn) setIsLoginConfirmModalOpen(true)
                else if (id) navigate(`/products/${id}/write-review`)
              }}
            >
              리뷰 쓰기
            </Button>
          </div>
          <div className="reviews-list">
            {!isLoadingReviews && reviews.length === 0 && (
              <p className="reviews-empty-message">아직 작성된 리뷰가 없습니다.</p>
            )}
            {reviews.map((review, index) => {
              const isMine = isLoggedIn && user?.id && String(review.userId) === user.id
              return (
              <div
                key={review.id}
                className="review-item"
                ref={index === reviews.length - 1 ? lastReviewElementRef : null}
              >
                <div className="review-header">
                  <div className="review-user">
                    <strong>{review.userName}</strong>
                    <div className="review-rating">
                      {'★'.repeat(review.rating)}
                      <span className="review-rating-num">{review.rating}점</span>
                    </div>
                  </div>
                  <div className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <p className="review-content">{review.content}</p>
                {review.images && review.images.length > 0 && (
                  <div className="review-images">
                    {review.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`리뷰 이미지 ${idx + 1}`} />
                    ))}
                  </div>
                )}
                {isMine && (
                  <div className="review-actions">
                    <button type="button" onClick={() => navigate(`/my-reviews/edit/${review.id}`)}>
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('이 리뷰를 삭제하시겠습니까?')) return
                        try {
                          const { deleteReview } = await import('../utils/api')
                          await deleteReview(review.id)
                          setReviews((prev) => prev.filter((r) => r.id !== review.id))
                        } catch (err) {
                          alert(err instanceof Error ? err.message : '삭제에 실패했습니다.')
                        }
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )})}
            {hasMore && (
              <div className="load-more-container">
                <LoadingSpinner />
              </div>
            )}
            {!hasMore && reviews.length > 0 && (
              <p style={{ textAlign: 'center', color: '#64748b' }}>
                모든 리뷰를 불러왔습니다.
              </p>
            )}
          </div>
        </div>
      </div>
      <CartButton />
      {/* 로그인 확인 모달 */}
      <ConfirmModal
        isOpen={isLoginConfirmModalOpen && !isAuthModalOpen}
        message="로그인이 필요한 서비스입니다. 로그인을 하시겠습니까?"
        confirmText="로그인"
        cancelText="취소"
        onConfirm={() => {
          setIsLoginConfirmModalOpen(false)
          setIsAuthModalOpen(true)
        }}
        onCancel={() => {
          setIsLoginConfirmModalOpen(false)
        }}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      <Toast
        message="장바구니에 추가되었습니다"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}

export default ProductDetailPage
