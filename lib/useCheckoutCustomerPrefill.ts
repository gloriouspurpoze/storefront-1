'use client'

import { useMemo } from 'react'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import { checkoutPrefillFromUser } from '@/lib/storefrontCustomerContact'

/** Prefill checkout contact fields from the signed-in storefront customer session. */
export function useCheckoutCustomerPrefill() {
  const { user, isAuthenticated, isReady } = useAccountAuth()
  const prefill = useMemo(
    () => checkoutPrefillFromUser(isAuthenticated ? user : null),
    [user, isAuthenticated],
  )

  return {
    ...prefill,
    user: isAuthenticated ? user : null,
    isReady,
    isAuthenticated,
  }
}
