import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentStore } from '../store/paymentStore'
import { approvePayment } from '../utils/api'
import { useBlockBackNavigation, useBlockRefresh } from '../utils/blockNavigation'
import PageContainer from '../components/PageContainer'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './PaymentProcessingPage.css'

const PaymentProcessingPage = () => {
  const navigate = useNavigate()
  const { currentOrder, setPaymentResult, setProcessing } = usePaymentStore()
  const [error, setError] = useState<string | null>(null)

  // 뒤로가기 및 새로고침 방지
  useBlockBackNavigation(true)
  useBlockRefresh(true)

  useEffect(() => {
    // UI 확인을 위해 샘플 데이터 사용
    if (!currentOrder || !currentOrder.paymentId || !currentOrder.idempotencyKey) {
      // 샘플 데이터로 currentOrder 설정 (API 호출은 하지 않음)
      return
    }

    const processPayment = async () => {
      try {
        // 결제 승인 API 호출
        const result = await approvePayment(
          currentOrder.paymentId!,
          currentOrder.idempotencyKey!
        )

        setPaymentResult(result)
        setProcessing(false)

        // 결과에 따라 페이지 이동
        if (result.status === 'SUCCESS') {
          navigate('/payment-success')
        } else if (result.status === 'FAIL') {
          navigate('/payment-fail')
        } else if (result.status === 'UNKNOWN') {
          navigate('/payment-status-check')
        }
      } catch (err) {
        console.error('결제 처리 실패:', err)
        setError('결제 처리 중 오류가 발생했습니다. (UI 확인 모드)')
        
        // 오류 발생 시에도 상태 확인 페이지로 이동하지 않고 그대로 표시
        // navigate('/payment-status-check')
      }
    }

    processPayment()
  }, [currentOrder, navigate, setPaymentResult, setProcessing])

  if (error) {
    return (
      <PageContainer>
        <div className="payment-processing">
          <div className="error-message">{error}</div>
          <div className="status-message">
            결제 상태를 확인하는 페이지로 이동합니다...
          </div>
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
