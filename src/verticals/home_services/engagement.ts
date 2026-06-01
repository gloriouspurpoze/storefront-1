import type { EngagementTypeDef } from '../core/engagement'

/** Aligns with API + `UpdateBookingStatusModal` booking statuses today. */
export const homeServicesBookingEngagement: EngagementTypeDef = {
  key: 'booking',
  label: 'Booking',
  defaultSortField: 'scheduledAt',
  defaultColumns: ['id', 'customer', 'service', 'assignee', 'scheduledAt', 'status'],
  statuses: [
    { key: 'pending', label: 'Pending', color: 'amber', next: ['confirmed', 'cancelled'] },
    { key: 'confirmed', label: 'Confirmed', color: 'blue', next: ['scheduled', 'in_progress', 'cancelled'] },
    { key: 'scheduled', label: 'Scheduled', color: 'indigo', next: ['in_progress', 'cancelled'] },
    { key: 'accepted', label: 'Accepted', color: 'blue', next: ['in_progress', 'cancelled'] },
    { key: 'in_progress', label: 'In progress', color: 'violet', next: ['completed', 'cancelled'] },
    { key: 'completed', label: 'Completed', color: 'emerald', terminal: true },
    { key: 'cancelled', label: 'Cancelled', color: 'gray', terminal: true },
  ],
}
