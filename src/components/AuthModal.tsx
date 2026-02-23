import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { checkEmailAvailability } from '../utils/api'
import Button from './Button'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogoutSuccess?: () => void
}

const AuthModal = ({ isOpen, onClose, onLogoutSuccess }: AuthModalProps) => {
  const { isLoggedIn, login, logout, signup } = useAuthStore()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [shippingRecipient, setShippingRecipient] = useState('')
  const [shippingPhone, setShippingPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingDetailAddress, setShippingDetailAddress] = useState('')
  const [shippingPostalCode, setShippingPostalCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const emailCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setIsSignup(false)
      setEmail('')
      setPassword('')
      setName('')
      setPhone('')
      setShippingRecipient('')
      setShippingPhone('')
      setShippingAddress('')
      setShippingDetailAddress('')
      setShippingPostalCode('')
      setError(null)
      setEmailError(null)
      setIsLoading(false)
      setIsCheckingEmail(false)
    }
  }, [isOpen])

  // 이메일 중복확인 (debounce)
  useEffect(() => {
    if (!isOpen || !isSignup) return

    // 이전 timeout 취소
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current)
    }

    // 이메일이 비어있거나 형식이 올바르지 않으면 중복확인 안 함
    if (!email || !email.includes('@')) {
      setEmailError(null)
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다')
      return
    }

    // 500ms 후에 중복확인 실행 (debounce)
    setIsCheckingEmail(true)
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await checkEmailAvailability(email)
        if (!result.available) {
          setEmailError(result.message || '이미 존재하는 이메일입니다')
        } else {
          setEmailError(null)
        }
      } catch (err) {
        console.error('이메일 중복확인 실패:', err)
        // 에러 발생 시 백엔드 메시지 표시
        if (err instanceof Error) {
          setEmailError(err.message)
        } else {
          setEmailError(null)
        }
      } finally {
        setIsCheckingEmail(false)
      }
    }, 500)

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current)
      }
    }
  }, [email, isSignup, isOpen])

  if (!isOpen) return null

  // 비밀번호 유효성 검사 (특수문자 포함 8자 이상)
  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-zA-Z0-9]).{8,}$/
    return passwordRegex.test(password)
  }

  // 전화번호 유효성 검사
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // 선택 사항이므로 빈 값은 유효
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    return phoneRegex.test(phone)
  }

  // 전화번호 자동 포맷팅 (하이픈 추가)
  const formatPhoneNumber = (value: string): string => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')
    
    // 11자리 제한
    const limitedNumbers = numbers.slice(0, 11)
    
    // 하이픈 자동 추가
    if (limitedNumbers.length <= 3) {
      return limitedNumbers
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handleShippingPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setShippingPhone(formatted)
  }

  // Daum 우편번호 검색
  const handleSearchAddress = () => {
    if (typeof window === 'undefined' || !(window as any).daum) {
      alert('우편번호 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        // 도로명 주소 선택 시
        if (data.userSelectedType === 'R') {
          setShippingAddress(data.roadAddress)
        } else {
          // 지번 주소 선택 시
          setShippingAddress(data.jibunAddress)
        }
        setShippingPostalCode(data.zonecode)
        // 상세주소 입력 필드에 포커스
        const detailInput = document.getElementById('shipping-detail-address') as HTMLInputElement
        if (detailInput) {
          detailInput.focus()
        }
      },
    }).open()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isLoggedIn) {
        await logout()
        onClose()
        if (onLogoutSuccess) {
          onLogoutSuccess()
        }
      } else if (isSignup) {
        // 회원가입 시 유효성 검사
        if (emailError) {
          setError('이메일을 확인해주세요.')
          setIsLoading(false)
          return
        }
        if (!validatePassword(password)) {
          setError('비밀번호는 특수문자를 포함하여 8자 이상이어야 합니다.')
          setIsLoading(false)
          return
        }
        if (!validatePhone(phone)) {
          setError('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
          setIsLoading(false)
          return
        }
        const shippingAddressData = shippingAddress
          ? {
              recipient: shippingRecipient || name,
              phone: shippingPhone || phone,
              address: shippingAddress,
              detailAddress: shippingDetailAddress,
              postalCode: shippingPostalCode,
            }
          : undefined

        await signup(email, password, name, phone || undefined, shippingAddressData)
        setIsSignup(false)
        setEmail('')
        setPassword('')
        setName('')
        setPhone('')
        setShippingRecipient('')
        setShippingPhone('')
        setShippingAddress('')
        setShippingDetailAddress('')
        setShippingPostalCode('')
        onClose()
      } else {
        await login(email, password)
        setEmail('')
        setPassword('')
        onClose()
      }
    } catch (err) {
      // 백엔드에서 온 에러 메시지 그대로 표시
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('오류가 발생했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsSignup(false)
    setEmail('')
    setPassword('')
    setName('')
    onClose()
  }

  if (!isOpen) return null

  // 로그아웃 모달
  if (isLoggedIn) {
    return (
      <div className="auth-modal-overlay" onClick={handleClose}>
        <div className="auth-modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
          <div className="auth-modal-header">
            <h2>로그아웃</h2>
            <button className="auth-modal-close-btn" onClick={handleClose}>
              ✕
            </button>
          </div>
          <div className="auth-modal-body">
            <p className="logout-message">정말 로그아웃 하시겠습니까?</p>
            <div className="auth-actions">
              <Button variant="secondary" onClick={handleClose} fullWidth>
                취소
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    await logout()
                    handleClose()
                    if (onLogoutSuccess) {
                      onLogoutSuccess()
                    }
                  } catch (err) {
                    console.error('로그아웃 실패:', err)
                  }
                }}
                fullWidth
                disabled={isLoading}
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 로그인/회원가입 모달
  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{isSignup ? '회원가입' : '로그인'}</h2>
          <button className="auth-modal-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>
        <div className="auth-modal-body">
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {isSignup && (
              <>
                <div className="form-group">
                  <label>이름</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>전화번호 (선택)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="010-1234-5678"
                    maxLength={13}
                  />
                </div>
                
                {/* 배송지 정보 (선택) */}
                <div className="shipping-section">
                  <h3 className="shipping-title">기본 배송지 (선택)</h3>
                  
                  <div className="form-group">
                    <label>수령인</label>
                    <input
                      type="text"
                      value={shippingRecipient}
                      onChange={(e) => setShippingRecipient(e.target.value)}
                      placeholder="수령인 이름"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>수령인 전화번호</label>
                    <input
                      type="tel"
                      value={shippingPhone}
                      onChange={handleShippingPhoneChange}
                      placeholder="010-1234-5678"
                      maxLength={13}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>주소</label>
                    <div className="address-search-container">
                      <input
                        type="text"
                        value={shippingPostalCode}
                        placeholder="우편번호"
                        readOnly
                        className="postal-code-input"
                      />
                      <button
                        type="button"
                        onClick={handleSearchAddress}
                        className="address-search-btn"
                      >
                        우편번호 검색
                      </button>
                    </div>
                    <input
                      type="text"
                      value={shippingAddress}
                      placeholder="주소"
                      readOnly
                      className="address-input"
                    />
                    <input
                      type="text"
                      id="shipping-detail-address"
                      value={shippingDetailAddress}
                      onChange={(e) => setShippingDetailAddress(e.target.value)}
                      placeholder="상세주소"
                      className="detail-address-input"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="form-group">
              <label>이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                required
                className={emailError ? 'input-error' : ''}
              />
              {isCheckingEmail && isSignup && (
                <span className="checking-email">확인 중...</span>
              )}
              {emailError && isSignup && (
                <span className="email-error-message">{emailError}</span>
              )}
            </div>
            <div className="form-group">
              <label>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "특수문자 포함 8자 이상" : "비밀번호를 입력하세요"}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
              {isLoading ? '처리 중...' : isSignup ? '회원가입' : '로그인'}
            </Button>
          </form>
          <div className="auth-footer">
            <button
              className="toggle-auth-btn"
              onClick={() => {
                setIsSignup(!isSignup)
                setEmail('')
                setPassword('')
                setName('')
                setPhone('')
                setShippingRecipient('')
                setShippingPhone('')
                setShippingAddress('')
                setShippingDetailAddress('')
                setShippingPostalCode('')
                setError(null)
              }}
            >
              {isSignup
                ? '이미 계정이 있으신가요? 로그인'
                : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
