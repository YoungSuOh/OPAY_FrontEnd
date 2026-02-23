import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getProduct, createReview } from '../utils/api'
import { Product } from '../types'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './WriteReviewPage.css'

const WriteReviewPage = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/')
      return
    }
    if (!productId) {
      navigate('/products')
      return
    }
    const load = async () => {
      try {
        const p = await getProduct(productId)
        setProduct(p)
      } catch {
        setError('상품 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [productId, isLoggedIn, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !product) return
    setError(null)
    setIsSubmitting(true)
    try {
      await createReview(productId, { rating, content })
      navigate(`/products/${productId}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '리뷰 작성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoggedIn) return null
  if (isLoading) {
    return (
      <div className="write-review-page">
        <Header showSearch={false} showQButton={false} />
        <div className="write-review-content">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="write-review-page">
        <Header showSearch={false} showQButton={false} />
        <div className="write-review-content">
          <p className="write-review-error">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/products')}>
            상품 목록으로
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="write-review-page">
      <Header showSearch={false} showQButton={false} />
      <div className="write-review-content">
        <h1 className="write-review-title">리뷰 쓰기</h1>

        {product && (
          <div className="write-review-product">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="write-review-product-img" />
            ) : (
              <div className="write-review-product-placeholder">{product.name.charAt(0)}</div>
            )}
            <div className="write-review-product-info">
              <h2 className="write-review-product-name">{product.name}</h2>
              <p className="write-review-product-price">{product.price.toLocaleString()}원</p>
            </div>
          </div>
        )}

        <form className="write-review-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>별점</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rating-star ${rating >= value ? 'active' : ''}`}
                  onClick={() => setRating(value)}
                  aria-label={`${value}점`}
                >
                  ★
                </button>
              ))}
            </div>
            <span className="rating-text">{rating}점</span>
          </div>

          <div className="form-group">
            <label>리뷰 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상품에 대한 리뷰를 작성해 주세요. (선택)"
              className="write-review-textarea"
              rows={5}
              maxLength={2000}
            />
            <span className="char-count">{content.length} / 2000</span>
          </div>

          {error && <p className="write-review-error">{error}</p>}

          <div className="write-review-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(productId ? `/products/${productId}` : '/products')}
            >
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '리뷰 등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WriteReviewPage
