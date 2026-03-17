import { useEffect, useState } from 'react'
import { getAdminMembers, getAdminMemberDetail, updateAdminMember, AdminMemberItem, AdminMemberDetail } from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import './AdminLayout.css'

export default function AdminMembersPage() {
  const [list, setList] = useState<{ members: AdminMemberItem[]; totalPages: number; currentPage: number; hasNext: boolean } | null>(null)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<AdminMemberDetail | null>(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '' })

  const loadList = () => {
    setLoading(true)
    getAdminMembers(searchKeyword || undefined, page, 10)
      .then((res) => setList({ members: res.members, totalPages: res.totalPages, currentPage: res.currentPage, hasNext: res.hasNext }))
      .catch((e) => setError(e instanceof Error ? e.message : '조회 실패'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadList()
  }, [page, searchKeyword])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchKeyword(keyword)
    setPage(0)
  }

  const openDetail = (id: number) => {
    getAdminMemberDetail(id).then((d) => {
      setDetail(d)
      setEditForm({ name: d.name, phone: d.phone || '' })
    }).catch(() => setError('상세 조회 실패'))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detail) return
    try {
      await updateAdminMember(detail.id, { name: editForm.name, phone: editForm.phone || undefined })
      setDetail(null)
      loadList()
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정 실패')
    }
  }

  if (loading && !list) return <LoadingSpinner />

  return (
    <>
      <div className="admin-card">
        <h3>회원 관리</h3>
        <form className="admin-search-form" onSubmit={handleSearch}>
          <div className="form-group">
            <label>이메일 / 이름</label>
            <input type="text" placeholder="이메일 또는 이름 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <button type="submit" className="admin-btn-primary">검색</button>
        </form>
        {error && <p className="admin-error">{error}</p>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>이메일</th>
                <th>이름</th>
                <th>역할</th>
                <th>가입일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(list?.members ?? []).map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.email}</td>
                  <td>{m.name}</td>
                  <td>{m.role}</td>
                  <td>{m.createdAt?.slice(0, 10)}</td>
                  <td className="actions"><button type="button" className="admin-btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openDetail(m.id)}>상세</button></td>
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
          <div className="admin-card" style={{ maxWidth: '400px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3>회원 상세</h3>
            <p>이메일: {detail.email}</p>
            <p>지갑 잔액: {detail.walletBalance?.toLocaleString()}원</p>
            <p>주문 수: {detail.orderCount}</p>
            <form onSubmit={handleUpdate}>
              <div className="form-row">
                <label>이름</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>연락처</label>
                <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="submit" className="primary">저장</button>
                <button type="button" className="secondary" onClick={() => setDetail(null)}>닫기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
