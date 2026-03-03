import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { refreshAccessToken } from '../utils/api'
import { debounce } from '../utils/debounce'
import AuthModal from './AuthModal'
import Toast from './Toast'
import './Header.css'

interface HeaderProps {
  showSearch?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onSearchSubmit?: (query: string) => void
  showQButton?: boolean
  onLogoutSuccess?: () => void
}

const Header = ({ 
  showSearch = true, 
  searchQuery: externalSearchQuery,
  onSearchChange,
  onSearchSubmit,
  showQButton = false,
  onLogoutSuccess
}: HeaderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, setAuth, accessToken } = useAuthStore()
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showLogoutToast, setShowLogoutToast] = useState(false)

  // 페이지 로드 시 및 경로 변경 시 로그아웃 토스트 확인
  useEffect(() => {
    const shouldShowLogoutToast = sessionStorage.getItem('showLogoutToast')
    if (shouldShowLogoutToast === 'true') {
      // 플래그 즉시 제거
      sessionStorage.removeItem('showLogoutToast')
      
      // 현재 경로가 '/'이면 즉시 토스트 표시
      if (location.pathname === '/') {
        setShowLogoutToast(true)
        setTimeout(() => {
          setShowLogoutToast(false)
        }, 2000)
      } else {
        // 다른 페이지에서는 리다이렉트 완료 후 토스트 표시
        setTimeout(() => {
          setShowLogoutToast(true)
          setTimeout(() => {
            setShowLogoutToast(false)
          }, 2000)
        }, 100)
      }
    }
  }, [location.pathname]) // location.pathname을 dependency에 추가

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

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [setSearchQuery])

  const handleSearchSubmit = useCallback(() => {
    const q = (externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery).trim()
    if (onSearchSubmit) {
      onSearchSubmit(q)
    } else {
      navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
    }
  }, [externalSearchQuery, internalSearchQuery, onSearchSubmit, navigate])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearchSubmit()
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
                onKeyDown={handleSearchKeyDown}
              />
              <button type="button" className="search-btn" onClick={handleSearchSubmit} aria-label="검색">
                🔍
              </button>
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
        onLogoutSuccess={() => {
          setIsAuthModalOpen(false)
          // 로그아웃 플래그 설정 (ConfirmModal이 나타나지 않도록)
          sessionStorage.setItem('is_logging_out', 'true')
          
          // 현재 경로에 따라 다르게 처리
          if (location.pathname === '/') {
            // HomePage에서 로그아웃: 토스트 즉시 표시
            setShowLogoutToast(true)
            setTimeout(() => {
              setShowLogoutToast(false)
            }, 2000)
          } else {
            // 다른 페이지에서 로그아웃: 플래그 저장 후 리다이렉트
            sessionStorage.setItem('showLogoutToast', 'true')
            // 토스트를 먼저 보여주기 위해 약간의 지연 후 리다이렉트
            setTimeout(() => {
              navigate('/')
            }, 300) // 300ms 지연으로 토스트가 보이도록
          }
          
          // 외부 콜백도 호출 (필요한 경우)
          if (onLogoutSuccess) {
            onLogoutSuccess()
          }
        }}
      />
      <Toast
        message="로그아웃되었습니다"
        isVisible={showLogoutToast}
        onClose={() => setShowLogoutToast(false)}
      />
    </>
  )
}

export default Header
