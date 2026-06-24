import { TENANT_HEADER, getDefaultTenantIdFromEnv } from '../../lib/saasEnv'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

export interface PublicBookingTrackResult {
  bookingRef: string
  bookingId: string
  status: string
  paymentStatus: string
  scheduledDate: string
  totalAmount: number
  serviceName: string
  customerName?: string
  professionalName?: string
  address?: { city?: string; state?: string }
  createdAt: string
  updatedAt: string
}

export async function trackPublicBooking(input: {
  ref: string
  phone?: string
  token?: string
  tenantId?: string | null
}): Promise<{
  success: boolean
  data?: PublicBookingTrackResult
  message?: string
}> {
  const ref = input.ref.trim()
  if (!ref) {
    return { success: false, message: 'Booking reference is required' }
  }
  if (!input.phone?.trim() && !input.token?.trim()) {
    return { success: false, message: 'Mobile number or track token is required' }
  }

  const qs = new URLSearchParams()
  qs.set('ref', ref)
  if (input.phone?.trim()) qs.set('phone', input.phone.trim())
  if (input.token?.trim()) qs.set('token', input.token.trim())

  const tenantId = input.tenantId ?? getDefaultTenantIdFromEnv() ?? undefined

  const res = await fetch(`${API_BASE_URL}/public/bookings/track?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(tenantId ? { [TENANT_HEADER]: tenantId } : {}),
    },
  })

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    message?: string
    data?: PublicBookingTrackResult
  }

  if (!res.ok || !json.success || !json.data) {
    return {
      success: false,
      message: json.message || 'Booking not found. Check the reference and mobile number.',
    }
  }

  return { success: true, data: json.data, message: json.message }
}
