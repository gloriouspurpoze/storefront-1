import type { BookingStatus } from '@profixer/types'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  scheduled: 'Scheduled',
  accepted: 'Accepted',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/** Allowed quick status transitions for mobile ops (subset of web). */
export function nextStatusActions(current: BookingStatus): { status: BookingStatus; label: string }[] {
  switch (current) {
    case 'pending':
      return [
        { status: 'confirmed', label: 'Confirm booking' },
        { status: 'cancelled', label: 'Cancel booking' },
      ]
    case 'confirmed':
    case 'scheduled':
    case 'accepted':
      return [
        { status: 'in_progress', label: 'Start job' },
        { status: 'cancelled', label: 'Cancel booking' },
      ]
    case 'in_progress':
      return [
        { status: 'completed', label: 'Mark completed' },
        { status: 'cancelled', label: 'Cancel booking' },
      ]
    default:
      return []
  }
}

export type BookingListFilter = 'all' | 'today' | 'pending' | 'in_progress'

export function bookingListQuery(filter: BookingListFilter): {
  status?: string
  dateFrom?: string
  dateTo?: string
} {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayStr = `${yyyy}-${mm}-${dd}`

  switch (filter) {
    case 'today':
      return { dateFrom: todayStr, dateTo: todayStr }
    case 'pending':
      return { status: 'pending' }
    case 'in_progress':
      return { status: 'in_progress' }
    default:
      return {}
  }
}
