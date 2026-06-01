import type { EngagementTypeDef } from '../core/engagement'

/** Salon / spa appointment flow (reuses bookings API until salon module ships). */
export const salonAppointmentEngagement: EngagementTypeDef = {
  key: 'appointment',
  label: 'Appointment',
  defaultSortField: 'scheduledAt',
  defaultColumns: ['id', 'customer', 'service', 'stylist', 'scheduledAt', 'status'],
  statuses: [
    { key: 'pending', label: 'Requested', color: 'amber', next: ['confirmed', 'cancelled'] },
    { key: 'confirmed', label: 'Confirmed', color: 'blue', next: ['checked_in', 'cancelled'] },
    { key: 'checked_in', label: 'Checked in', color: 'indigo', next: ['in_service', 'cancelled'] },
    { key: 'in_service', label: 'In service', color: 'violet', next: ['completed', 'cancelled'] },
    { key: 'completed', label: 'Completed', color: 'emerald', terminal: true },
    { key: 'cancelled', label: 'Cancelled', color: 'gray', terminal: true },
    { key: 'no_show', label: 'No show', color: 'gray', terminal: true },
  ],
}
