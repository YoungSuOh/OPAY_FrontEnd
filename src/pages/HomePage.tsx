import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { Product } from '../types'
import { getProducts } from '../utils/api'
import Header from '../components/Header'
import CartButton from '../components/CartButton'
import LoadingSpinner from '../components/LoadingSpinner'
import './HomePage.css'

// 카테고리 목록
const CATEGORIES = [
  { id: 'fashion', name: '패션', icon: '👕' },
  { id: 'food', name: '식품', icon: '🍎' },
  { id: 'furniture', name: '가구/홈테리어', icon: '🛋️' },
  { id: 'electronics', name: '가전/디지털', icon: '📱' },
  { id: 'stationery', name: '문구 오피스', icon: '📝' },
  { id: 'daily', name: '생활용품', icon: '🧴' },
  { id: 'beauty', name: '뷰티', icon: '💄' },
  { id: 'sports', name: '스포츠/레저', icon: '⚽' },
  { id: 'health', name: '헬스/건강식품', icon: '💊' },
  { id: 'kids', name: '유아동', icon: '🧸' },
  { id: 'kitchen', name: '주방용품', icon: '🍳' },
  { id: 'pet', name: '반려동물용품', icon: '🐾' },
  { id: 'car', name: '자동차용품', icon: '🚗' },
  { id: 'travel', name: '여행', icon: '✈️' },
]


