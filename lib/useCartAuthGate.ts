'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'

export function buildCartSignupLoginUrl(returnPath: string): string {
  const params = new URLSearchParams({
    signup: '1',
    returnUrl: returnPath || '/',
  })
  return `/account/login?${params.toString()}`
}

/** Redirects unauthenticated users to sign up before cart actions. */
export function useCartAuthGate() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isReady } = useAccountAuth()

  const requireAuthForCart = useCallback((): boolean => {
    if (!isReady) return false
    if (isAuthenticated) return true
    router.push(buildCartSignupLoginUrl(pathname || '/'))
    return false
  }, [isAuthenticated, isReady, pathname, router])

  return { isAuthenticated, isReady, requireAuthForCart }
}
