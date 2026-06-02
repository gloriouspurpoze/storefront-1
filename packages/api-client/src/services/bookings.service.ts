import type { ApiClient } from '../types'
import type {
  Booking,
  BookingsQuery,
  BookingsResponse,
  UpdateBookingStatusRequest,
} from '@profixer/types'

function clampLimit(query: BookingsQuery): BookingsQuery {
  const safe = { ...query }
  if (safe.limit != null) {
    const n = Number(safe.limit)
    safe.limit = !Number.isFinite(n) ? 25 : Math.min(100, Math.max(1, Math.floor(n)))
  }
  return safe
}

export function createBookingsService(api: ApiClient) {
  return {
    getBookings: (query: BookingsQuery = {}) => {
      const safeQuery = clampLimit(query)
      return api.get<BookingsResponse>('/bookings', { params: safeQuery as Record<string, unknown> })
    },
    getBooking: (id: string) => api.get<Booking>(`/bookings/${id}`),
    updateBookingStatus: (id: string, statusData: UpdateBookingStatusRequest) =>
      api.patch<Booking>(`/bookings/${id}/status`, statusData),
    cancelBooking: (id: string, reason?: string) =>
      api.patch<Booking>(`/bookings/${id}/cancel`, { reason }),
    assignProfessional: (
      bookingId: string,
      professionalId: string,
      options?: { notifyProfessional?: boolean; notifyCustomer?: boolean },
    ) =>
      api.patch<Booking>(`/bookings/${bookingId}/assign-professional`, {
        professionalId,
        notifyProfessional: options?.notifyProfessional !== false,
        notifyCustomer: options?.notifyCustomer !== false,
      }),
    unassignProfessional: (bookingId: string) =>
      api.patch<Booking>(`/bookings/${bookingId}/unassign-professional`, {}),
    getProviderMyBookings: (query: BookingsQuery = {}) =>
      api.get<BookingsResponse | Booking[]>('/bookings/provider/my-bookings', {
        params: query as Record<string, unknown>,
      }),
    getProfessionalMyBookings: (query: BookingsQuery = {}) =>
      api.get<BookingsResponse | Booking[]>('/bookings/professional/my-bookings', {
        params: query as Record<string, unknown>,
      }),
  }
}

export type BookingsService = ReturnType<typeof createBookingsService>
