'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { buildStorefrontLoginUrl } from '@/lib/storefrontLoginUrls'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'

/** Redirects unauthenticated users to sign in before cart / checkout actions. */
export function useCartAuthGate() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isReady } = useAccountAuth()

  const requireAuthForCart = useCallback((): boolean => {
    if (!isReady) return false
    if (isAuthenticated) return true
    router.push(buildStorefrontLoginUrl(pathname || '/', { signup: true }))
    return false
  }, [isAuthenticated, isReady, pathname, router])

  return { isAuthenticated, isReady, requireAuthForCart }
}

export { buildStorefrontLoginUrl, buildCartSignupLoginUrl } from '@/lib/storefrontLoginUrls'
