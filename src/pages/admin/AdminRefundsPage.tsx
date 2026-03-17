import { useEffect, useState } from 'react'
import { getAdminRefunds, approveAdminRefund, rejectAdminRefund, AdminRefundItem } from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import './AdminLayout.css'

export default function AdminRefundsPage() {
  const [list, setList] = useState<{ refunds: AdminRefundItem[]; totalPages: number; currentPage: number; hasNext: boolean } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    getAdminRefunds(statusFilter || undefined, page, 10)
      .then((res) => setList({ refunds: res.refunds, totalPages: res.totalPages, currentPage: res.currentPage, hasNext: res.hasNext }))
      .catch((e) => setError(e instanceof Error ? e.message : '조회 실패'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, statusFilter])

  const handleApprove = async (id: number) => {
    if (!window.confirm('이 환불 요청을 승인하시겠습니까? 주문이 취소되고 재고가 복구됩니다.')) return
    try {
      await approveAdminRefund(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '승인 실패')
    }
  }

  const handleReject = async (id: number) => {
    if (!window.confirm('이 환불 요청을 거절하시겠습니까?')) return
    try {
      await rejectAdminRefund(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '거절 실패')
    }
  }

  if (loading && !list) return <LoadingSpinner />

  return (
    <div className="admin-card">
      <h3>환불 관리</h3>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button type="button" className={statusFilter === '' ? 'admin-btn-primary' : 'admin-btn-secondary'} onClick={() => setStatusFilter('')}>전체</button>
        <button type="button" className={statusFilter === 'PENDING' ? 'admin-btn-primary' : 'admin-btn-secondary'} onClick={() => setStatusFilter('PENDING')}>대기</button>
        <button type="button" className={statusFilter === 'APPROVED' ? 'admin-btn-primary' : 'admin-btn-secondary'} onClick={() => setStatusFilter('APPROVED')}>승인</button>
        <button type="button" className={statusFilter === 'REJECTED' ? 'admin-btn-primary' : 'admin-btn-secondary'} onClick={() => setStatusFilter('REJECTED')}>거절</button>
      </div>
      {error && <p className="admin-error">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>주문ID</th>
              <th>금액</th>
              <th>사유</th>
              <th>상태</th>
              <th>요청자</th>
              <th>요청일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {(list?.refunds ?? []).map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.orderId}</td>
                <td>{r.amount?.toLocaleString()}원</td>
                <td>{r.reason || '-'}</td>
                <td>{r.status}</td>
                <td>{r.requestedByEmail}</td>
                <td>{r.createdAt?.slice(0, 16)}</td>
                <td className="actions">
                  {r.status === 'PENDING' && (
                    <>
                      <button type="button" className="admin-btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleApprove(r.id)}>승인</button>
                      <button type="button" className="btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleReject(r.id)}>거절</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list && list.totalPages > 1 && (
        <div className="pagination">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>이전</button>
          <span>{page + 1} / {list.totalPages}</span>
          <button type="button" disabled={!list.hasNext} onClick={() => setPage((p) => p + 1)}>다음</button>
        </div>
      )}
    </div>
  )
}
