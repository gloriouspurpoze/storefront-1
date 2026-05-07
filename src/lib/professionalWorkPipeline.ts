/**
 * Field-service style pipeline for admin professional hub:
 * groups raw booking statuses into operational stages ops teams expect.
 */

export interface PipelineGroup {
  id: string
  label: string
  shortLabel: string
  description: string
  /** Booking statuses rolled into this stage (API `status` values) */
  statuses: readonly string[]
  /** Suggested filter when drilling into the bookings tab */
  drilldownStatus: string
  color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'
}

export const PIPELINE_GROUPS: PipelineGroup[] = [
  {
    id: 'intake',
    label: 'Intake',
    shortLabel: 'Intake',
    description: 'New jobs awaiting confirmation or assignment follow-up.',
    statuses: ['pending'],
    drilldownStatus: 'pending',
    color: 'default',
  },
  {
    id: 'committed',
    label: 'Committed',
    shortLabel: 'Committed',
    description: 'Confirmed and on the calendar.',
    statuses: ['confirmed', 'scheduled'],
    drilldownStatus: 'scheduled',
    color: 'info',
  },
  {
    id: 'execution',
    label: 'On the job',
    shortLabel: 'Active',
    description: 'Professional accepted or work is underway.',
    statuses: ['accepted', 'in_progress'],
    drilldownStatus: 'in_progress',
    color: 'primary',
  },
  {
    id: 'done',
    label: 'Completed',
    shortLabel: 'Done',
    description: 'Closed successfully — payouts and QA if applicable.',
    statuses: ['completed'],
    drilldownStatus: 'completed',
    color: 'success',
  },
  {
    id: 'lost',
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    description: 'Did not complete — review reason and customer comms.',
    statuses: ['cancelled'],
    drilldownStatus: 'cancelled',
    color: 'error',
  },
]

export const BOOKING_STATUSES_FOR_TOTALS = [
  'pending',
  'confirmed',
  'scheduled',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
] as const

export type BookingStatusTotalKey = (typeof BOOKING_STATUSES_FOR_TOTALS)[number]

export function sumStatusesForGroup(
  totals: Partial<Record<string, number>> | null | undefined,
  statuses: readonly string[],
): number {
  if (!totals) return 0
  return statuses.reduce((acc, st) => acc + (Number(totals[st]) || 0), 0)
}

export function bookingLifecycleLabel(status: string): string {
  const m: Record<string, string> = {
    pending: 'Awaiting confirmation',
    confirmed: 'Confirmed',
    scheduled: 'Scheduled',
    accepted: 'Accepted by pro',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return m[status] ?? status.replace(/_/g, ' ')
}
