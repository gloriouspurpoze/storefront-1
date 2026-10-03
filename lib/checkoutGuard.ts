import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  getOrderingAvailabilityFromConfig,
  getOrderingHoursFromConfig,
  getStoreStatus,
  isOrderingPaused,
  getPausedMessage,
} from '@/lib/orderingHours'
import { validateDeliveryDetails, type DeliveryDetailsValue } from '@/lib/templateSettings'
import { validateShippingAddress } from '@/lib/storefrontShippingAddress'

export type CheckoutGuardResult = { ok: true } | { ok: false; message: string }

export function assertStoreOpenForCheckout(config?: StorefrontConfig | null): CheckoutGuardResult {
  const status = getStoreStatus(getOrderingHoursFromConfig(config), getOrderingAvailabilityFromConfig(config))
  if (!status.isOpen) {
    return {
      ok: false,
      message:
        status.reason === 'paused' || status.reason === 'holiday'
          ? status.message ?? 'We are not accepting new orders right now.'
          : 'We are currently closed and not accepting new orders. Please check our ordering hours.',
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
    requireAddress?: boolean
  },
): CheckoutGuardResult {
  if (opts.requireAddress !== false) {
    const addressCheck = validateShippingAddress(deliveryDetails)
    if (!addressCheck.ok) return addressCheck
  }

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
    requireAddress?: boolean
  } = {},
): CheckoutGuardResult {
  // A pause stops every new order, scheduled ones included.
  const availability = getOrderingAvailabilityFromConfig(config)
  if (isOrderingPaused(availability)) return { ok: false, message: getPausedMessage(availability) }

  const skipOpenForScheduled =
    Boolean(opts.requireDate) &&
    Boolean(deliveryDetails.preferredDate?.trim()) &&
    assertDeliveryDetailsForCheckout(config, deliveryDetails, {
      requireDate: true,
      requireTime: opts.requireTime,
      requireAddress: false,
    }).ok

  if (!opts.skipStoreOpenCheck && !skipOpenForScheduled) {
    const openCheck = assertStoreOpenForCheckout(config)
    if (!openCheck.ok) return openCheck
  }
  return assertDeliveryDetailsForCheckout(config, deliveryDetails, opts)
}
