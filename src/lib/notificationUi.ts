/**
 * Shared notification UI config — types, labels, and filter groups for inbox & compose flows.
 */

import type { PushNotification } from '../services/api/notifications.service'

export const NOTIFICATION_TYPE_OPTIONS: { value: string; label: string; group: string }[] = [
  { value: 'booking_confirmed', label: 'Booking confirmed', group: 'Bookings' },
  { value: 'booking_created', label: 'Booking created', group: 'Bookings' },
  { value: 'booking_assigned', label: 'Booking assigned', group: 'Bookings' },
  { value: 'booking_completed', label: 'Booking completed', group: 'Bookings' },
  { value: 'booking_cancelled', label: 'Booking cancelled', group: 'Bookings' },
  { value: 'status_changed', label: 'Status changed', group: 'Bookings' },
  { value: 'order_placed', label: 'Order placed', group: 'Commerce' },
  { value: 'order_updated', label: 'Order updated', group: 'Commerce' },
  { value: 'payment_received', label: 'Payment received', group: 'Commerce' },
  { value: 'quote_received', label: 'Quote received', group: 'Quotes' },
  { value: 'quote_accepted', label: 'Quote accepted', group: 'Quotes' },
  { value: 'message_received', label: 'Message received', group: 'Messages' },
  { value: 'service_completed', label: 'Service completed', group: 'Service' },
  { value: 'review_requested', label: 'Review requested', group: 'Service' },
  { value: 'review_received', label: 'Review received', group: 'Service' },
  { value: 'team_work_assigned', label: 'Team work assigned', group: 'Operations' },
  { value: 'reminder', label: 'Reminder', group: 'System' },
  { value: 'system_alert', label: 'System alert', group: 'System' },
  { value: 'marketing', label: 'Marketing', group: 'Marketing' },
]

export type InboxFilter = 'all' | 'unread' | PushNotification['type']

export const INBOX_QUICK_FILTERS: { id: InboxFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'booking_confirmed', label: 'Bookings' },
  { id: 'order_placed', label: 'Orders' },
  { id: 'payment_received', label: 'Payments' },
  { id: 'system_alert', label: 'System' },
  { id: 'marketing', label: 'Marketing' },
]

/** Booking-related types matched by the "Bookings" quick filter. */
const BOOKING_TYPES = new Set([
  'booking_confirmed',
  'booking_created',
  'booking_assigned',
  'booking_completed',
  'booking_cancelled',
  'status_changed',
])

export function matchesInboxFilter(notification: PushNotification, filter: InboxFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'unread') return !notification.isRead
  if (filter === 'booking_confirmed') {
    return BOOKING_TYPES.has(notification.type)
  }
  return notification.type === filter
}

export function formatNotificationType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function parseRecipientIds(csv: string): string[] {
  return csv
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
