import type { Booking, BookingsQuery, BookingsResponse } from '@profixer/types'
import { services } from '@/services/createMobileClient'
import { baseApi } from '@/store/api/baseApi'

function normalizeBookingsList(data: unknown): BookingsResponse {
  if (data && typeof data === 'object' && Array.isArray((data as BookingsResponse).bookings)) {
    return data as BookingsResponse
  }
  if (Array.isArray(data)) {
    return {
      bookings: data as Booking[],
      pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    }
  }
  return { bookings: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } }
}

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBookings: build.query<BookingsResponse, BookingsQuery | void>({
      async queryFn(query) {
        try {
          const res = await services.bookings.getBookings(query ?? {})
          return { data: normalizeBookingsList(res.data) }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.bookings.map((b) => ({ type: 'Booking' as const, id: b.id || b._id })),
              { type: 'Bookings', id: 'LIST' },
            ]
          : [{ type: 'Bookings', id: 'LIST' }],
    }),
    getBooking: build.query<Booking, string>({
      async queryFn(id) {
        try {
          const res = await services.bookings.getBooking(id)
          // Backend wraps single booking as `{ booking: {...} }` (matches web admin
          // `response.data.booking || response.data`). Unwrap so detail fields render.
          const payload = res.data as Booking | { booking: Booking }
          const booking =
            payload && typeof payload === 'object' && 'booking' in payload
              ? (payload as { booking: Booking }).booking
              : (payload as Booking)
          return { data: booking }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Booking', id }],
    }),
    updateBookingStatus: build.mutation<
      Booking,
      { id: string; status: Booking['status']; notes?: string }
    >({
      async queryFn({ id, status, notes }) {
        try {
          const res = await services.bookings.updateBookingStatus(id, { status, notes })
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Booking', id }, { type: 'Bookings', id: 'LIST' }],
    }),
    assignProfessional: build.mutation<
      Booking,
      { bookingId: string; professionalId: string }
    >({
      async queryFn({ bookingId, professionalId }) {
        try {
          const res = await services.bookings.assignProfessional(bookingId, professionalId)
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { bookingId }) => [
        { type: 'Booking', id: bookingId },
        { type: 'Bookings', id: 'LIST' },
      ],
    }),
    cancelBooking: build.mutation<Booking, { id: string; reason?: string }>({
      async queryFn({ id, reason }) {
        try {
          const res = await services.bookings.cancelBooking(id, reason)
          return { data: res.data }
        } catch (error) {
          return { error: error as never }
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Booking', id }, { type: 'Bookings', id: 'LIST' }],
    }),
    getProviderBookings: build.query<BookingsResponse, BookingsQuery | void>({
      async queryFn(query) {
        try {
          const res = await services.bookings.getProviderMyBookings(query ?? {})
          return { data: normalizeBookingsList(res.data) }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'ProviderBookings', id: 'LIST' }],
    }),
    getProfessionalBookings: build.query<BookingsResponse, BookingsQuery | void>({
      async queryFn(query) {
        try {
          const res = await services.bookings.getProfessionalMyBookings(query ?? {})
          return { data: normalizeBookingsList(res.data) }
        } catch (error) {
          return { error: error as never }
        }
      },
      providesTags: [{ type: 'ProfessionalBookings', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetBookingsQuery,
  useGetBookingQuery,
  useUpdateBookingStatusMutation,
  useAssignProfessionalMutation,
  useCancelBookingMutation,
  useGetProviderBookingsQuery,
  useGetProfessionalBookingsQuery,
} = bookingsApi
