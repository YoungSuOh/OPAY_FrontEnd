/**
 * 결제 처리 중 페이지 (Payment Processing)
 *
 * 용도:
 * - 주문 확인 → "결제하기" 클릭 후, 결제 승인 API(approvePayment)를 호출하는 동안
 *   사용자에게 "결제 처리 중" 로딩 화면을 보여주기 위함.
 * - 잔액 부족 등 사전 검증은 주문 확인(OrderReview) 단계에서 처리하고,
 *   이 페이지는 "실제 결제 승인 요청이 서버에 전달된 뒤, 결과를 기다리는 구간"으로만 사용하는 것이 좋음.
 *
 * 확장 제안:
 * - PG(토스/카카오/네이버) 리다이렉트 결제 시, PG사에서 돌아온 후 "결제 완료 처리 중" 대기 화면으로 활용.
 * - 비동기 결제(카드사 처리 지연 등) 시 "결제 상태 확인 중" 안내 후 /payment-status-check 로 이어지도록 활용.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentStore } from '../store/paymentStore'
import { useCartStore } from '../store/cartStore'
import { approvePayment } from '../utils/api'
import { useBlockBackNavigation, useBlockRefresh } from '../utils/blockNavigation'
import PageContainer from '../components/PageContainer'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './PaymentProcessingPage.css'

const PaymentProcessingPage = () => {
  const navigate = useNavigate()
  const { currentOrder, setPaymentResult, setProcessing } = usePaymentStore()
  const { clearCart, loadCartItems } = useCartStore()
  const [error, setError] = useState<string | null>(null)

  // 뒤로가기 및 새로고침 방지
  useBlockBackNavigation(true)
  useBlockRefresh(true)

  useEffect(() => {
    if (!currentOrder || !currentOrder.paymentId || !currentOrder.idempotencyKey) {
      setProcessing(false)
      navigate('/order-review', { replace: true })
      return
    }

    const processPayment = async () => {
      try {
        const result = await approvePayment(
          currentOrder.paymentId!,
          currentOrder.idempotencyKey!
        )

        setPaymentResult(result)
        setProcessing(false)

        if (result.status === 'SUCCESS') {
          try {
            await clearCart()
          } catch (err) {
            console.error('결제 후 장바구니 비우기 실패:', err)
          }
          try {
            await loadCartItems()
          } catch {
            // no-op
          }
          navigate('/payment-success')
        } else if (result.status === 'FAIL') {
          navigate('/payment-fail')
        } else if (result.status === 'UNKNOWN') {
          navigate('/payment-status-check')
        }
      } catch (err) {
        console.error('결제 처리 실패:', err)
        setError('결제 처리 중 오류가 발생했습니다.')
        setProcessing(false)
      }
    }

    processPayment()
  }, [currentOrder, navigate, setPaymentResult, setProcessing])

  if (error) {
    return (
      <PageContainer>
        <Header showSearch={false} showQButton={false} />
        <div className="payment-processing">
          <div className="error-message">{error}</div>
          <button
            type="button"
            className="payment-processing-back-btn"
            onClick={() => navigate('/order-review')}
          >
            주문 확인으로 돌아가기
          </button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Header showSearch={false} showQButton={false} />
      <div className="payment-processing">
        <LoadingSpinner />
        <h2 className="processing-title">결제 처리 중입니다</h2>
        <p className="processing-message">
          잠시만 기다려주세요. 결제가 진행 중입니다.
        </p>
        <div className="warning-box">
          <p className="warning-text">
            ⚠️ 결제가 완료될 때까지 페이지를 닫지 마세요.
          </p>
          <p className="warning-text">
            새로고침이나 뒤로가기를 하시면 결제가 중단될 수 있습니다.
          </p>
        </div>
      </div>
    </PageContainer>
  )
}

export default PaymentProcessingPage
