import { useEffect, useState } from 'react'
import { getAdminPayments, AdminPaymentItem } from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import './AdminLayout.css'

export default function AdminPaymentsPage() {
  const [list, setList] = useState<{ payments: AdminPaymentItem[]; totalPages: number; currentPage: number; hasNext: boolean } | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState({ orderId: '', userId: '', keyword: '' })
  const [appliedSearch, setAppliedSearch] = useState<{ orderId?: number; userId?: number; keyword?: string }>({})

  const load = () => {
    setLoading(true)
    const params =
      appliedSearch.orderId != null || appliedSearch.userId != null || (appliedSearch.keyword && appliedSearch.keyword.trim())
        ? {
            orderId: appliedSearch.orderId,
            userId: appliedSearch.userId,
            keyword: appliedSearch.keyword?.trim() || undefined,
          }
        : undefined
    getAdminPayments(page, 10, params)
      .then((res) => setList({ payments: res.payments, totalPages: res.totalPages, currentPage: res.currentPage, hasNext: res.hasNext }))
      .catch((e) => setError(e instanceof Error ? e.message : '조회 실패'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, appliedSearch])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedSearch({
      orderId: search.orderId.trim() ? Number(search.orderId) : undefined,
      userId: search.userId.trim() ? Number(search.userId) : undefined,
      keyword: search.keyword.trim() || undefined,
    })
    setPage(0)
  }

  const clearSearch = () => {
    setSearch({ orderId: '', userId: '', keyword: '' })
    setAppliedSearch({})
    setPage(0)
  }

  if (loading && !list) return <LoadingSpinner />

  return (
    <div className="admin-card">
      <h3>결제 내역 검색</h3>
      <form className="admin-search-form" onSubmit={handleSearchSubmit}>
        <div className="form-group">
          <label>주문 ID</label>
          <input
            type="text"
            placeholder="주문 ID"
            value={search.orderId}
            onChange={(e) => setSearch((s) => ({ ...s, orderId: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>회원 ID</label>
          <input
            type="text"
            placeholder="회원 ID"
            value={search.userId}
            onChange={(e) => setSearch((s) => ({ ...s, userId: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>회원명 / 이메일</label>
          <input
            type="text"
            placeholder="이름 또는 이메일"
            value={search.keyword}
            onChange={(e) => setSearch((s) => ({ ...s, keyword: e.target.value }))}
          />
        </div>
        <button type="submit" className="admin-btn-primary">검색</button>
        <button type="button" className="admin-btn-secondary" onClick={clearSearch}>초기화</button>
      </form>

      {error && <p className="admin-error">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>결제ID</th>
              <th>주문ID</th>
              <th>회원(ID)</th>
              <th>금액</th>
              <th>수단</th>
              <th>상태</th>
              <th>승인일시</th>
            </tr>
          </thead>
          <tbody>
            {(list?.payments ?? []).map((p) => (
              <tr key={p.paymentId}>
                <td>{p.paymentId}</td>
                <td>{p.orderId}</td>
                <td>{p.userEmail} ({p.userId})</td>
                <td>{p.amount?.toLocaleString()}원</td>
                <td>{p.method}</td>
                <td>{p.status}</td>
                <td>{p.approvedAt ? p.approvedAt.slice(0, 16) : '-'}</td>
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
