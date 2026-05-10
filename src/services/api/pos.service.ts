import { api } from './base'
import type { Booking } from '../../types'

/** Body for POST /api/bookings/admin — matches customer direct booking + admin fields. */
export interface AdminPosCreateBookingPayload {
  customerId: string
  professionalId?: string
  skipAutoAssign?: boolean
  scheduled_time: string
  notes?: string
  services?: Array<{
    serviceId: string
    variantId?: string
    quantity: number
    price: number
    name?: string
    serviceName?: string
  }>
  parts?: Array<{
    productId: string
    quantity: number
    price: number
    name?: string
  }>
  couponCode?: string
  /** Server verifies totals (required with parts / coupon / split / strict checkout). */
  posPricing: {
    lineSubtotal: number
    manualDiscount: number
    couponDiscount: number
    gstPercent: number
    gstApplied: boolean
  }
  splitTender?: Array<{ method: string; amount: number }>
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

export type AdminPosCreateResult = {
  booking: Booking
  message: string
}

export class PosService {
  static async adminCreateBooking(payload: AdminPosCreateBookingPayload) {
    return api.post<AdminPosCreateResult>('/bookings/admin', payload, {
      loadingMessage: 'Creating booking…',
      successMessage: 'Home service job registered.',
      errorMessage: 'Could not create booking.',
      /** POS maps API message into a contextual toast (avoid duplicate generic snackbar). */
      showErrorToast: false,
    })
  }
}
