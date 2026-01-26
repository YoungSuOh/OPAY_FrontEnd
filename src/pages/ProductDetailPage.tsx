import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useRecentProductsStore } from '../store/recentProductsStore'
import { Product, Review } from '../types'
import { getProductReviews, createReview } from '../utils/api'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './ProductDetailPage.css'

// 샘플 상품 데이터
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: '프리미엄 플랜',
    description: '모든 기능을 사용할 수 있는 프리미엄 플랜입니다.',
    price: 9900,
    stock: 100,
    averageRating: 4.5,
    reviewCount: 128,
  },
  {
    id: '2',
    name: '베이직 플랜',
    description: '기본 기능을 사용할 수 있는 베이직 플랜입니다.',
    price: 4900,
    stock: 50,
    averageRating: 4.2,
    reviewCount: 89,
  },
  {
    id: '3',
    name: '스타터 플랜',
    description: '시작하기 좋은 스타터 플랜입니다.',
    price: 2900,
    stock: 30,
    averageRating: 4.0,
    reviewCount: 45,
  },
]

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCartStore()
  const { addRecentProduct } = useRecentProductsStore()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)

  useEffect(() => {
    // 상품 정보 로드
    const foundProduct = SAMPLE_PRODUCTS.find((p) => p.id === id)
    if (foundProduct) {
      setProduct(foundProduct)
      addRecentProduct(foundProduct.id)
    }
    setIsLoading(false)
  }, [id, addRecentProduct])

  useEffect(() => {
    // 리뷰 로드
    if (!id) return
    
    const loadReviews = async () => {
      setIsLoadingReviews(true)
      try {
        const data = await getProductReviews(id, page, 10)
        if (page === 1) {
          setReviews(data.reviews)
        } else {
          setReviews((prev) => [...prev, ...data.reviews])
        }
        setHasMore(data.hasMore)
      } catch (error) {
        console.error('리뷰 로드 실패:', error)
        // 샘플 리뷰 데이터
        if (page === 1) {
          setReviews([
            {
              id: '1',
              productId: id,
              userId: 'user1',
              userName: '홍길동',
              rating: 5,
              content: '정말 좋은 상품입니다!',
              createdAt: new Date().toISOString(),
            },
          ])
        }
        setHasMore(false)
      } finally {
        setIsLoadingReviews(false)
      }
    }

    loadReviews()
  }, [id, page])

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1)
      alert('장바구니에 추가되었습니다.')
    }
  }

  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastReviewElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingReviews) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingReviews) {
        setPage((prev) => prev + 1)
      }
    })
    if (node) observerRef.current.observe(node)
  }, [isLoadingReviews, hasMore])

  if (isLoading || !product) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Header showSearch={true} showQButton={false} />
      <div className="product-detail">
        <div className="product-header">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-rating">
            ⭐ {product.averageRating} ({product.reviewCount}개 리뷰)
          </div>
          <div className="product-price-large">
            {product.price.toLocaleString()}원
          </div>
          <p className="product-description">{product.description}</p>
          <div className="product-stock">
            재고: {product.stock}개
          </div>
        </div>

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

        <div className="reviews-section">
          <h2 className="section-title">리뷰 ({product.reviewCount})</h2>
          
          <div className="reviews-list">
            {reviews.map((review, index) => (
              <div
                key={review.id}
                className="review-item"
                ref={index === reviews.length - 1 ? lastReviewElementRef : null}
              >
                <div className="review-header">
                  <div className="review-user">
                    <strong>{review.userName}</strong>
                    <div className="review-rating">
                      {'⭐'.repeat(review.rating)}
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
                {review.isMine && (
                  <div className="review-actions">
                    <button>수정</button>
                    <button>삭제</button>
                  </div>
                )}
              </div>
            ))}
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
    </PageContainer>
  )
}

export default ProductDetailPage
