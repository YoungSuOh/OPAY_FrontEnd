import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as apiLogin, signup as apiSignup, logout as apiLogout, AuthResponse } from '../utils/api'

interface AuthState {
  isLoggedIn: boolean
  user: {
    id: string
    email: string
    name: string
  } | null
  accessToken: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (email: string, password: string, name: string, phone?: string, shippingAddress?: {
    recipient?: string
    phone?: string
    address?: string
    detailAddress?: string
    postalCode?: string
  }) => Promise<void>
  setAuth: (authResponse: AuthResponse) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      accessToken: null,

      login: async (email, password) => {
        try {
          const response = await apiLogin({ email, password })
          set({
            isLoggedIn: true,
            user: {
              id: response.userId.toString(),
              email: response.email,
              name: response.name,
            },
            accessToken: response.accessToken,
          })
          localStorage.setItem('accessToken', response.accessToken)
        } catch (error) {
          console.error('로그인 실패:', error)
          throw error
        }
      },

      logout: async () => {
        try {
          await apiLogout()
        } catch (error) {
          console.error('로그아웃 실패:', error)
        } finally {
          set({
            isLoggedIn: false,
            user: null,
            accessToken: null,
          })
          localStorage.removeItem('accessToken')
        }
      },

      signup: async (email, password, name, phone, shippingAddress) => {
        try {
          const response = await apiSignup({
            email,
            password,
            name,
            phone,
            shippingRecipient: shippingAddress?.recipient,
            shippingPhone: shippingAddress?.phone,
            shippingAddress: shippingAddress?.address,
            shippingDetailAddress: shippingAddress?.detailAddress,
            shippingPostalCode: shippingAddress?.postalCode,
          })
          set({
            isLoggedIn: true,
            user: {
              id: response.userId.toString(),
              email: response.email,
              name: response.name,
            },
            accessToken: response.accessToken,
          })
          localStorage.setItem('accessToken', response.accessToken)
        } catch (error) {
          console.error('회원가입 실패:', error)
          throw error
        }
      },

      setAuth: (authResponse) => {
        set({
          isLoggedIn: true,
          user: {
            id: authResponse.userId.toString(),
            email: authResponse.email,
            name: authResponse.name,
          },
          accessToken: authResponse.accessToken,
        })
        localStorage.setItem('accessToken', authResponse.accessToken)
      },

      clearAuth: () => {
        set({
          isLoggedIn: false,
          user: null,
          accessToken: null,
        })
        localStorage.removeItem('accessToken')
      },
    }),
    {
      name: 'opay_auth',
    }
  )
)
