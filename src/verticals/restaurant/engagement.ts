import type { EngagementTypeDef } from '../core/engagement'

/** Restaurant reservation / order flow (MVP — extend when restaurant module ships). */
export const restaurantReservationEngagement: EngagementTypeDef = {
  key: 'reservation',
  label: 'Reservation',
  defaultSortField: 'scheduledAt',
  statuses: [
    { key: 'booked', label: 'Booked', next: ['seated', 'cancelled', 'no_show'] },
    { key: 'seated', label: 'Seated', next: ['ordering', 'cancelled'] },
    { key: 'ordering', label: 'Ordering', next: ['preparing', 'cancelled'] },
    { key: 'preparing', label: 'Preparing', next: ['served', 'cancelled'] },
    { key: 'served', label: 'Served', next: ['paid'] },
    { key: 'paid', label: 'Paid', terminal: true },
    { key: 'no_show', label: 'No show', terminal: true },
    { key: 'cancelled', label: 'Cancelled', terminal: true },
  ],
}
