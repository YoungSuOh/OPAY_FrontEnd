import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { refreshAccessToken } from '../utils/api'
import AuthModal from './AuthModal'
import './Header.css'

interface HeaderProps {
  showSearch?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  showQButton?: boolean
}

const Header = ({ 
  showSearch = true, 
  searchQuery: externalSearchQuery,
  onSearchChange,
  showQButton = false 
}: HeaderProps) => {
  const navigate = useNavigate()
  const { isLoggedIn, setAuth, accessToken } = useAuthStore()
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Access Token 자동 갱신 (만료 전)
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      const tokenExpiration = 60 * 60 * 1000 // 1시간
      const refreshInterval = tokenExpiration - 5 * 60 * 1000 // 만료 5분 전 갱신

      const interval = setInterval(async () => {
        try {
          const response = await refreshAccessToken()
          setAuth(response)
        } catch (error) {
          console.error('토큰 갱신 실패:', error)
        }
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [isLoggedIn, accessToken, setAuth])

  // 외부에서 searchQuery를 제어하는 경우와 내부에서 제어하는 경우 모두 지원
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery
  const setSearchQuery = onSearchChange || setInternalSearchQuery

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  return (
    <>
      <div className="product-header">
        <div className="header-content">
          <h1
            className="page-logo"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            OPAY
          </h1>
          {showSearch && (
            <div className="search-bar-container">
              <input
                type="text"
                className="main-search-input"
                placeholder="상품을 검색하세요"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button className="search-btn">🔍</button>
              {searchQuery && (
                <button className="clear-btn" onClick={handleClearSearch}>
                  ✕
                </button>
              )}
              {showQButton && (
                <button className="q-btn">Q</button>
              )}
            </div>
          )}
          <div className="header-nav">
            <button
              className="nav-icon-btn"
              onClick={() => navigate('/my-shop')}
            >
              마이쇼핑
            </button>
            <button className="nav-icon-btn" onClick={() => navigate('/cart')}>
              장바구니
            </button>
            <button
              className="nav-icon-btn auth-btn"
              onClick={() => setIsAuthModalOpen(true)}
            >
              {isLoggedIn ? '로그아웃' : '로그인'}
            </button>
          </div>
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}

export default Header
