import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import './AdminLayout.css'

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h1>OPay 관리자</h1>
        <nav>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
            대시보드
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'active' : '')}>
            상품 관리
          </NavLink>
          <NavLink to="/admin/members" className={({ isActive }) => (isActive ? 'active' : '')}>
            회원 관리
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
            주문 관리
          </NavLink>
          <NavLink to="/admin/payments" className={({ isActive }) => (isActive ? 'active' : '')}>
            결제 내역
          </NavLink>
          <NavLink to="/admin/refunds" className={({ isActive }) => (isActive ? 'active' : '')}>
            환불 관리
          </NavLink>
        </nav>
      </aside>
      <main className="admin-main">
        <div className="admin-header">
          <h2>관리자</h2>
          <div className="admin-user">
            <span>{user?.email}</span>
            <button type="button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
