import { getDefaultTenantIdFromEnv } from './saasEnv'

/** Consumer site origin for customer-facing links (not admin host). */
export function getConsumerSiteOrigin(): string {
  const fromEnv =
    process.env.REACT_APP_PUBLIC_SITE_ORIGIN?.trim() ||
    process.env.REACT_APP_CONSUMER_SITE_URL?.trim() ||
    ''
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://www.profixer.in'
}

/** Short ref shown at counter (last 8 hex of booking id). */
export function bookingTrackRefFromId(bookingId: string): string {
  return String(bookingId || '')
    .replace(/\W/g, '')
    .slice(-8)
    .toUpperCase()
}

export function buildBookingTrackPageUrl(input: {
  bookingId: string
  phone?: string
  token?: string
  tenantId?: string | null
}): string {
  const ref = bookingTrackRefFromId(input.bookingId)
  const origin = getConsumerSiteOrigin()
  const url = new URL(`${origin}/track-booking`)
  url.searchParams.set('ref', ref)
  if (input.phone?.trim()) {
    url.searchParams.set('phone', input.phone.trim())
  }
  if (input.token?.trim()) {
    url.searchParams.set('token', input.token.trim())
  }
  const tenant = input.tenantId ?? getDefaultTenantIdFromEnv()
  if (tenant) {
    url.searchParams.set('tenant', tenant)
  }
  return url.toString()
}
