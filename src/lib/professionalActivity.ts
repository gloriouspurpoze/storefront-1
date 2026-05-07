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

/** First real timestamp from API fields — never invent "now" (would fake activity). */
function pickTime(...candidates: (string | undefined | null)[]): string | null {
  for (const c of candidates) {
    if (c && String(c).trim()) return String(c)
  }
  return null
}

function pushWhenTimed(
  items: ProfessionalHubActivityItem[],
  row: Omit<ProfessionalHubActivityItem, 'occurredAt'> & { occurredAt: string | null },
) {
  if (!row.occurredAt || !String(row.occurredAt).trim()) return
  items.push({ ...row, occurredAt: String(row.occurredAt) })
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

    pushWhenTimed(items, {
      id: `${bid}-created`,
      occurredAt: pickTime(createdAt, scheduled, updatedAt),
      kind: 'booking',
      title: 'Booking created',
      description: `${label} · current status ${status}`,
      bookingId: bid,
    })

    if (scheduled) {
      pushWhenTimed(items, {
        id: `${bid}-scheduled`,
        occurredAt: scheduled,
        kind: 'booking',
        title: 'Scheduled service',
        description: label,
        bookingId: bid,
      })
    }

    const assignedAt = (b as { assignedAt?: string | null }).assignedAt ?? (b as { assigned_at?: string | null }).assigned_at
    if (assignedAt && String(assignedAt).trim()) {
      pushWhenTimed(items, {
        id: `${bid}-assigned`,
        occurredAt: String(assignedAt),
        kind: 'booking',
        title: 'Assigned to professional',
        description: label,
        bookingId: bid,
      })
    }

    if (status === 'confirmed') {
      pushWhenTimed(items, {
        id: `${bid}-confirmed`,
        occurredAt: pickTime(updatedAt, scheduled, createdAt),
        kind: 'booking',
        title: 'Confirmed with customer',
        description: label,
        bookingId: bid,
      })
    }

    if (status === 'accepted') {
      pushWhenTimed(items, {
        id: `${bid}-accepted`,
        occurredAt: pickTime(updatedAt, scheduled, createdAt),
        kind: 'booking',
        title: 'Professional accepted job',
        description: label,
        bookingId: bid,
      })
    }

    if (status === 'in_progress') {
      pushWhenTimed(items, {
        id: `${bid}-inprogress`,
        occurredAt: pickTime(updatedAt, scheduled, createdAt),
        kind: 'booking',
        title: 'Work in progress',
        description: label,
        bookingId: bid,
      })
    }

    const pay = (b as { paymentStatus?: string }).paymentStatus
    if (pay && String(pay).trim() && status === 'completed') {
      pushWhenTimed(items, {
        id: `${bid}-pay`,
        occurredAt: pickTime(completed, updatedAt, scheduled, createdAt),
        kind: 'booking',
        title: `Payment: ${pay}`,
        description: label,
        bookingId: bid,
      })
    }

    if (status === 'cancelled' && cancel) {
      pushWhenTimed(items, {
        id: `${bid}-cancel`,
        occurredAt: pickTime(updatedAt, scheduled, createdAt),
        kind: 'booking',
        title: 'Cancelled',
        description: cancel,
        bookingId: bid,
      })
    } else if (status === 'cancelled') {
      pushWhenTimed(items, {
        id: `${bid}-cancel-noreason`,
        occurredAt: pickTime(updatedAt, scheduled, createdAt),
        kind: 'booking',
        title: 'Cancelled',
        description: 'No cancellation reason recorded',
        bookingId: bid,
      })
    }

    if (status === 'completed') {
      pushWhenTimed(items, {
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
