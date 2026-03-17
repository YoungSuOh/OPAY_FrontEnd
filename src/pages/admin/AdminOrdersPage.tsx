import { useEffect, useState } from 'react'
import { getAdminOrders, getAdminOrderDetail, updateAdminOrderStatus, cancelAdminOrder, AdminOrderItem } from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import './AdminLayout.css'

export default function AdminOrdersPage() {
  const [list, setList] = useState<{ orders: AdminOrderItem[]; totalPages: number; currentPage: number; hasNext: boolean } | null>(null)
  const [detail, setDetail] = useState<AdminOrderItem | null>(null)
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
    getAdminOrders(page, 10, params)
      .then((res) => setList({ orders: res.orders, totalPages: res.totalPages, currentPage: res.currentPage, hasNext: res.hasNext }))
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

  const openDetail = (id: number) => {
    getAdminOrderDetail(id).then(setDetail).catch(() => setError('상세 조회 실패'))
  }

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await updateAdminOrderStatus(orderId, status)
      setDetail(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 변경 실패')
    }
  }

  const handleCancel = async (orderId: number) => {
    if (!window.confirm('이 주문을 취소하시겠습니까? 재고가 복구됩니다.')) return
    try {
      await cancelAdminOrder(orderId)
      setDetail(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '취소 실패')
    }
  }

  if (loading && !list) return <LoadingSpinner />

  return (
    <>
      <div className="admin-card">
        <h3>주문 검색</h3>
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
                <th>주문ID</th>
                <th>회원</th>
                <th>총액</th>
                <th>결제액</th>
                <th>상태</th>
                <th>주문일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(list?.orders ?? []).map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.userName} ({o.userId})</td>
                  <td>{o.totalAmount?.toLocaleString()}원</td>
                  <td>{o.paidAmount?.toLocaleString()}원</td>
                  <td>{o.status}</td>
                  <td>{o.createdAt?.slice(0, 16)}</td>
                  <td className="actions">
                    <button type="button" className="admin-btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openDetail(o.id)}>상세</button>
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

      {detail && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div className="admin-card admin-order-detail" onClick={(e) => e.stopPropagation()}>
            <div className="order-detail-header">
              <h3 className="order-detail-title">주문 #{detail.id}</h3>
              <span className={`order-detail-badge ${detail.status}`}>{detail.status}</span>
            </div>

            <div className="order-detail-section">
              <h4>주문 정보</h4>
              <div className="order-detail-info">
                <p><strong>총 주문 금액</strong> {detail.totalAmount?.toLocaleString()}원</p>
                <p><strong>결제 금액</strong> {detail.paidAmount?.toLocaleString()}원</p>
                <p><strong>주문일시</strong> {detail.createdAt ? new Date(detail.createdAt).toLocaleString('ko-KR') : '-'}</p>
              </div>
            </div>

            <div className="order-detail-section">
              <h4>주문 회원</h4>
              <div className="order-detail-info">
                <p><strong>회원 ID</strong> {detail.userId}</p>
                <p><strong>회원명</strong> {detail.userName}</p>
              </div>
            </div>

            <div className="order-detail-section">
              <h4>주문 상품</h4>
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>상품명</th>
                    <th>수량</th>
                    <th>단가</th>
                    <th>소계</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price?.toLocaleString()}원</td>
                      <td>{item.totalPrice?.toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {detail.status !== 'CANCELLED' && detail.status !== 'DELIVERED' && (
              <div className="order-detail-actions">
                {['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'].map((s) => (
                  <button key={s} type="button" className="admin-btn-secondary" onClick={() => handleStatusChange(detail.id, s)}>{s}</button>
                ))}
                <button type="button" className="btn-danger" onClick={() => handleCancel(detail.id)}>주문 취소</button>
              </div>
            )}

            <div className="form-actions" style={{ borderTop: 'none', paddingTop: '0.5rem' }}>
              <button type="button" className="secondary" onClick={() => setDetail(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
