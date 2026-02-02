import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useRecentProductsStore } from '../store/recentProductsStore'
import { Product } from '../types'
import { getProducts, getCategories } from '../utils/api'
import Button from '../components/Button'
import CartButton from '../components/CartButton'
import Header from '../components/Header'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'
import AuthModal from '../components/AuthModal'
import './ProductListPage.css'

const RELATED_KEYWORDS = [
  '식품',
  '가전/디지털',
  '주방용품',
  '패션/의류',
  '뷰티/화장품',
  '생활용품',
  '유아동',
  '반려동물용품',
]

const ProductListPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const { addToCart, getCartItems } = useCartStore()
  const { addRecentProduct } = useRecentProductsStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [categories, setCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [sortBy, setSortBy] = useState<'created' | 'price-low' | 'price-high' | 'reviews' | 'rating'>('created')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(true)
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    // 카테고리 목록 로드
    const loadCategories = async () => {
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch (error) {
        console.error('카테고리 로드 실패:', error)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    // 상품 목록 로드
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const sortByMap: Record<string, 'created' | 'price' | 'name' | 'rating' | 'reviews'> = {
          'created': 'created',
          'price-low': 'price',
          'price-high': 'price',
          'reviews': 'reviews',
          'rating': 'rating',
        }

        const sortDirection = sortBy === 'price-low' ? 'asc' : 'desc'

        const data = await getProducts({
          keyword: searchQuery || undefined,
          category: selectedCategory !== '전체' ? selectedCategory : undefined,
          minPrice: priceRange?.min,
          maxPrice: priceRange?.max,
          sortBy: sortByMap[sortBy],
          sortDirection,
          page,
          size: 20,
        })

        setFilteredProducts(data.products)
        setTotalElements(data.totalElements)

        // 최근 본 상품에 추가
        data.products.forEach((product) => {
          addRecentProduct(product.id)
        })
      } catch (error) {
        console.error('상품 목록 로드 실패:', error)
        setFilteredProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [searchQuery, selectedCategory, priceRange, sortBy, page, addRecentProduct])

  const handleAddToCart = async (product: Product) => {
    try {
      if (!isLoggedIn) {
        setIsAuthModalOpen(true)
        return
      }
      await addToCart(product, 1)
      setShowToast(true)
    } catch (error) {
      console.error('장바구니 추가 실패:', error)
      if (error instanceof Error) {
        if (error.message.includes('로그인')) {
          setIsAuthModalOpen(true)
        } else {
          alert(error.message)
        }
      } else {
        alert('장바구니 추가에 실패했습니다.')
      }
    }
  }

  const handlePriceRangeSelect = (range: string) => {
    switch (range) {
      case '0-10000':
        setPriceRange({ min: 0, max: 10000 })
        break
      case '10000-20000':
        setPriceRange({ min: 10000, max: 20000 })
        break
      case '20000-50000':
        setPriceRange({ min: 20000, max: 50000 })
        break
      case '50000+':
        setPriceRange({ min: 50000, max: Infinity })
        break
      default:
        setPriceRange(null)
    }
  }

  return (
    <div className="product-list-page">
      {/* 상단 검색 바 */}
      <Header 
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showQButton={false}
      />

      {/* 연관 키워드 */}
      {searchQuery && (
        <div className="related-keywords">
          <span className="related-label">연관</span>
          {RELATED_KEYWORDS.map((keyword) => (
            <button
              key={keyword}
              className="keyword-tag"
              onClick={() => setSearchQuery(keyword)}
            >
              {keyword}
            </button>
          ))}
        </div>
      )}

      <div className="product-content">
        {/* 필터 사이드바 */}
        <div className={`filter-sidebar ${showFilters ? '' : 'collapsed'}`}>
          <div className="filter-header">
            <h3>필터</h3>
            <button
              className="toggle-filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '접기' : '펼치기'}
            </button>
          </div>

          {showFilters && (
            <>
              {/* 카테고리 */}
              <div className="filter-section">
                <h4 className="filter-title">카테고리</h4>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === '전체'}
                      onChange={() => setSelectedCategory('전체')}
                    />
                    <span>전체</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat} className="filter-option">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 가격 */}
              <div className="filter-section">
                <h4 className="filter-title">가격</h4>
                <div className="filter-options">
                  <button
                    className="price-range-btn"
                    onClick={() => handlePriceRangeSelect('0-10000')}
                  >
                    1만원 미만
                  </button>
                  <button
                    className="price-range-btn"
                    onClick={() => handlePriceRangeSelect('10000-20000')}
                  >
                    1만원~2만원
                  </button>
                  <button
                    className="price-range-btn"
                    onClick={() => handlePriceRangeSelect('20000-50000')}
                  >
                    2만원~5만원
                  </button>
                  <button
                    className="price-range-btn"
                    onClick={() => handlePriceRangeSelect('50000+')}
                  >
                    5만원 이상
                  </button>
                </div>
                <div className="price-input-group">
                  <input
                    type="number"
                    className="price-input"
                    placeholder="최소가격"
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        min: Number(e.target.value) || 0,
                        max: prev?.max || Infinity,
                      }))
                    }
                  />
                  <span>~</span>
                  <input
                    type="number"
                    className="price-input"
                    placeholder="최대가격"
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        min: prev?.min || 0,
                        max: Number(e.target.value) || Infinity,
                      }))
                    }
                  />
                  <button className="price-search-btn">🔍</button>
                </div>
              </div>

              {/* 배송/혜택 */}
              <div className="filter-section">
                <h4 className="filter-title">배송/혜택</h4>
                <div className="filter-options">
                  <label className="filter-option">
                    <input type="checkbox" />
                    <span>무료배송</span>
                  </label>
                  <label className="filter-option">
                    <input type="checkbox" />
                    <span>빠른배송</span>
                  </label>
                  <label className="filter-option">
                    <input type="checkbox" />
                    <span>쿠폰</span>
                  </label>
                  <label className="filter-option">
                    <input type="checkbox" />
                    <span>적립</span>
                  </label>
                </div>
              </div>

              <div className="filter-footer">
                <button className="view-all-filters-btn">필터 전체보기</button>
              </div>
            </>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <div className="products-main">
          {/* 결과 헤더 */}
          <div className="results-header">
            <div className="results-count">
              전체 {totalElements.toLocaleString()}
            </div>
            <div className="sort-options">
              <button
                className={`sort-btn ${sortBy === 'created' ? 'active' : ''}`}
                onClick={() => setSortBy('created')}
              >
                최신순
              </button>
              <button
                className={`sort-btn ${sortBy === 'price-low' ? 'active' : ''}`}
                onClick={() => setSortBy('price-low')}
              >
                낮은 가격순
              </button>
              <button
                className={`sort-btn ${sortBy === 'price-high' ? 'active' : ''}`}
                onClick={() => setSortBy('price-high')}
              >
                높은 가격순
              </button>
              <button
                className={`sort-btn ${sortBy === 'reviews' ? 'active' : ''}`}
                onClick={() => setSortBy('reviews')}
              >
                리뷰 많은순
              </button>
              <button
                className={`sort-btn ${sortBy === 'rating' ? 'active' : ''}`}
                onClick={() => setSortBy('rating')}
              >
                리뷰 좋은순
              </button>
            </div>
            <div className="view-options">
              <select className="view-select">
                <option>40개씩 보기</option>
                <option>20개씩 보기</option>
                <option>60개씩 보기</option>
              </select>
            </div>
          </div>

          {/* 상품 리스트 */}
          <div className="products-list">
            {isLoading && <LoadingSpinner />}
            {!isLoading && filteredProducts.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                상품이 없습니다.
              </div>
            )}
            {filteredProducts.map((product) => {
              const cartItems = getCartItems()
              const cartItem = cartItems.find(item => item.product.id === product.id)
              const cartQuantity = cartItem?.quantity || 0
              return (
                <div 
                  key={product.id} 
                  className="product-item-large"
                  onClick={(e) => {
                    // 버튼 클릭 시에는 상세 페이지로 이동하지 않음
                    if ((e.target as HTMLElement).closest('button') || 
                        (e.target as HTMLElement).closest('.product-actions-large') ||
                        (e.target as HTMLElement).closest('.product-side-info')) {
                      return
                    }
                    navigate(`/products/${product.id}`)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-image-section">
                    <div className="product-badge-top">
                      구매 {(product.reviewCount || 0)}+
                    </div>
                    <div className="product-image-placeholder-large">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        product.name.charAt(0)
                      )}
                    </div>
                  </div>

                  <div className="product-details-section">
                    <div className="product-promo-text">
                      후기수가 증명하는 {product.name}!
                    </div>
                    <h3 className="product-name-large">
                      {product.name}
                    </h3>
                    <div className="product-category-path">
                      상품 {'>'} 플랜 {'>'} {product.category}
                    </div>

                    <div className="product-specs">
                      <div className="spec-item">
                        <span className="spec-label">가격:</span>
                        <span className="spec-value">{product.price.toLocaleString()}원</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">재고:</span>
                        <span className="spec-value">{product.stock}개</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">리뷰:</span>
                        <span className="spec-value">
                          ★{product.averageRating} ({(product.reviewCount || 0)})
                        </span>
                      </div>
                    </div>

                    <div className="product-rating-section">
                      <div className="rating-stars">
                        {'★'.repeat(Math.floor(product.averageRating || 0))}
                      </div>
                      <span className="review-count">{(product.reviewCount || 0)}개 리뷰</span>
                      <span className="like-count">찜 {Math.floor((product.reviewCount || 0) * 0.5)}</span>
                    </div>

                    <div 
                      className="product-actions-large"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {cartQuantity > 0 && (
                        <div className="cart-indicator">장바구니에 {cartQuantity}개</div>
                      )}
                      <Button
                        onClick={() => handleAddToCart(product)}
                        variant="primary"
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? '품절' : '장바구니 담기'}
                      </Button>
                      <Button
                        onClick={() => navigate(`/products/${product.id}`)}
                        variant="secondary"
                      >
                        상세보기
                      </Button>
                    </div>
                  </div>

                  <div 
                    className="product-side-info"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="point-info">
                      OPAY 포인트 최대 {Math.floor(product.price * 0.05).toLocaleString()}원
                    </div>
                    <div className="purchase-info">
                      <button className="info-btn">구매정보</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <CartButton />
      
      {/* 토스트 알림 */}
      <Toast
        message="장바구니에 추가되었습니다"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* 로그인 모달 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}

export default ProductListPage
