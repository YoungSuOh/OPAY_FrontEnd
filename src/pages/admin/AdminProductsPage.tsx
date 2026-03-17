import { useEffect, useState } from 'react'
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getCategories,
  uploadAdminProductImage,
  Product,
  ProductListResponse,
} from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import './AdminLayout.css'

export default function AdminProductsPage() {
  const [data, setData] = useState<ProductListResponse | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '' })
  const [imageUploading, setImageUploading] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminProducts({ keyword: searchKeyword || undefined, page, size: 10 })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : '조회 실패'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, searchKeyword])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchKeyword(keyword)
    setPage(0)
  }

  const openCreate = () => {
    setForm({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '' })
    setEditing(null)
    setModal('create')
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      stock: String(p.stock ?? 0),
      category: p.category || '',
      imageUrl: p.imageUrl || '',
    })
    setModal('edit')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        category: form.category || undefined,
        imageUrl: form.imageUrl || undefined,
      }
      if (editing) {
        await updateAdminProduct(Number(editing.id), payload)
      } else {
        await createAdminProduct(payload)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 상품을 삭제하시겠습니까?')) return
    try {
      await deleteAdminProduct(Number(id))
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패')
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다 (JPEG, PNG, GIF, WEBP).')
      return
    }
    setError('')
    setImageUploading(true)
    try {
      const productId = editing ? Number(editing.id) : undefined
      const { imageUrl } = await uploadAdminProductImage(file, productId)
      setForm((f) => ({ ...f, imageUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 업로드 실패')
    } finally {
      setImageUploading(false)
      e.target.value = ''
    }
  }

  if (loading && !data) return <LoadingSpinner />

  return (
    <>
      <div className="admin-card">
        <h3>상품 관리</h3>
        <form className="admin-search-form" onSubmit={handleSearch}>
          <div className="form-group">
            <label>상품명</label>
            <input
              type="text"
              placeholder="상품명 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <button type="submit" className="admin-btn-primary">검색</button>
          <button type="button" className="admin-btn-primary" onClick={openCreate}>상품 등록</button>
        </form>
        {error && <p className="admin-error">{error}</p>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>상품명</th>
                <th>가격</th>
                <th>재고</th>
                <th>카테고리</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {(data?.products ?? []).map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{Number(p.price).toLocaleString()}원</td>
                  <td>{p.stock}</td>
                  <td>{p.category || '-'}</td>
                  <td className="actions">
                    <button type="button" className="admin-btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openEdit(p)}>수정</button>
                    <button type="button" className="btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(p.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="pagination">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>이전</button>
            <span>{page + 1} / {data.totalPages}</span>
            <button type="button" disabled={!data.hasNext} onClick={() => setPage((p) => p + 1)}>다음</button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModal(null)}>
          <div className="admin-card" style={{ maxWidth: '480px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? '상품 수정' : '상품 등록'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>상품명</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>설명</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="form-row">
                <label>가격</label>
                <input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>재고</label>
                <input type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>카테고리</label>
                <input list="categories" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
                <datalist id="categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="form-row">
                <label>상품 이미지</label>
                <div className="admin-product-image-upload">
                  {form.imageUrl ? (
                    <div className="admin-product-image-preview">
                      <img src={form.imageUrl} alt="미리보기" />
                      <span className="admin-image-hint">아래에서 새 이미지로 변경할 수 있습니다.</span>
                    </div>
                  ) : (
                    <p className="admin-image-placeholder">이미지를 선택하면 S3에 업로드됩니다.</p>
                  )}
                  <label className="admin-btn-secondary" style={{ display: 'inline-block', marginTop: '0.5rem', cursor: 'pointer' }}>
                    {imageUploading ? '업로드 중...' : '이미지 선택'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      disabled={imageUploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary">저장</button>
                <button type="button" className="secondary" onClick={() => setModal(null)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
