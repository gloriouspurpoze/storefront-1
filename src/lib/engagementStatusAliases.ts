import type { VerticalKey } from '../verticals/core/types'

/**
 * Maps home-services booking API `status` values to vertical-pack status keys for
 * label / transition lookup. Used while restaurant (and other verticals) still
 * share the bookings API until vertical-specific endpoints ship.
 */
export const LEGACY_BOOKING_STATUS_TO_PACK_KEY: Partial<
  Record<VerticalKey, Readonly<Record<string, string>>>
> = {
  restaurant: {
    pending: 'booked',
    confirmed: 'booked',
    scheduled: 'booked',
    accepted: 'seated',
    in_progress: 'ordering',
    completed: 'paid',
    cancelled: 'cancelled',
    no_show: 'no_show',
  },
  salon: {
    pending: 'pending',
    confirmed: 'confirmed',
    scheduled: 'confirmed',
    accepted: 'checked_in',
    in_progress: 'in_service',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'no_show',
  },
}

export function resolveEngagementStatusKey(verticalKey: VerticalKey, apiStatus: string): string {
  const normalized = apiStatus.trim().toLowerCase()
  const mapped = LEGACY_BOOKING_STATUS_TO_PACK_KEY[verticalKey]?.[normalized]
  return mapped ?? normalized
}

/** Reverse map for PATCH bodies while a vertical still uses the home-services bookings API. */
export const PACK_KEY_TO_LEGACY_API_STATUS: Partial<
  Record<VerticalKey, Readonly<Record<string, string>>>
> = {
  restaurant: {
    booked: 'pending',
    seated: 'accepted',
    ordering: 'in_progress',
    preparing: 'in_progress',
    served: 'completed',
    paid: 'completed',
    no_show: 'cancelled',
    cancelled: 'cancelled',
  },
  salon: {
    pending: 'pending',
    confirmed: 'confirmed',
    checked_in: 'accepted',
    in_service: 'in_progress',
    completed: 'completed',
    no_show: 'cancelled',
    cancelled: 'cancelled',
  },
}

/** Coerce a vertical-pack status key to the value the bookings API accepts today. */
export function toApiBookingStatus(verticalKey: VerticalKey, statusKey: string): string {
  const normalized = statusKey.trim().toLowerCase()
  return PACK_KEY_TO_LEGACY_API_STATUS[verticalKey]?.[normalized] ?? normalized
}
