/**
 * Service booking add-on (`showBooking`) — client for the gated backend endpoint
 * `POST /api/public/storefront/bookings`. Slots mirror fixer-backend
 * `storefront-studio/lib/storefrontBookingInput.ts`.
 */
import { env } from './env'
import { withTenantId } from './tenant-headers'
import type { LeadServiceLine } from './storefront-api'

export const BOOKING_TIME_SLOTS = [
  { key: 'morning', label: 'Morning (8am – 12pm)' },
  { key: 'afternoon', label: 'Afternoon (12pm – 4pm)' },
  { key: 'evening', label: 'Evening (4pm – 8pm)' },
] as const

export type BookingTimeSlotKey = (typeof BOOKING_TIME_SLOTS)[number]['key']

export const BOOKING_MAX_DAYS_AHEAD = 90

/** Local calendar date as YYYY-MM-DD, offset by `days`. */
export function localIsoDate(days = 0, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export interface BookingInput {
  tenantId: string
  accessToken?: string
  firstName: string
  lastName?: string
  email?: string
  phone: string
  address: string
  locality?: string
  preferredDate: string
  timeSlot: BookingTimeSlotKey
  message?: string
  source?: string
  services: LeadServiceLine[]
}

export interface BookingResult {
  id: string
  dealId: string
  deduped: boolean
  reference: string
  preferredWindow: string
  confirmationEmail: boolean
}

export class BookingUnavailableError extends Error {}

export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  const { tenantId, accessToken, ...body } = input
  const res = await fetch(`${env.API_BASE_URL.replace(/\/+$/, '')}/public/storefront/bookings`, {
    method: 'POST',
    headers: withTenantId(tenantId, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    }),
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => null)) as {
    success?: boolean
    code?: string
    message?: string
    data?: BookingResult
  } | null
  if (res.status === 403 && json?.code === 'ADDON_INACTIVE') {
    throw new BookingUnavailableError('Online booking is not available right now — please contact us instead.')
  }
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || `Booking failed (${res.status})`)
  }
  return json.data
}
