import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  getOrderingAvailabilityFromConfig,
  getOrderingHoursFromConfig,
  isStoreOpenNow,
} from '@/lib/orderingHours'
import { validateDeliveryDetails, type DeliveryDetailsValue } from '@/lib/templateSettings'

export type CheckoutGuardResult = { ok: true } | { ok: false; message: string }

export function assertStoreOpenForCheckout(config?: StorefrontConfig | null): CheckoutGuardResult {
  const hours = getOrderingHoursFromConfig(config)
  if (!isStoreOpenNow(hours)) {
    return {
      ok: false,
      message: 'We are currently closed and not accepting new orders. Please check our ordering hours.',
    }
  }
  return { ok: true }
}

export function assertDeliveryDetailsForCheckout(
  config: StorefrontConfig | null | undefined,
  deliveryDetails: DeliveryDetailsValue,
  opts: {
    requireDate?: boolean
    requireTime?: boolean
  },
): CheckoutGuardResult {
  if (!opts.requireDate && !opts.requireTime) return { ok: true }

  const orderingHours = getOrderingHoursFromConfig(config)
  const availability = getOrderingAvailabilityFromConfig(config)
  const slotCheck = validateDeliveryDetails(deliveryDetails, orderingHours, {
    requireDate: opts.requireDate,
    requireTime: opts.requireTime,
    availability,
  })
  if (!slotCheck.ok) {
    return { ok: false, message: slotCheck.message }
  }
  return { ok: true }
}

export function runPreCheckoutGuards(
  config: StorefrontConfig | null | undefined,
  deliveryDetails: DeliveryDetailsValue,
  opts: {
    requireDate?: boolean
    requireTime?: boolean
    skipStoreOpenCheck?: boolean
  } = {},
): CheckoutGuardResult {
  if (!opts.skipStoreOpenCheck) {
    const openCheck = assertStoreOpenForCheckout(config)
    if (!openCheck.ok) return openCheck
  }
  return assertDeliveryDetailsForCheckout(config, deliveryDetails, opts)
}
