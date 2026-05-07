import type { Booking } from '../types'
import type { Professional } from '../types/professional.types'
import { extractAssignedProfessionalId } from './proBookingResolution'

/** Status buckets we pull in parallel (each request obeys API max limit, typically 100). */
export const FLEET_BOOKING_SAMPLE_STATUSES = [
  'pending',
  'confirmed',
  'scheduled',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
] as const

export type FleetBookingSampleStatus = (typeof FLEET_BOOKING_SAMPLE_STATUSES)[number]

export function bookingRowId(b: Booking): string {
  return String(b.id || (b as { _id?: string })._id || '')
}

export function bookingAssignedToProfessional(b: Booking, pro: Professional): boolean {
  const assigned = extractAssignedProfessionalId(b)
  if (!assigned) return false
  return assigned === pro._id || assigned === pro.id || assigned === pro.professionalId
}

function hoursCreatedToCompleted(b: Booking): number | null {
  const created = b.createdAt || (b as { created_at?: string }).created_at
  const done = b.completedDate || (b as { completed_at?: string }).completed_at
  if (!created || !done) return null
  const t0 = new Date(created).getTime()
  const t1 = new Date(done).getTime()
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 <= t0) return null
  return (t1 - t0) / 3600000
}

export interface ProfessionalFleetMetrics {
  professional: Professional
  /** accepted + in_progress */
  activeJobs: number
  /** pending + confirmed + scheduled */
  pipelineJobs: number
  completedInSample: number
  cancelledInSample: number
  /** Mean hours from created → completed for completed rows in sample */
  avgCompletionHours: number | null
  workloadTotal: number
}

export interface FleetBookingAggregate {
  mergedBookings: Booking[]
  byStatus: Partial<Record<string, number>>
  assignedInSample: number
  unassignedInSample: number
  globalAvgCompletionHours: number | null
}

export function mergeBookingsById(lists: Booking[][]): Booking[] {
  const map = new Map<string, Booking>()
  for (const list of lists) {
    for (const b of list) {
      const id = bookingRowId(b)
      if (!id) continue
      map.set(id, b)
    }
  }
  return Array.from(map.values())
}

export function aggregateFleetBookings(bookings: Booking[]): FleetBookingAggregate {
  const byStatus: Partial<Record<string, number>> = {}
  let assignedInSample = 0
  let unassignedInSample = 0
  const completionHours: number[] = []

  for (const b of bookings) {
    const st = (b.status || 'unknown') as string
    byStatus[st] = (byStatus[st] || 0) + 1
    if (extractAssignedProfessionalId(b)) {
      assignedInSample += 1
    } else {
      unassignedInSample += 1
    }
    if (st === 'completed') {
      const h = hoursCreatedToCompleted(b)
      if (h != null) completionHours.push(h)
    }
  }

  const globalAvgCompletionHours =
    completionHours.length > 0
      ? completionHours.reduce((a, c) => a + c, 0) / completionHours.length
      : null

  return {
    mergedBookings: bookings,
    byStatus,
    assignedInSample,
    unassignedInSample,
    globalAvgCompletionHours,
  }
}

export function metricsPerProfessional(
  professionals: Professional[],
  bookings: Booking[],
): ProfessionalFleetMetrics[] {
  return professionals.map((professional) => {
    const mine = bookings.filter((b) => bookingAssignedToProfessional(b, professional))
    let activeJobs = 0
    let pipelineJobs = 0
    let completedInSample = 0
    let cancelledInSample = 0
    const completionHours: number[] = []

    for (const b of mine) {
      const st = (b.status || '') as string
      if (st === 'accepted' || st === 'in_progress') activeJobs += 1
      if (st === 'pending' || st === 'confirmed' || st === 'scheduled') pipelineJobs += 1
      if (st === 'completed') {
        completedInSample += 1
        const h = hoursCreatedToCompleted(b)
        if (h != null) completionHours.push(h)
      }
      if (st === 'cancelled') cancelledInSample += 1
    }

    const avgCompletionHours =
      completionHours.length > 0
        ? completionHours.reduce((a, c) => a + c, 0) / completionHours.length
        : null

    return {
      professional,
      activeJobs,
      pipelineJobs,
      completedInSample,
      cancelledInSample,
      avgCompletionHours,
      workloadTotal: mine.length,
    }
  })
}

export function fleetWorkloadLabel(m: ProfessionalFleetMetrics): string {
  const a = m.professional.availability
  if (a === 'offline') return 'Offline'
  if (a === 'busy') return 'Busy (availability)'
  if (m.activeJobs > 0) return 'On assignment'
  if (m.pipelineJobs > 0) return 'Queued work'
  return 'Available · idle'
}
