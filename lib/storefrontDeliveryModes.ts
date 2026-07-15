import type { StorefrontConfig } from '@/lib/storefront-api'

/** Canonical fulfillment modes exposed by tenant storefront config. */
export type StorefrontDeliveryMode = 'delivery' | 'pickup' | 'ship'

export const STOREFRONT_DELIVERY_MODE_LABELS: Record<StorefrontDeliveryMode, string> = {
  delivery: 'Local delivery',
  pickup: 'Pickup / takeaway',
  ship: 'Shipping / courier',
}

const MODE_FLAG: Record<StorefrontDeliveryMode, string> = {
  delivery: 'enableDeliveryMode',
  pickup: 'enablePickupMode',
  ship: 'enableShipMode',
}

/** Modes default on when unset (matches backend TenantStorefrontConfig comments). */
function modeEnabled(
  flags: Record<string, boolean | undefined> | undefined,
  mode: StorefrontDeliveryMode,
): boolean {
  return flags?.[MODE_FLAG[mode]] !== false
}

/**
 * Enabled delivery modes for checkout UI (order: delivery → pickup → ship).
 * Falls back to delivery + pickup if every flag is explicitly off.
 */
export function getEnabledDeliveryModes(
  config: StorefrontConfig | null | undefined,
): StorefrontDeliveryMode[] {
  const flags = config?.featureFlags as Record<string, boolean | undefined> | undefined
  const modes: StorefrontDeliveryMode[] = []
  for (const mode of ['delivery', 'pickup', 'ship'] as const) {
    if (modeEnabled(flags, mode)) modes.push(mode)
  }
  return modes.length ? modes : ['delivery', 'pickup']
}

/** Restaurant themes that only support delivery + pickup. */
export function getEnabledRestaurantDeliveryModes(
  config: StorefrontConfig | null | undefined,
): Array<'delivery' | 'pickup'> {
  const modes = getEnabledDeliveryModes(config).filter(
    (m): m is 'delivery' | 'pickup' => m === 'delivery' || m === 'pickup',
  )
  return modes.length ? modes : ['delivery', 'pickup']
}

export function coerceDeliveryMode<T extends string>(
  current: T,
  enabled: readonly T[],
  fallback: T,
): T {
  return enabled.includes(current) ? current : (enabled[0] ?? fallback)
}
