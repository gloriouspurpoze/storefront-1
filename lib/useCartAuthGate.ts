'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { buildStorefrontLoginUrl } from '@/lib/storefrontLoginUrls'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'

/**
 * Redirects unauthenticated users to sign in before cart / checkout actions, unless the
 * store allows guest checkout (`config.customerAccounts`).
 */
export function useCartAuthGate() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isReady, guestCheckoutAllowed } = useAccountAuth()

  const requireAuthForCart = useCallback((): boolean => {
    if (guestCheckoutAllowed) return true
    if (!isReady) return false
    if (isAuthenticated) return true
    router.push(buildStorefrontLoginUrl(pathname || '/', { signup: true }))
    return false
  }, [guestCheckoutAllowed, isAuthenticated, isReady, pathname, router])

  return { isAuthenticated, isReady, guestCheckoutAllowed, requireAuthForCart }
}

export { buildStorefrontLoginUrl, buildCartSignupLoginUrl } from '@/lib/storefrontLoginUrls'
