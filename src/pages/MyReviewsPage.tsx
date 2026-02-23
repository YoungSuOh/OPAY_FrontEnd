import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getMyReviews, deleteReview } from '../utils/api'
import { Review } from '../types'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import ConfirmModal from '../components/ConfirmModal'
import './MyReviewsPage.css'

const PAGE_SIZE = 10
const PAGES_PER_BLOCK = 5

const MyReviewsPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      navigate('/')
      return
    }
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getMyReviews(user.id, currentPage, PAGE_SIZE)
        setReviews(data.reviews)
        setTotalPages(data.totalPages)
        setHasNext(data.hasNext)
      } catch (err) {
        setError(err instanceof Error ? err.message : '리뷰 목록을 불러오지 못했습니다.')
        setReviews([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isLoggedIn, user?.id, currentPage, navigate])

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReview(reviewId)
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      setDeleteTargetId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    }
  }

  const handleGoHome = () => navigate('/')
  const productName = (review: Review) =>
    (review as Review & { productName?: string }).productName || `상품 #${review.productId}`

  // 블록 단위 페이징 (주문내역과 동일)
  const blockIndex = Math.floor(currentPage / PAGES_PER_BLOCK)
  const startPage = blockIndex * PAGES_PER_BLOCK
  const endPageInBlock = Math.min(startPage + PAGES_PER_BLOCK - 1, Math.max(0, totalPages - 1))
  const pageNumbers = Array.from(
    { length: endPageInBlock - startPage + 1 },
    (_, i) => startPage + i
  )
  const canGoPrevBlock = blockIndex > 0
  const goPrevBlock = () => setCurrentPage(startPage - 1)
  const goNextBlock = () => setCurrentPage(startPage + PAGES_PER_BLOCK)

  if (!isLoggedIn) return null

  return (
    <div className="my-reviews-page">
      <Header showSearch={false} showQButton={false} />
      <div className="my-reviews-content">
        <h1 className="my-reviews-page-title">내가 쓴 리뷰</h1>

        {error && (
          <div className="my-reviews-section my-reviews-error-section">
            <p className="error-message">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        )}

        {!error && !isLoading && reviews.length === 0 && (
          <div className="my-reviews-section my-reviews-empty-section">
            <p className="empty-message">작성한 리뷰가 없습니다.</p>
            <Button variant="primary" onClick={() => navigate('/products')}>
              상품 보러 가기
            </Button>
          </div>
        )}

        {!error && (reviews.length > 0 || isLoading) && (
          <>
            <div className="my-reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="my-reviews-section my-reviews-card">
                  <div className="my-reviews-card-header">
                    <span className="my-reviews-card-product">
                      <button
                        type="button"
                        className="my-reviews-product-link"
                        onClick={() => navigate(`/products/${review.productId}`)}
                      >
                        {productName(review)}
                      </button>
                    </span>
                    <span className="my-reviews-card-date">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="my-reviews-card-body">
                    <div className="my-reviews-rating">
                      {'★'.repeat(review.rating)}
                      <span className="my-reviews-rating-num">{review.rating}점</span>
                    </div>
                    {review.content && (
                      <p className="my-reviews-content-preview">{review.content}</p>
                    )}
                  </div>
                  <div className="my-reviews-card-footer">
                    <span className="my-reviews-card-summary">{review.rating}점</span>
                    <div className="my-reviews-card-actions">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/products/${review.productId}`)}
                      >
                        상품 보기
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/my-reviews/edit/${review.id}`)}
                      >
                        수정
                      </Button>
                      <button
                        type="button"
                        className="my-reviews-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTargetId(review.id)
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {isLoading && (
              <div className="my-reviews-paging-loading">
                <LoadingSpinner />
              </div>
            )}
            <div className="my-reviews-paging">
              <Button
                variant="secondary"
                onClick={goPrevBlock}
                disabled={!canGoPrevBlock || isLoading}
              >
                이전
              </Button>
              <div className="my-reviews-page-numbers">
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`my-reviews-page-num ${num === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(num)}
                    disabled={isLoading}
                  >
                    {num + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={goNextBlock}
                disabled={!hasNext || isLoading}
              >
                다음
              </Button>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="리뷰 삭제"
        message="이 리뷰를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}

export default MyReviewsPage
