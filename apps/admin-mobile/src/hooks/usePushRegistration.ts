import { useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { initOneSignal } from '@/services/push/onesignal'

export function usePushRegistration() {
  const user = useAppSelector((s) => s.auth.user)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  useEffect(() => {
    void initOneSignal(isAuthenticated ? user?.id ?? null : null)
  }, [isAuthenticated, user?.id])
}
