'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import { fetchCustomerDefaultAddress } from '@/lib/storefront-api'
import {
  checkoutPrefillFromUser,
  deliveryPrefillFromSavedAddress,
} from '@/lib/storefrontCustomerContact'
import type { DeliveryDetailsValue } from '@/lib/templateSettings'
import { hasShippableDeliveryDetails } from '@/lib/storefrontShippingAddress'

/** Prefill checkout contact + delivery fields from the signed-in customer session. */
export function useCheckoutCustomerPrefill() {
  const { user, tokens, isAuthenticated, isReady } = useAccountAuth()
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})
  const [addressReady, setAddressReady] = useState(false)

  const prefill = useMemo(
    () => checkoutPrefillFromUser(isAuthenticated ? user : null),
    [user, isAuthenticated],
  )

  useEffect(() => {
    if (!isReady || !isAuthenticated || !tokens?.accessToken) {
      setDeliveryDetails({})
      setAddressReady(true)
      return
    }

    let cancelled = false
    setAddressReady(false)

    fetchCustomerDefaultAddress({ accessToken: tokens.accessToken })
      .then((addr) => {
        if (cancelled) return
        setDeliveryDetails(deliveryPrefillFromSavedAddress(addr))
      })
      .catch(() => {
        if (!cancelled) setDeliveryDetails({})
      })
      .finally(() => {
        if (!cancelled) setAddressReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [isReady, isAuthenticated, tokens?.accessToken])

  return {
    ...prefill,
    deliveryDetails,
    hasSavedAddress: hasShippableDeliveryDetails(deliveryDetails),
    addressReady,
    user: isAuthenticated ? user : null,
    accessToken: isAuthenticated ? tokens?.accessToken : undefined,
    isReady: isReady && addressReady,
    isAuthenticated,
  }
}