const HomePage = () => {
  const navigate = useNavigate()
  const { addToCart } = useCartStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [specialPage, setSpecialPage] = useState(1)
  const [recommendedPage, setRecommendedPage] = useState(1)
  const [categoryProducts, setCategoryProducts] = useState<{ [key: string]: Product[] }>({})
  const [specialProducts, setSpecialProducts] = useState<Product[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isRecommendedTransitioning, setIsRecommendedTransitioning] = useState(false)

  const ITEMS_PER_PAGE = 3 // 페이지당 표시할 상품 수
  const totalSpecialPages = Math.ceil(specialProducts.length / ITEMS_PER_PAGE)
  const totalRecommendedPages = Math.ceil(recommendedProducts.length / ITEMS_PER_PAGE)

  useEffect(() => {
    // 오늘의 판매자 특가 상품 로드 (리뷰 많은 순으로 상위 9개 - 3페이지 분량)
    const loadSpecialProducts = async () => {
      try {
        const data = await getProducts({
          sortBy: 'reviews',
          sortDirection: 'desc',
          page: 0,
          size: 9,
        })
        setSpecialProducts(data.products)
      } catch (error) {
        console.error('특가 상품 로드 실패:', error)
      }
    }

    // 관심 있을 만한 상품 로드 (평점 높은 순으로 상위 9개 - 3페이지 분량)
    const loadRecommendedProducts = async () => {
      try {
        const data = await getProducts({
          sortBy: 'rating',
          sortDirection: 'desc',
          page: 0,
          size: 9,
        })
        setRecommendedProducts(data.products)
      } catch (error) {
        console.error('추천 상품 로드 실패:', error)
      }
    }

    loadSpecialProducts()
    loadRecommendedProducts()
  }, [])

  useEffect(() => {
    // 카테고리별 상품 데이터 로드
    const loadCategoryProducts = async () => {
      setIsLoading(true)
      try {
        const products: { [key: string]: Product[] } = {}
        
        await Promise.all(
          CATEGORIES.map(async (category) => {
            try {
              const data = await getProducts({
                category: category.name,
                page: 0,
                size: 12,
              })
              products[category.id] = data.products
            } catch (error) {
              console.error(`카테고리 ${category.name} 상품 로드 실패:`, error)
              products[category.id] = []
            }
          })
        )
        
        setCategoryProducts(products)
      } catch (error) {
        console.error('카테고리 상품 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCategoryProducts()
  }, [])

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
  }

  const handleSpecialNext = () => {
    if (specialPage < totalSpecialPages && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setSpecialPage(prev => prev + 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handleSpecialPrev = () => {
    if (specialPage > 1 && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setSpecialPage(prev => prev - 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handleRecommendedNext = () => {
    if (recommendedPage < totalRecommendedPages && !isRecommendedTransitioning) {
      setIsRecommendedTransitioning(true)
      setTimeout(() => {
        setRecommendedPage(prev => prev + 1)
        setIsRecommendedTransitioning(false)
      }, 300)
    }
  }

  const handleRecommendedPrev = () => {
    if (recommendedPage > 1 && !isRecommendedTransitioning) {
      setIsRecommendedTransitioning(true)
      setTimeout(() => {
        setRecommendedPage(prev => prev - 1)
        setIsRecommendedTransitioning(false)
      }, 300)
    }
  }

  const displayedCategory = selectedCategory || CATEGORIES[0].id
  const currentProducts = categoryProducts[displayedCategory] || []

  return (
    <div className="home-page">
      <Header 
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showQButton={false}
      />

      <div className="home-content">
        {/* 오늘의 판매자 특가 섹션 */}
        <section className="special-deals-section">
          <div className="section-header">
            <h2 className="section-title">오늘의 판매자 특가(선착순)</h2>
            <div className="page-indicator">
              {totalSpecialPages > 0 ? `${specialPage}/${totalSpecialPages}` : '0/0'}
            </div>
          </div>
          <div className="special-deals-container">
            <button 
              className="nav-arrow nav-arrow-left" 
              onClick={handleSpecialPrev}
              disabled={specialPage === 1 || totalSpecialPages === 0}
            >
              ‹
            </button>
            <div className="special-deals-list-wrapper">
              <div 
                className={`special-deals-list ${isTransitioning ? 'transitioning' : ''}`}
                style={{ 
                  transform: `translateX(-${(specialPage - 1) * 100}%)`
                }}
              >
                {specialProducts.length === 0 && !isLoading && (
                  <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>상품이 없습니다.</div>
                )}
                {isLoading && <LoadingSpinner />}
                {Array.from({ length: totalSpecialPages }).map((_, pageIndex) => {
                  const pageProducts = specialProducts.slice(
                    pageIndex * ITEMS_PER_PAGE,
                    (pageIndex + 1) * ITEMS_PER_PAGE
                  )
                  return (
                    <div key={pageIndex} className="special-deals-page">
                      {pageProducts.map((product) => (
                        <div 
                          key={product.id} 
                          className="special-product-card"
                          onClick={() => navigate(`/products/${product.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="product-badge">특가진행중</div>
                          <div className="product-image">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} />
                            ) : (
                              product.name.charAt(0)
                            )}
                          </div>
                          <h3 className="product-title">
                            {product.name}
                          </h3>
                          <div className="product-discount">할인 {Math.floor(Math.random() * 50) + 10}%</div>
                          <div className="product-price">{product.price.toLocaleString()}원</div>
                          <div className="product-rating">
                            {'★'.repeat(5)} ({(product.reviewCount || 0).toLocaleString()})
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
            <button 
              className="nav-arrow nav-arrow-right" 
              onClick={handleSpecialNext}
              disabled={specialPage === totalSpecialPages || totalSpecialPages === 0}
            >
              ›
            </button>
          </div>
        </section>

        {/* 카테고리별 상품 섹션 */}
        <section className="category-products-section">
          <div className="category-layout">
            {/* 카테고리 사이드바 */}
            <aside className="category-sidebar">
              <div className="category-list">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    className={`category-item ${displayedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                  </button>
                ))}
              </div>
            </aside>

            {/* 메인 상품 그리드 */}
            <div className="category-products-main">
              <div className="category-header">
                <h2 className="category-title">
                  {CATEGORIES.find(c => c.id === displayedCategory)?.name} 상품
                </h2>
              </div>
              <div className="products-grid">
                {isLoading && <LoadingSpinner />}
                {!isLoading && currentProducts.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', gridColumn: '1 / -1' }}>
                    상품이 없습니다.
                  </div>
                )}
                {currentProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="product-card"
                    onClick={(e) => {
                      // 장바구니 버튼 클릭 시에는 상세 페이지로 이동하지 않음
                      if ((e.target as HTMLElement).closest('.add-to-cart-btn')) {
                        return
                      }
                      navigate(`/products/${product.id}`)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-image-small">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        product.name.charAt(0)
                      )}
                    </div>
                    <h3 className="product-name-small">
                      {product.name}
                    </h3>
                    <div className="product-price-small">{product.price.toLocaleString()}원</div>
                    <div className="product-rating-small">
                      {'★'.repeat(Math.floor(product.averageRating || 0))} ({product.reviewCount})
                    </div>
                    <button 
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(product)
                      }}
                    >
                      장바구니
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 관심 있을 만한 상품 섹션 */}
        <section className="special-deals-section">
          <div className="section-header">
            <h2 className="section-title">관심 있을 만한 상품</h2>
            <div className="page-indicator">
              {totalRecommendedPages > 0 ? `${recommendedPage}/${totalRecommendedPages}` : '0/0'}
            </div>
          </div>
          <div className="special-deals-container">
            <button 
              className="nav-arrow nav-arrow-left" 
              onClick={handleRecommendedPrev}
              disabled={recommendedPage === 1 || totalRecommendedPages === 0 || isRecommendedTransitioning}
            >
              ‹
            </button>
            <div className="special-deals-list-wrapper">
              <div 
                className={`special-deals-list ${isRecommendedTransitioning ? 'transitioning' : ''}`}
                style={{ 
                  transform: `translateX(-${(recommendedPage - 1) * 100}%)`
                }}
              >
                {recommendedProducts.length === 0 && !isLoading && (
                  <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>상품이 없습니다.</div>
                )}
                {Array.from({ length: totalRecommendedPages }).map((_, pageIndex) => {
                  const pageProducts = recommendedProducts.slice(
                    pageIndex * ITEMS_PER_PAGE,
                    (pageIndex + 1) * ITEMS_PER_PAGE
                  )
                  return (
                    <div key={pageIndex} className="special-deals-page">
                      {pageProducts.map((product) => (
                        <div 
                          key={product.id} 
                          className="special-product-card"
                          onClick={() => navigate(`/products/${product.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="product-badge">추천</div>
                          <div className="product-image">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} />
                            ) : (
                              product.name.charAt(0)
                            )}
                          </div>
                          <h3 className="product-title">
                            {product.name}
                          </h3>
                          <div className="product-price">{product.price.toLocaleString()}원</div>
                          <div className="product-rating">
                            {'★'.repeat(Math.floor(product.averageRating || 0))} ({(product.reviewCount || 0).toLocaleString()})
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
            <button 
              className="nav-arrow nav-arrow-right" 
              onClick={handleRecommendedNext}
              disabled={recommendedPage === totalRecommendedPages || totalRecommendedPages === 0 || isRecommendedTransitioning}
            >
              ›
            </button>
          </div>
        </section>
      </div>

      <CartButton />
    </div>
  )
}

export default HomePage
