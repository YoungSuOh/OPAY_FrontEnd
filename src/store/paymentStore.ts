import { create } from 'zustand'
import { OrderInfo, PaymentResult } from '../types'

interface PaymentState {
  currentOrder: OrderInfo | null
  paymentResult: PaymentResult | null
  isProcessing: boolean
  paymentSessionId?: string // 결제 세션 유지용
  
  // Actions
  setCurrentOrder: (order: OrderInfo) => void
  setPaymentResult: (result: PaymentResult) => void
  setProcessing: (processing: boolean) => void
  setPaymentSession: (sessionId: string) => void
  resetPayment: () => void
}

export const usePaymentStore = create<PaymentState>((set) => ({
  currentOrder: null,
  paymentResult: null,
  isProcessing: false,
  paymentSessionId: undefined,

  setCurrentOrder: (order) =>
    set({ currentOrder: order }),

  setPaymentResult: (result) =>
    set({ paymentResult: result }),

  setProcessing: (processing) =>
    set({ isProcessing: processing }),

  setPaymentSession: (sessionId) =>
    set({ paymentSessionId: sessionId }),

  resetPayment: () =>
    set({
      currentOrder: null,
      paymentResult: null,
      isProcessing: false,
      paymentSessionId: undefined,
    }),
}))
