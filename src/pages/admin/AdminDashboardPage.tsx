import { useEffect, useState } from 'react'
import { getAdminDashboard, AdminDashboardStats } from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import '../admin/AdminLayout.css'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminDashboard()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : '조회 실패'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <p className="admin-error">{error}</p>
  if (!stats) return null

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="label">전체 회원</div>
          <div className="value">{stats.totalUsers.toLocaleString()}</div>
        </div>
        <div className="admin-stat">
          <div className="label">전체 상품</div>
          <div className="value">{stats.totalProducts.toLocaleString()}</div>
        </div>
        <div className="admin-stat">
          <div className="label">전체 주문</div>
          <div className="value">{stats.totalOrders.toLocaleString()}</div>
        </div>
        <div className="admin-stat">
          <div className="label">결제 완료</div>
          <div className="value">{stats.totalPaymentsSuccess.toLocaleString()}</div>
        </div>
        <div className="admin-stat">
          <div className="label">환불 대기</div>
          <div className="value">{stats.pendingRefundCount.toLocaleString()}</div>
        </div>
      </div>
    </>
  )
}
