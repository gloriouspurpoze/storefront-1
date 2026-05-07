import type { Booking } from '../../types'

/** Normalize API wrapper used across bookings services */
export function unwrapBookingsPayload(res: {
  success?: boolean
  data?: { bookings?: Booking[]; pagination?: { total?: number } }
}): { bookings: Booking[]; total: number } {
  const bookings = res.success && res.data?.bookings ? res.data.bookings : []
  const total = res.data?.pagination?.total ?? bookings.length
  return { bookings, total }
}

export function bookingRowId(b: Booking): string {
  return String(b.id ?? b._id ?? '')
}

export function safeCustomerLabel(b: Booking): string {
  const c = b.customer as { firstName?: string; lastName?: string } | undefined
  const parts = [c?.firstName, c?.lastName].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return b.customerName || 'Customer'
}
