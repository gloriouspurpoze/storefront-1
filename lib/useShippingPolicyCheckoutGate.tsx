'use client'

import { useRef, useState } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { ShippingPolicyModal } from '@/components/ShippingPolicyModal'
import { runPreCheckoutGuards } from '@/lib/checkoutGuard'
import type { DeliveryDetailsValue } from '@/lib/templateSettings'

export function useShippingPolicyCheckoutGate(config?: StorefrontConfig | null) {
  const [shippingPolicyOpen, setShippingPolicyOpen] = useState(false)
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false)
  const proceedRef = useRef<(() => void) | null>(null)

  const requestCheckout = (onProceed: () => void) => {
    if (policyAcknowledged) {
      onProceed()
      return
    }
    proceedRef.current = onProceed
    setShippingPolicyOpen(true)
  }

  const onPolicyClose = () => {
    setShippingPolicyOpen(false)
    setPolicyAcknowledged(true)
    const next = proceedRef.current
    proceedRef.current = null
    next?.()
  }

  const isRestaurant =
    config?.themeKey === 'classic' ||
    config?.themeKey?.startsWith('menufast') ||
    config?.themeKey === 'saffron'

  const modal = (
    <ShippingPolicyModal
      open={shippingPolicyOpen}
      onClose={onPolicyClose}
      config={config}
      title={isRestaurant ? 'Delivery policy' : 'Shipping policy'}
    />
  )

  return { requestCheckout, modal }
}

export function validateBeforePayment(
  config: StorefrontConfig | null | undefined,
  deliveryDetails: DeliveryDetailsValue,
  opts: { requireDate?: boolean; requireTime?: boolean },
): string | null {
  const guard = runPreCheckoutGuards(config, deliveryDetails, opts)
  return guard.ok ? null : guard.message
}
