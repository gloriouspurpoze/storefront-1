import type { Booking } from '../types'

export type ProfessionalHubActivityKind = 'booking' | 'system'

export interface ProfessionalHubActivityItem {
  id: string
  occurredAt: string
  kind: ProfessionalHubActivityKind
  title: string
  description?: string
  bookingId?: string
}

function rowId(b: Booking): string {
  return String(b.id || (b as { _id?: string })._id || '')
}

function pickTime(...candidates: (string | undefined | null)[]): string {
  for (const c of candidates) {
    if (c && String(c).trim()) return String(c)
  }
  return new Date().toISOString()
}

/**
 * Derive a chronological activity feed from booking rows (no history API required).
 * When the backend adds GET /professionals/:id/activity, merge those events upstream.
 */
export function buildActivityTimelineFromBookings(bookings: Booking[], limit = 80): ProfessionalHubActivityItem[] {
  const items: ProfessionalHubActivityItem[] = []

  for (const b of bookings) {
    const bid = rowId(b)
    if (!bid) continue
    const status = (b.status || (b as { status?: string }).status || 'unknown') as string
    const createdAt = (b as { createdAt?: string }).createdAt
    const updatedAt = (b as { updatedAt?: string }).updatedAt
    const scheduled = b.scheduledDate
    const completed = (b as { completedDate?: string }).completedDate
    const label = b.bookingNumber || bid
    const cancel = (b.cancellationReason ?? b.cancellation_reason ?? '').toString().trim()

    items.push({
      id: `${bid}-created`,
      occurredAt: pickTime(createdAt, scheduled, updatedAt),
      kind: 'booking',
      title: 'Booking created',
      description: `${label} · current status ${status}`,
      bookingId: bid,
    })

    if (scheduled) {
      items.push({
        id: `${bid}-scheduled`,
        occurredAt: scheduled,
        kind: 'booking',
        title: 'Scheduled service',
        description: label,
        bookingId: bid,
      })
    }

    if (status === 'cancelled' && cancel) {
      items.push({
        id: `${bid}-cancel`,
        occurredAt: pickTime(updatedAt, scheduled, createdAt),
        kind: 'booking',
        title: 'Cancelled',
        description: cancel,
        bookingId: bid,
      })
    } else if (status === 'cancelled') {
      items.push({
        id: `${bid}-cancel-noreason`,
        occurredAt: pickTime(updatedAt, scheduled, createdAt),
        kind: 'booking',
        title: 'Cancelled',
        description: 'No cancellation reason recorded',
        bookingId: bid,
      })
    }

    if (status === 'completed') {
      items.push({
        id: `${bid}-completed`,
        occurredAt: pickTime(completed, updatedAt, scheduled, createdAt),
        kind: 'booking',
        title: 'Completed',
        description: label,
        bookingId: bid,
      })
    }
  }

  items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())

  const seen = new Set<string>()
  const deduped: ProfessionalHubActivityItem[] = []
  for (const it of items) {
    if (seen.has(it.id)) continue
    seen.add(it.id)
    deduped.push(it)
    if (deduped.length >= limit) break
  }
  return deduped
}
