import type { LucideIcon } from 'lucide-react'
import { Calendar, Play, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react'
import type { VerticalKey } from '../verticals/core/types'
import {
  getAllowedNextStatuses,
  getEngagementStatusKeys,
  getEngagementStatusLabel,
  getEngagementStatuses,
  getPrimaryEngagementType,
} from './verticalEngagement'

export interface BookingStatusUiEntry {
  label: string
  Icon: LucideIcon
  description: string
  boxClass: string
}

const ICON_BY_KEY: Record<string, LucideIcon> = {
  pending: Calendar,
  booked: Calendar,
  confirmed: CheckCircle,
  scheduled: Clock,
  accepted: UserCheck,
  seated: UserCheck,
  in_progress: Play,
  ordering: Play,
  preparing: Play,
  served: CheckCircle,
  paid: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
  no_show: XCircle,
}

const BOX_BY_COLOR: Record<string, string> = {
  amber: 'border-bloom-coral/40 bg-bloom-rose dark:border-bloom-coral/40 dark:bg-bloom-coral/30',
  blue: 'border-primary/30 bg-primary/5',
  indigo: 'border-primary/20 bg-primary-soft dark:border-primary-deep/40 dark:bg-primary-deep/30',
  violet: 'border-primary/20 bg-primary-soft dark:border-primary-deep/40 dark:bg-primary-deep/30',
  emerald: 'border-storm-mist/30 bg-storm-mist/30 dark:border-storm-deep/40 dark:bg-storm-deep/30',
  gray: 'border-destructive/30 bg-destructive/5',
}

const HOME_SERVICES_DESCRIPTIONS: Record<string, string> = {
  pending: 'Waiting for confirmation or provider assignment',
  confirmed: 'Booking is confirmed',
  scheduled: 'Scheduled on the calendar',
  accepted: 'Accepted by the professional',
  in_progress: 'Service is currently being performed',
  completed: 'Service has been completed',
  cancelled: 'Booking has been cancelled',
}

const RESTAURANT_DESCRIPTIONS: Record<string, string> = {
  booked: 'Reservation is booked',
  seated: 'Guests are seated',
  ordering: 'Order is being taken',
  preparing: 'Kitchen is preparing the order',
  served: 'Food has been served',
  paid: 'Bill is settled',
  no_show: 'Guest did not arrive',
  cancelled: 'Reservation was cancelled',
}

function descriptionFor(verticalKey: VerticalKey, statusKey: string, label: string): string {
  const table =
    verticalKey === 'restaurant' ? RESTAURANT_DESCRIPTIONS : HOME_SERVICES_DESCRIPTIONS
  return table[statusKey] ?? `${label} — update notes for your team if needed.`
}

function iconFor(statusKey: string): LucideIcon {
  return ICON_BY_KEY[statusKey] ?? Calendar
}

function boxFor(color: string | undefined, statusKey: string): string {
  if (color && BOX_BY_COLOR[color]) return BOX_BY_COLOR[color]
  if (statusKey === 'cancelled' || statusKey === 'no_show') {
    return BOX_BY_COLOR.gray
  }
  if (statusKey === 'completed' || statusKey === 'paid' || statusKey === 'served') {
    return BOX_BY_COLOR.emerald
  }
  return BOX_BY_COLOR.blue
}

/** UI metadata for status update modal and badges (vertical-aware labels). */
export function buildBookingStatusUiMap(verticalKey: VerticalKey): Record<string, BookingStatusUiEntry> {
  const packStatuses = getEngagementStatuses(verticalKey)
  const out: Record<string, BookingStatusUiEntry> = {}

  for (const s of packStatuses) {
    out[s.key] = {
      label: s.label,
      Icon: iconFor(s.key),
      description: descriptionFor(verticalKey, s.key, s.label),
      boxClass: boxFor(s.color, s.key),
    }
  }

  // API statuses not in pack (e.g. `accepted` on home_services until pack catches up)
  const apiExtras =
    verticalKey === 'home_services'
      ? (['accepted'] as const)
      : verticalKey === 'restaurant'
        ? (['pending', 'confirmed', 'scheduled', 'accepted', 'in_progress', 'completed'] as const)
        : []

  for (const key of apiExtras) {
    if (out[key]) continue
    const label = getEngagementStatusLabel(verticalKey, key)
    out[key] = {
      label,
      Icon: iconFor(key),
      description: descriptionFor(verticalKey, key, label),
      boxClass: boxFor(undefined, key),
    }
  }

  return out
}

export function getBookingStatusUiEntry(
  verticalKey: VerticalKey,
  statusKey: string,
): BookingStatusUiEntry {
  const map = buildBookingStatusUiMap(verticalKey)
  const hit = map[statusKey]
  if (hit) return hit
  const label = getEngagementStatusLabel(verticalKey, statusKey)
  return {
    label,
    Icon: iconFor(statusKey),
    description: descriptionFor(verticalKey, statusKey, label),
    boxClass: boxFor(undefined, statusKey),
  }
}

export function listSelectableBookingStatuses(
  verticalKey: VerticalKey,
  currentStatus: string,
): string[] {
  const next = getAllowedNextStatuses(verticalKey, currentStatus)
  if (next?.length) return next.filter((s) => s !== currentStatus)

  const keys = getEngagementStatusKeys(verticalKey)
  if (keys.length) return keys.filter((s) => s !== currentStatus)

  return ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].filter(
    (s) => s !== currentStatus,
  )
}

export function engagementEntityLabel(verticalKey: VerticalKey): string {
  return getPrimaryEngagementType(verticalKey)?.label ?? 'Booking'
}
