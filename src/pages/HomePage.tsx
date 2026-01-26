import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useRecentProductsStore } from '../store/recentProductsStore'
import { Product } from '../types'
import Button from '../components/Button'
import CartButton from '../components/CartButton'
import Header from '../components/Header'
import './HomePage.css'

// 샘플 상품 데이터
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: '프리미엄 플랜',
    description: '모든 기능을 사용할 수 있는 프리미엄 플랜입니다.',
    price: 9900,
    stock: 100,
    averageRating: 5.0,
    reviewCount: 7,
    category: '플랜',
  },
  {
    id: '2',
    name: '베이직 플랜',
    description: '기본 기능을 사용할 수 있는 베이직 플랜입니다.',
    price: 4900,
    stock: 50,
    averageRating: 4.8,
    reviewCount: 4475,
    category: '플랜',
  },
  {
    id: '3',
    name: '스타터 플랜',
    description: '시작하기 좋은 스타터 플랜입니다.',
    price: 2900,
    stock: 30,
    averageRating: 4.8,
    reviewCount: 630,
    category: '플랜',
  },
  {
    id: '4',
    name: '엔터프라이즈 플랜',
    description: '기업용 고급 플랜입니다.',
    price: 49900,
    stock: 20,
    averageRating: 4.9,
    reviewCount: 1234,
    category: '플랜',
  },
  {
    id: '5',
    name: '프리미엄 플러스',
    description: '프리미엄 플랜의 확장 버전입니다.',
    price: 14900,
    stock: 75,
    averageRating: 4.7,
    reviewCount: 890,
    category: '플랜',
  },
]

const RELATED_KEYWORDS = [
  '프리미엄 플랜',
  '베이직 플랜',
  '스타터 플랜',
  '엔터프라이즈',
  '기업용 플랜',
  '개인용 플랜',
  '월간 플랜',
  '연간 플랜',
]

const CATEGORIES = [
  '전체',
  '프리미엄',
  '베이직',
  '스타터',
  '엔터프라이즈',
]

const MANUFACTURERS = [
  'OPAY',
  'OPAY Plus',
  'OPAY Enterprise',
]

const HomePage = () => {
  const navigate = useNavigate()
  const { addToCart, localCart } = useCartStore()
  const { addRecentProduct } = useRecentProductsStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selectedManufacturer, setSelectedManufacturer] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [sortBy, setSortBy] = useState<'ranking' | 'price-low' | 'price-high' | 'reviews' | 'rating'>('ranking')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(SAMPLE_PRODUCTS)
  const [showFilters, setShowFilters] = useState(true)

  useEffect(() => {
    // 상품 페이지 진입 시 최근 본 상품에 추가
    SAMPLE_PRODUCTS.forEach((product) => {
      addRecentProduct(product.id)
    })
  }, [addRecentProduct])

  useEffect(() => {
    // 필터링 및 정렬
    let filtered = [...SAMPLE_PRODUCTS]

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 카테고리 필터
    if (selectedCategory !== '전체') {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    // 제조사 필터
    if (selectedManufacturer.length > 0) {
      filtered = filtered.filter(() => selectedManufacturer.includes('OPAY'))
    }

    // 가격 필터
    if (priceRange) {
      filtered = filtered.filter(
        (p) => p.price >= priceRange.min && p.price <= priceRange.max
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'reviews':
          return (b.reviewCount || 0) - (a.reviewCount || 0)
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0)
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategory, selectedManufacturer, priceRange, sortBy])

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
  }

  const handleManufacturerToggle = (manufacturer: string) => {
    setSelectedManufacturer((prev) =>
      prev.includes(manufacturer)
        ? prev.filter((m) => m !== manufacturer)
        : [...prev, manufacturer]
    )
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
    <div className="home-page">
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
                  {CATEGORIES.map((cat) => (
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

              {/* 제조사 */}
              <div className="filter-section">
                <h4 className="filter-title">제조사</h4>
                <div className="filter-options">
                  {MANUFACTURERS.map((mfr) => (
                    <label key={mfr} className="filter-option">
                      <input
                        type="checkbox"
                        checked={selectedManufacturer.includes(mfr)}
                        onChange={() => handleManufacturerToggle(mfr)}
                      />
                      <span>{mfr}</span>
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
              전체 {filteredProducts.length.toLocaleString()}
            </div>
            <div className="sort-options">
              <button
                className={`sort-btn ${sortBy === 'ranking' ? 'active' : ''}`}
                onClick={() => setSortBy('ranking')}
              >
                OPAY 랭킹순
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
            {filteredProducts.map((product) => {
              const cartQuantity = localCart.get(product.id) || 0
              return (
                <div key={product.id} className="product-item-large">
                  <div className="product-image-section">
                    <div className="product-badge-top">
                      구매 {(product.reviewCount || 0)}+
                    </div>
                    <div
                      className="product-image-placeholder-large"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      {product.name.charAt(0)}
                    </div>
                  </div>

                  <div className="product-details-section">
                    <div className="product-promo-text">
                      후기수가 증명하는 {product.name}!
                    </div>
                    <h3
                      className="product-name-large"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
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

                    <div className="product-actions-large">
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

                  <div className="product-side-info">
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
    </div>
  )
}

export default HomePage
