import { useState, useEffect } from 'react'
import { ShippingAddress } from '../types'
import Button from './Button'
import './AddressModal.css'

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  addresses: ShippingAddress[]
  selectedAddressId?: string
  onSelectAddress: (addressId: string) => void
  onAddAddress: (address: Omit<ShippingAddress, 'id' | 'createdAt'>) => void
  onSetDefault: (addressId: string) => void
}

const AddressModal = ({
  isOpen,
  onClose,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
  onSetDefault,
}: AddressModalProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newAddress, setNewAddress] = useState({
    name: '',
    recipient: '',
    phone: '',
    address: '',
    detailAddress: '',
    postalCode: '',
    isDefault: false,
  })

  useEffect(() => {
    if (!isOpen) {
      setIsAdding(false)
      setNewAddress({
        name: '',
        recipient: '',
        phone: '',
        address: '',
        detailAddress: '',
        postalCode: '',
        isDefault: false,
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  // Daum 우편번호 API (회원가입과 동일)
  const handleSearchAddress = () => {
    if (typeof window === 'undefined' || !(window as any).daum) {
      alert('우편번호 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        const address = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress
        setNewAddress((prev) => ({
          ...prev,
          address,
          postalCode: data.zonecode || prev.postalCode,
        }))
        const detailInput = document.getElementById('address-modal-detail-address') as HTMLInputElement
        if (detailInput) detailInput.focus()
      },
    }).open()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddAddress(newAddress)
    setIsAdding(false)
    setNewAddress({
      name: '',
      recipient: '',
      phone: '',
      address: '',
      detailAddress: '',
      postalCode: '',
      isDefault: false,
    })
  }

  const defaultAddress = addresses.find((addr) => addr.isDefault)
  const otherAddresses = addresses.filter((addr) => !addr.isDefault)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>배송지 선택</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {!isAdding ? (
            <>
              {/* 기본 배송지 */}
              {defaultAddress && (
                <div className="address-section">
                  <h3 className="address-section-title">기본 배송지</h3>
                  <div
                    className={`address-item ${selectedAddressId === defaultAddress.id ? 'selected' : ''} default`}
                    onClick={() => onSelectAddress(defaultAddress.id)}
                  >
                    <div className="address-item-header">
                      <div className="address-item-info">
                        <span className="address-name">{defaultAddress.name}</span>
                        <span className="address-badge default-badge">기본</span>
                      </div>
                      <input
                        type="radio"
                        checked={selectedAddressId === defaultAddress.id}
                        onChange={() => onSelectAddress(defaultAddress.id)}
                      />
                    </div>
                    <div className="address-item-body">
                      <div className="address-recipient">
                        받는 분: {defaultAddress.recipient} ({defaultAddress.phone})
                      </div>
                      <div className="address-full">
                        ({defaultAddress.postalCode}) {defaultAddress.address}{' '}
                        {defaultAddress.detailAddress}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 다른 배송지 */}
              {otherAddresses.length > 0 && (
                <div className="address-section">
                  <h3 className="address-section-title">다른 배송지</h3>
                  <div className="address-list">
                    {otherAddresses.map((address) => (
                      <div
                        key={address.id}
                        className={`address-item ${selectedAddressId === address.id ? 'selected' : ''}`}
                        onClick={() => onSelectAddress(address.id)}
                      >
                        <div className="address-item-header">
                          <div className="address-item-info">
                            <span className="address-name">{address.name}</span>
                          </div>
                          <input
                            type="radio"
                            checked={selectedAddressId === address.id}
                            onChange={() => onSelectAddress(address.id)}
                          />
                        </div>
                        <div className="address-item-body">
                          <div className="address-recipient">
                            받는 분: {address.recipient} ({address.phone})
                          </div>
                          <div className="address-full">
                            ({address.postalCode}) {address.address}{' '}
                            {address.detailAddress}
                          </div>
                        </div>
                        <div className="address-item-actions">
                          <button
                            className="set-default-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSetDefault(address.id)
                            }}
                          >
                            기본 배송지로 설정
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 배송지 추가 버튼 */}
              <div className="modal-footer">
                <Button
                  variant="primary"
                  onClick={() => setIsAdding(true)}
                  fullWidth
                >
                  + 배송지 추가
                </Button>
              </div>
            </>
          ) : (
            <form className="address-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>배송지 이름</label>
                <input
                  type="text"
                  value={newAddress.name}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, name: e.target.value })
                  }
                  placeholder="예: 집, 회사"
                  required
                />
              </div>
              <div className="form-group">
                <label>받는 분</label>
                <input
                  type="text"
                  value={newAddress.recipient}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, recipient: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>연락처</label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, phone: e.target.value })
                  }
                  placeholder="010-1234-5678"
                  required
                />
              </div>
              <div className="form-group">
                <label>주소</label>
                <div className="address-search-container">
                  <button
                    type="button"
                    className="address-search-btn"
                    onClick={handleSearchAddress}
                  >
                    주소 검색
                  </button>
                  <input
                    type="text"
                    value={newAddress.address}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, address: e.target.value })
                    }
                    placeholder="주소 검색 버튼을 눌러 주소를 입력하세요"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>우편번호</label>
                <input
                  type="text"
                  value={newAddress.postalCode}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, postalCode: e.target.value })
                  }
                  placeholder="주소 검색 시 자동 입력"
                />
              </div>
              <div className="form-group">
                <label>상세주소</label>
                <input
                  id="address-modal-detail-address"
                  type="text"
                  value={newAddress.detailAddress}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, detailAddress: e.target.value })
                  }
                  placeholder="동/호수 등"
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newAddress.isDefault}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, isDefault: e.target.checked })
                    }
                  />
                  기본 배송지로 설정
                </label>
              </div>
              <div className="form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAdding(false)}
                >
                  취소
                </Button>
                <Button type="submit" variant="primary">
                  저장
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddressModal
