/**
 * Storefront delivery fee — keep in sync with backend
 * `profixer-backend/src/modules/storefront-studio/lib/storefrontCheckoutPricing.ts`
 *
 * Amounts come from tenant `shippingPolicy` (Storefront Studio), not hardcoded.
 */

import type { StorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontDeliveryMode } from '@/lib/storefrontDeliveryModes'
import { getShippingPolicyFromConfig } from '@/lib/shippingPolicy'

export interface StorefrontShippingRates {
  deliveryFeeInr: number
  shipFeeInr: number
  freeDeliveryMinInr: number | null
}

function isShippingRates(value: unknown): value is StorefrontShippingRates {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.deliveryFeeInr === 'number' &&
    typeof v.shipFeeInr === 'number' &&
    ('freeDeliveryMinInr' in v) &&
    !('featureFlags' in v) &&
    !('branding' in v)
  )
}

export function resolveStorefrontShippingRates(
  config: StorefrontConfig | null | undefined,
): StorefrontShippingRates {
  const policy = getShippingPolicyFromConfig(config)
  const deliveryFeeInr = Math.max(0, Number(policy.deliveryFeeInr) || 0)
  const shipRaw = policy.shipFeeInr
  const shipFeeInr =
    shipRaw === undefined || shipRaw === null
      ? deliveryFeeInr
      : Math.max(0, Number(shipRaw) || 0)
  const freeMin = Number(policy.freeDeliveryMinInr)
  return {
    deliveryFeeInr,
    shipFeeInr,
    freeDeliveryMinInr: Number.isFinite(freeMin) && freeMin > 0 ? freeMin : null,
  }
}

export function storefrontShippingAmountInr(
  mode: StorefrontDeliveryMode | 'local' | 'takeaway' | string,
  itemsTotalInr: number,
  configOrRates?: StorefrontConfig | StorefrontShippingRates | null,
): number {
  const normalized = String(mode || '')
    .trim()
    .toLowerCase()
  if (normalized === 'pickup' || normalized === 'takeaway' || !normalized) return 0

  const rates = isShippingRates(configOrRates)
    ? configOrRates
    : resolveStorefrontShippingRates(configOrRates)

  const subtotal = Math.max(0, Number(itemsTotalInr) || 0)
  if (rates.freeDeliveryMinInr != null && subtotal >= rates.freeDeliveryMinInr) {
    return 0
  }
  if (normalized === 'ship' || normalized === 'shipping' || normalized === 'courier') {
    return rates.shipFeeInr
  }
  return rates.deliveryFeeInr
}

/** Map theme-local aliases to API fulfillmentMode. */
export function toApiFulfillmentMode(
  mode: string | undefined | null,
): StorefrontDeliveryMode {
  const key = String(mode ?? '')
    .trim()
    .toLowerCase()
  if (key === 'ship' || key === 'shipping' || key === 'courier') return 'ship'
  if (key === 'pickup' || key === 'takeaway') return 'pickup'
  if (key === 'delivery' || key === 'local') return 'delivery'
  return 'pickup'
}

/**
 * Tax added on top of items — mirrors backend `storefrontTaxAmountInr`.
 * Tax-inclusive pricing (the default) adds nothing; rate is capped at 28% like the server.
 */
export function storefrontTaxAmountInr(
  itemsTotalInr: number,
  config: StorefrontConfig | null | undefined,
): number {
  const policy = getShippingPolicyFromConfig(config)
  const rate = Math.min(28, policy.taxRatePercent ?? 0)
  if (policy.pricesIncludeTax !== false || rate <= 0) return 0
  const subtotal = Math.max(0, Number(itemsTotalInr) || 0)
  return Math.round(subtotal * rate) / 100
}

export interface StorefrontCheckoutTotals {
  shippingInr: number
  taxInr: number
  /** What the customer is charged — equals the server's Razorpay amount / Order total. */
  totalInr: number
  /** Amount still needed to reach the store minimum (0 = can check out). */
  minOrderShortfallInr: number
  /** Cash on delivery not allowed for this total. */
  codOverLimit: boolean
}

/** One place for theme cart totals so the UI matches what the backend charges. */
export function storefrontCheckoutTotals(
  mode: StorefrontDeliveryMode | 'local' | 'takeaway' | string,
  itemsTotalInr: number,
  config: StorefrontConfig | null | undefined,
): StorefrontCheckoutTotals {
  const subtotal = Math.max(0, Number(itemsTotalInr) || 0)
  const policy = getShippingPolicyFromConfig(config)
  const shippingInr = storefrontShippingAmountInr(mode, subtotal, config)
  const taxInr = storefrontTaxAmountInr(subtotal, config)
  const totalInr = Math.round((subtotal + shippingInr + taxInr) * 100) / 100
  return {
    shippingInr,
    taxInr,
    totalInr,
    minOrderShortfallInr:
      policy.minOrderInr != null ? Math.max(0, policy.minOrderInr - subtotal) : 0,
    codOverLimit: policy.codMaxOrderInr != null && totalInr > policy.codMaxOrderInr,
  }
}
