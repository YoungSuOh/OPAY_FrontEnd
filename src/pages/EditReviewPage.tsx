import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getReview, getProduct, updateReview } from '../utils/api'
import { Product } from '../types'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './EditReviewPage.css'

const EditReviewPage = () => {
  const { reviewId } = useParams<{ reviewId: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      navigate('/')
      return
    }
    if (!reviewId) {
      navigate('/my-reviews')
      return
    }
    const load = async () => {
      try {
        const review = await getReview(reviewId)
        if (String(review.userId) !== user.id) {
          navigate('/my-reviews')
          return
        }
        setRating(review.rating)
        setContent(review.content || '')
        const p = await getProduct(review.productId)
        setProduct(p)
      } catch {
        setError('리뷰 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [reviewId, isLoggedIn, user?.id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewId || !product) return
    setError(null)
    setIsSubmitting(true)
    try {
      await updateReview(reviewId, product.id, { rating, content })
      navigate('/my-reviews', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '리뷰 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToList = () => navigate('/my-reviews')

  if (!isLoggedIn) return null

  if (isLoading) {
    return (
      <div className="edit-review-page">
        <Header showSearch={false} showQButton={false} />
        <div className="edit-review-content">
          <LoadingSpinner />
          <p className="edit-review-loading-text">리뷰 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="edit-review-page">
        <Header showSearch={false} showQButton={false} />
        <div className="edit-review-content">
          <h1 className="edit-review-page-title">리뷰 수정</h1>
          <div className="edit-review-section edit-review-error-section">
            <p className="error-message">{error}</p>
            <div className="edit-review-actions">
              <Button variant="primary" onClick={() => window.location.reload()}>
                다시 시도
              </Button>
              <Button variant="secondary" onClick={handleBackToList}>
                내 리뷰로
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="edit-review-page">
      <Header showSearch={false} showQButton={false} />
      <div className="edit-review-content">
        <h1 className="edit-review-page-title">리뷰 수정</h1>

        <div className="edit-review-main">
          {product && (
            <div className="edit-review-section">
              <h2 className="section-title">상품 정보</h2>
              <div className="edit-review-product">
                <div className="edit-review-product-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <span className="edit-review-product-placeholder">
                      {product.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="edit-review-product-info">
                  <span className="edit-review-product-name">{product.name}</span>
                  <span className="edit-review-product-price">
                    {product.price.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="edit-review-section">
            <h2 className="section-title">리뷰 내용</h2>
            <form className="edit-review-form" onSubmit={handleSubmit}>
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
                  placeholder="상품에 대한 리뷰를 작성해 주세요."
                  className="edit-review-textarea"
                  rows={5}
                  maxLength={2000}
                />
                <span className="char-count">{content.length} / 2000</span>
              </div>

              {error && <p className="edit-review-error">{error}</p>}

              <div className="edit-review-actions">
                <Button type="button" variant="secondary" onClick={handleBackToList}>
                  목록으로
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? '저장 중...' : '수정 완료'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditReviewPage
