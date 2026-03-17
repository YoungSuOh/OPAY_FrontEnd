import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * ADMIN 역할만 접근 가능. 비로그인 또는 일반 회원은 /admin/login으로 리다이렉트.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore()
  const location = useLocation()

  if (!accessToken || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
