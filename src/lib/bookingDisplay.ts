/** 24-char hex MongoDB ObjectId */
const OBJECT_ID_LIKE = /^[a-f\d]{24}$/i

export function isLikelyMongoObjectId(s: string | undefined | null): boolean {
  if (s == null || typeof s !== 'string') return false
  return OBJECT_ID_LIKE.test(s.trim())
}

/** Canonical document id for routing, APIs, and clipboard */
export function bookingMongoId(booking: { id?: string; _id?: string }): string {
  return String(booking.id ?? booking._id ?? '').trim()
}

/**
 * Primary label for tables and hero titles.
 * Uses real booking numbers when present; treats ObjectId-shaped strings as internal only.
 */
export function bookingDisplayPrimary(booking: {
  id?: string
  _id?: string
  bookingNumber?: string | null
  bookingId?: string | null
}): string {
  const mongo = bookingMongoId(booking)
  const fromApi = [booking.bookingNumber?.trim(), booking.bookingId?.trim()].filter(Boolean) as string[]

  for (const c of fromApi) {
    if (!isLikelyMongoObjectId(c)) return c
  }

  if (mongo && isLikelyMongoObjectId(mongo)) return `BKG-${mongo.slice(-8).toUpperCase()}`
  return fromApi[0] || mongo || '—'
}

/** Resolve stored/display booking id field from API payload */
export function resolveBookingIdLabel(apiBooking: {
  _id?: string
  id?: string
  bookingNumber?: string | null
  bookingId?: string | null
}): string {
  const oid = String(apiBooking._id || apiBooking.id || '').trim()
  const rawNum = String(apiBooking.bookingNumber ?? apiBooking.bookingId ?? '').trim()
  if (rawNum && !isLikelyMongoObjectId(rawNum)) return rawNum
  if (oid && isLikelyMongoObjectId(oid)) return `BKG-${oid.slice(-8).toUpperCase()}`
  if (rawNum) return `BKG-${rawNum.slice(-8).toUpperCase()}`
  return oid || '—'
}
