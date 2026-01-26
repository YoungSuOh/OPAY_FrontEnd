import { useEffect } from 'react'

// 뒤로가기 방지
export const useBlockBackNavigation = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      window.history.pushState(null, '', window.location.href)
    }

    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [enabled])
}

// 새로고침 경고
export const useBlockRefresh = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '결제가 진행 중입니다. 페이지를 떠나시겠습니까?'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled])
}
