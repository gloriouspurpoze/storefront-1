import type { ApiClient } from '../types'
import type { Booking } from '@profixer/types'
import { unwrapApiData } from '../unwrap'

/** Body for POST /api/bookings/admin — mobile quick-create (simplified POS). */
export interface AdminCreateBookingPayload {
  customerId: string
  professionalId?: string
  skipAutoAssign?: boolean
  scheduled_time: string
  notes?: string
  services?: Array<{
    serviceId: string
    quantity: number
    price: number
    name?: string
  }>
  posPricing: {
    lineSubtotal: number
    manualDiscount: number
    couponDiscount: number
    gstPercent: number
    gstApplied: boolean
  }
  address: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    phone: string
  }
  totalAmount: number
  paymentMethod?: string
  checkoutIdempotencyKey?: string
}

export type AdminCreateBookingResult = {
  booking: Booking
  message?: string
}

export function createPosService(api: ApiClient) {
  return {
    async adminCreateBooking(payload: AdminCreateBookingPayload) {
      const res = await api.post<unknown>('/bookings/admin', payload, {
        timeout: 60_000,
      })
      const data = unwrapApiData<{ booking?: Booking; message?: string }>(res.data ?? res)
      if (!data?.booking) {
        throw new Error('Booking was not returned by the server')
      }
      return { booking: data.booking, message: data.message ?? res.message }
    },
  }
}

export type PosService = ReturnType<typeof createPosService>
