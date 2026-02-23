import { useEffect, useState } from 'react'
import { usePaymentStore } from '../store/paymentStore'
import { checkPaymentStatus } from '../utils/api'
import { useBlockBackNavigation } from '../utils/blockNavigation'
import PageContainer from '../components/PageContainer'
import LoadingSpinner from '../components/LoadingSpinner'
import Header from '../components/Header'
import './PaymentStatusCheckPage.css'

const POLLING_INTERVAL = 3000 // 3초마다 조회
const MAX_POLLING_ATTEMPTS = 20 // 최대 20회 시도 (약 1분)

const PaymentStatusCheckPage = () => {
  const { currentOrder, setPaymentResult } = usePaymentStore()
  const [pollingCount, setPollingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // 뒤로가기 방지
  useBlockBackNavigation(true)

  useEffect(() => {
    if (!currentOrder || !currentOrder.paymentId) {
      return
    }

    let pollingInterval: ReturnType<typeof setInterval> | null = null
    let isMounted = true

    const pollPaymentStatus = async () => {
      if (pollingCount >= MAX_POLLING_ATTEMPTS) {
        setError('결제 상태 확인 시간이 초과되었습니다. 고객센터로 문의해주세요.')
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }
        return
      }

      try {
        const result = await checkPaymentStatus(currentOrder!.paymentId!)

        if (!isMounted) return

        setPaymentResult(result)
        setPollingCount((prev) => prev + 1)

        // 상태에 따라 페이지 이동
        // if (result.status === 'SUCCESS') {
        //   if (pollingInterval) {
        //     clearInterval(pollingInterval)
        //   }
        //   navigate('/payment-success')
        // } else if (result.status === 'FAIL') {
        //   if (pollingInterval) {
        //     clearInterval(pollingInterval)
        //   }
        //   navigate('/payment-fail')
        // }
        // UNKNOWN 상태면 계속 폴링
      } catch (err) {
        console.error('결제 상태 조회 실패:', err)
        if (isMounted) {
          setError('결제 상태 조회 중 오류가 발생했습니다.')
        }
      }
    }

    // 즉시 한 번 조회
    pollPaymentStatus()

    // 주기적으로 조회
    pollingInterval = setInterval(pollPaymentStatus, POLLING_INTERVAL)

    return () => {
      isMounted = false
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [currentOrder, setPaymentResult, pollingCount])

  return (
    <PageContainer>
      <Header showSearch={false} showQButton={false} />
      <div className="payment-status-check">
        <LoadingSpinner />
        <h2 className="check-title">결제 상태를 확인 중입니다</h2>
        <p className="check-message">
          서버에서 결제 상태를 확인하고 있습니다.
        </p>
        <p className="check-note">
          자동으로 새로고침되며, 결과가 확인되면 자동으로 이동합니다.
        </p>
        {pollingCount > 0 && (
          <p className="polling-count">
            확인 시도: {pollingCount}회
          </p>
        )}
        {error && (
          <div className="error-box">
            <p className="error-text">{error}</p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}

export default PaymentStatusCheckPage
