import type { Booking } from '../types'

/** Extract assigned professional id from various API shapes */
export function extractAssignedProfessionalId(booking: unknown): string | undefined {
  if (!booking || typeof booking !== 'object') return undefined
  const b = booking as Record<string, unknown>
  const direct = b.professionalId ?? b.professional_id
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  if (typeof direct === 'object' && direct && '_id' in (direct as object)) {
    const id = (direct as { _id?: string })._id
    if (id) return String(id)
  }
  const prof = b.professional
  if (prof && typeof prof === 'object') {
    const p = prof as Record<string, unknown>
    const pid = p._id ?? p.id
    if (typeof pid === 'string' && pid.trim()) return pid.trim()
    const slug = p.professionalId
    if (typeof slug === 'string' && slug.trim()) return slug.trim()
  }
  return undefined
}

/**
 * @param mongoId - Professional document id (URL param)
 * @param humanProfessionalId - e.g. `professionalId` display code when API stores that on the booking
 */
export function bookingMatchesProfessional(
  booking: Booking | Record<string, unknown>,
  mongoId: string,
  humanProfessionalId?: string,
): boolean {
  const assigned = extractAssignedProfessionalId(booking)
  if (assigned && assigned === mongoId) return true
  if (humanProfessionalId && assigned === humanProfessionalId) return true
  const prof = (booking as Booking).professional
  if (prof?._id && prof._id === mongoId) return true
  if (humanProfessionalId && prof?.professionalId === humanProfessionalId) return true
  return false
}
