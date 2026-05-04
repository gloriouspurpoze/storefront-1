import { api } from './base'
import type {
  Booking,
  UpdateBookingStatusRequest,
  BookingsResponse,
  BookingsQuery,
} from '../../types'
import { bookingMatchesProfessional } from '../../lib/proBookingResolution'

/**
 * Bookings Service
 * Handles all booking-related API calls
 */
export class BookingsService {
  /**
   * Get bookings with pagination and filters
   */
  static async getBookings(query: BookingsQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/bookings${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<BookingsResponse>(endpoint, {
      loadingMessage: 'Loading bookings...',
      showSuccessToast: false,
    })
  }

  /**
   * Get single booking by ID
   */
  static async getBooking(id: string) {
    return api.get<Booking>(`/bookings/${id}`, {
      loadingMessage: 'Loading booking...',
      showSuccessToast: false,
    })
  }

  /**
   * Update booking status
   * Note: For professionals, this may need to use a different endpoint
   */
  static async updateBookingStatus(id: string, statusData: UpdateBookingStatusRequest) {
    return api.patch<Booking>(`/bookings/${id}/status`, statusData, {
      loadingMessage: 'Updating booking status...',
      successMessage: 'Booking status updated successfully!',
      errorMessage: 'Failed to update booking status.',
    })
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(id: string, reason?: string) {
    return api.patch<Booking>(`/bookings/${id}/cancel`, { reason }, {
      loadingMessage: 'Cancelling booking...',
      successMessage: 'Booking cancelled successfully!',
      errorMessage: 'Failed to cancel booking.',
    })
  }

  /**
   * Reschedule booking
   */
  static async rescheduleBooking(id: string, newDate: string, newTime: string) {
    return api.put<Booking>(`/bookings/${id}/reschedule`, { 
      scheduledDate: newDate, 
      scheduledTime: newTime 
    }, {
      loadingMessage: 'Rescheduling booking...',
      successMessage: 'Booking rescheduled successfully!',
      errorMessage: 'Failed to reschedule booking.',
    })
  }

  /**
   * Start work on booking (Professional/Provider).
   * Uses PATCH /bookings/:id/start (notifies customer + admin), fallback to PATCH /bookings/:id/status.
   */
  static async startBooking(id: string, notes?: string) {
    const body = notes ? { status: 'in_progress', notes } : { status: 'in_progress' }
    const opts = {
      loadingMessage: 'Starting work...',
      successMessage: 'Work started. Customer and admin have been notified.',
      errorMessage: 'Failed to start work.',
    }

    try {
      const result = await api.patch<Booking>(`/bookings/${id}/start`, body, opts)
      if (result?.success) return result
    } catch (err: any) {
      const is404 = err?.status === 404 || err?.message?.toLowerCase().includes('not found')
      if (!is404) throw err
    }

    try {
      return await api.patch<Booking>(`/bookings/${id}/status`, body, {
        ...opts,
        successMessage: 'Work started successfully!',
      })
    } catch {
      throw new Error('Unable to start work. Please try again or contact support.')
    }
  }

  /**
   * Complete booking (Professional/Provider)
   * Uses PUT/PATCH /bookings/provider/:id/complete or /bookings/:id/complete with payment option.
   * Backend sets status to completed and updates payment status when paymentReceived is 'cash'.
   */
  static async completeBooking(
    id: string,
    notes?: string,
    options?: {
      notifyAdmin?: boolean
      notifyCustomer?: boolean
      /** How the customer paid: cash (mark paid on complete) or online (default). */
      paymentReceived?: 'cash' | 'online'
    }
  ) {
    const paymentReceived = options?.paymentReceived ?? 'online'
    /** Backend requires completion evidence (notes or photos); admin/web may omit—use audit default. */
    const completionNotes = (notes?.trim() || 'Completion confirmed from admin / web panel.')
    const endpoints = [
      `/bookings/provider/${id}/complete`,
      `/bookings/${id}/complete`,
      `/bookings/provider/${id}/status`,
      `/bookings/${id}/status`,
    ]

    const bodyComplete = {
      notes: completionNotes,
      notifyAdmin: options?.notifyAdmin !== false,
      notifyCustomer: options?.notifyCustomer !== false,
      paymentReceived,
    }
    const bodyStatus = {
      status: 'completed',
      notes: completionNotes,
      notifyAdmin: options?.notifyAdmin !== false,
      notifyCustomer: options?.notifyCustomer !== false,
    }

    let lastError: any = null

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i]
      const isLast = i === endpoints.length - 1
      const isStatusEndpoint = endpoint.includes('/status')

      try {
        const body = isStatusEndpoint ? bodyStatus : bodyComplete
        const result = isStatusEndpoint
          ? await api.patch<Booking>(endpoint, body, {
              loadingMessage: i === 0 ? 'Completing booking...' : undefined,
              successMessage: 'Booking completed successfully!',
              errorMessage: 'Failed to complete booking.',
              showErrorToast: false,
              showLoading: i === 0,
            })
          : await api.put<Booking>(endpoint, body, {
              loadingMessage: i === 0 ? 'Completing booking...' : undefined,
              successMessage: 'Booking completed successfully!',
              errorMessage: 'Failed to complete booking.',
              showErrorToast: false,
              showLoading: i === 0,
            })

        if (result.success) return result
      } catch (err: any) {
        lastError = err
        const is404 =
          err.status === 404 ||
          (err as any)?.code === 'NOT_FOUND' ||
          err.message?.toLowerCase().includes('not found') ||
          err.message?.toLowerCase().includes('404')
        if (!is404) throw err
        if (isLast) {
          throw new Error(
            'Unable to complete booking. The booking completion endpoint is not available on the server. Please contact support or check if the backend API is properly configured.'
          )
        }
      }
    }

    throw lastError || new Error('No valid endpoint found to complete booking')
  }

  /**
   * Get bookings by customer
   */
  static async getBookingsByCustomer(customerId: string, query: Omit<BookingsQuery, 'customerId'> = {}) {
    return this.getBookings({
      ...query,
      customerId,
    })
  }

  /**
   * Get bookings by provider
   */
  static async getBookingsByProvider(providerId: string, query: Omit<BookingsQuery, 'providerId'> = {}) {
    return this.getBookings({
      ...query,
      providerId,
    })
  }

  /**
   * Get bookings by status
   */
  static async getBookingsByStatus(status: string, query: Omit<BookingsQuery, 'status'> = {}) {
    return this.getBookings({
      ...query,
      status,
    })
  }

  /**
   * Get scheduled bookings
   */
  static async getScheduledBookings(query: Omit<BookingsQuery, 'status'> = {}) {
    return this.getBookingsByStatus('scheduled', query)
  }

  /**
   * Get in-progress bookings
   */
  static async getInProgressBookings(query: Omit<BookingsQuery, 'status'> = {}) {
    return this.getBookingsByStatus('in_progress', query)
  }

  /**
   * Get completed bookings
   */
  static async getCompletedBookings(query: Omit<BookingsQuery, 'status'> = {}) {
    return this.getBookingsByStatus('completed', query)
  }

  /**
   * Get cancelled bookings
   */
  static async getCancelledBookings(query: Omit<BookingsQuery, 'status'> = {}) {
    return this.getBookingsByStatus('cancelled', query)
  }

  /**
   * Mark payment as received for a booking
   * Updates booking payment status to 'paid'
   */
  static async markPaymentReceived(bookingId: string, options?: {
    amount?: number
    paymentMethod?: string
    notes?: string
    notifyCustomer?: boolean
    notifyAdmin?: boolean
  }) {
    const endpoints = [
      `/bookings/${bookingId}/payment/mark-received`,
      `/bookings/${bookingId}/payment/received`,
      `/bookings/provider/${bookingId}/payment/mark-received`,
      `/bookings/${bookingId}`,
      `/bookings/provider/${bookingId}`,
    ]
    
    let lastError: any = null
    
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i]
      const isLast = i === endpoints.length - 1
      
      try {
        const isUpdateEndpoint = endpoint === `/bookings/${bookingId}` || endpoint === `/bookings/provider/${bookingId}`
        const body = isUpdateEndpoint
          ? { paymentStatus: 'paid', ...options }
          : { 
              status: 'paid',
              paymentStatus: 'paid',
              amount: options?.amount,
              paymentMethod: options?.paymentMethod || 'cash',
              notes: options?.notes,
              notifyCustomer: options?.notifyCustomer !== false,
              notifyAdmin: options?.notifyAdmin !== false,
            }
        
        let result: any
        if (isUpdateEndpoint) {
          result = await api.patch(endpoint, body)
        } else {
          result = await api.post(endpoint, body)
        }
        
        if (result && (result.success !== false)) {
          return { success: true, data: result.data || result, message: 'Payment marked as received successfully' }
        }
      } catch (err: any) {
        lastError = err
        if (!isLast) continue
        throw err
      }
    }
    
    throw lastError || new Error('Failed to mark payment as received')
  }

  /**
   * Get bookings by date range
   */
  static async getBookingsByDateRange(startDate: string, endDate: string, query: Omit<BookingsQuery, 'startDate' | 'endDate'> = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    params.append('startDate', startDate)
    params.append('endDate', endDate)

    const endpoint = `/bookings/date-range${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<BookingsResponse>(endpoint, {
      loadingMessage: 'Loading bookings...',
      showSuccessToast: false,
    })
  }

  /**
   * Get today's bookings
   */
  static async getTodaysBookings(query: Omit<BookingsQuery, 'date'> = {}) {
    const today = new Date().toISOString().split('T')[0]
    return this.getBookingsByDateRange(today, today, query)
  }

  /**
   * Get upcoming bookings
   */
  static async getUpcomingBookings(days: number = 7, query: Omit<BookingsQuery, 'upcoming'> = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    params.append('days', days.toString())

    const endpoint = `/bookings/upcoming${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<BookingsResponse>(endpoint, {
      loadingMessage: 'Loading upcoming bookings...',
      showSuccessToast: false,
    })
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats() {
    return api.get<{
      total: number
      byStatus: Record<string, number>
      totalRevenue: number
      averageBookingValue: number
      completionRate: number
      cancellationRate: number
      monthlyStats: Array<{
        month: string
        bookings: number
        revenue: number
      }>
    }>('/bookings/stats', {
      loadingMessage: 'Loading booking statistics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get bookings for dashboard
   */
  static async getBookingsForDashboard(limit: number = 10) {
    return api.get<{
      recentBookings: Booking[]
      upcomingBookings: Booking[]
      todayBookings: Booking[]
      stats: {
        total: number
        scheduled: number
        inProgress: number
        completed: number
        cancelled: number
      }
    }>(`/bookings/dashboard?limit=${limit}`, {
      loadingMessage: 'Loading dashboard data...',
      showSuccessToast: false,
    })
  }

  /**
   * Get provider's bookings (Provider only)
   * Note: This endpoint also works for professionals - the backend routes based on userType
   */
  static async getProviderBookings(query: BookingsQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/bookings/provider/my-bookings${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<BookingsResponse>(endpoint, {
      loadingMessage: 'Loading bookings...',
      showSuccessToast: false,
    })
  }

  /**
   * Get professional's bookings (Professional only)
   * Tries professional-specific endpoint first; falls back to provider endpoint if backend
   * uses a single route that differentiates by JWT userType.
   */
  static async getProfessionalBookings(query: BookingsQuery = {}) {
    const params = new URLSearchParams()
    const limit = query.limit != null ? Math.min(Number(query.limit), 100) : 100
    const safeQuery = { ...query, limit }
    Object.entries(safeQuery).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    const queryString = params.toString() ? `?${params.toString()}` : ''

    // 1) Try professional-specific endpoint (bookings where current user is assigned professional)
    try {
      const professionalEndpoint = `/bookings/professional/my-bookings${queryString}`
      const res = await api.get<BookingsResponse>(professionalEndpoint, {
        loadingMessage: 'Loading your bookings...',
        showSuccessToast: false,
      })
      if (res?.success !== false) return res
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status
      const is404 = status === 404
      const is4xx = status >= 400 && status < 500
      // If endpoint doesn't exist (404) or other client error, try fallback
      if (!is4xx || is404) {
        // 2) Fallback: same as provider my-bookings (backend may use JWT userType to return professional's bookings)
        const fallbackEndpoint = `/bookings/provider/my-bookings${queryString}`
        return api.get<BookingsResponse>(fallbackEndpoint, {
          loadingMessage: 'Loading your bookings...',
          showSuccessToast: false,
        })
      }
      throw err
    }

    // If success was false but no throw, still try fallback once
    const fallbackEndpoint = `/bookings/provider/my-bookings${queryString}`
    return api.get<BookingsResponse>(fallbackEndpoint, {
      loadingMessage: 'Loading your bookings...',
      showSuccessToast: false,
    })
  }

  /**
   * Update booking status (Professional/Provider version)
   * Uses provider endpoint which works for both providers and professionals
   */
  static async updateProfessionalBookingStatus(id: string, statusData: UpdateBookingStatusRequest) {
    // Try provider endpoint first (works for professionals too based on JWT)
    return api.patch<Booking>(`/bookings/provider/${id}/status`, statusData, {
      loadingMessage: 'Updating booking status...',
      successMessage: 'Booking status updated successfully!',
      errorMessage: 'Failed to update booking status.',
    })
  }

  /**
   * Get provider's upcoming bookings (Provider only)
   */
  static async getProviderUpcomingBookings() {
    return api.get<Booking[]>('/bookings/provider/upcoming', {
      loadingMessage: 'Loading upcoming bookings...',
      showSuccessToast: false,
    })
  }

  /**
   * Get provider's booking statistics (Provider only)
   */
  static async getProviderBookingStats() {
    return api.get<{
      totalBookings: number
      pendingBookings: number
      acceptedBookings: number
      inProgressBookings: number
      completedBookings: number
      cancelledBookings: number
      totalEarnings: number
      averageRating: number
      totalReviews: number
      responseRate: number
    }>('/bookings/provider/stats', {
      loadingMessage: 'Loading booking statistics...',
      showSuccessToast: false,
    })
  }

  /**
   * Assign provider to booking (Admin only)
   */
  static async assignProvider(
    bookingId: string,
    providerId: string,
    options: {
      notifyProvider?: boolean
      notifyCustomer?: boolean
    } = {}
  ) {
    return api.post<Booking>(`/bookings/${bookingId}/assign-provider`, {
      providerId,
      notifyProvider: options.notifyProvider !== false,
      notifyCustomer: options.notifyCustomer !== false,
    }, {
      loadingMessage: 'Assigning provider...',
      successMessage: 'Provider assigned successfully!',
      errorMessage: 'Failed to assign provider.',
    })
  }

  /**
   * Update booking status (Admin version with notifications)
   */
  static async adminUpdateBookingStatus(
    bookingId: string,
    status: string,
    options: {
      notes?: string
      notifyCustomer?: boolean
      notifyProvider?: boolean
    } = {}
  ) {
    return api.patch<Booking>(`/bookings/${bookingId}/admin-status`, {
      status,
      notes: options.notes,
      notifyCustomer: options.notifyCustomer !== false,
      notifyProvider: options.notifyProvider !== false,
    }, {
      loadingMessage: 'Updating booking status...',
      successMessage: 'Booking status updated successfully!',
      errorMessage: 'Failed to update booking status.',
    })
  }

  /**
   * Assign professional to booking (Admin only)
   */
  static async assignProfessional(
    bookingId: string,
    professionalId: string,
    options: {
      notifyProfessional?: boolean
      notifyCustomer?: boolean
    } = {}
  ) {
    return api.patch<Booking>(`/bookings/${bookingId}/assign-professional`, {
      professionalId,
      notifyProfessional: options.notifyProfessional !== false,
      notifyCustomer: options.notifyCustomer !== false,
    }, {
      loadingMessage: 'Assigning professional...',
      successMessage: 'Professional assigned successfully!',
      errorMessage: 'Failed to assign professional.',
    })
  }

  /**
   * Unassign professional from booking (Admin only)
   */
  static async unassignProfessional(bookingId: string) {
    return api.patch<Booking>(`/bookings/${bookingId}/unassign-professional`, {}, {
      loadingMessage: 'Unassigning professional...',
      successMessage: 'Professional unassigned successfully!',
      errorMessage: 'Failed to unassign professional.',
    })
  }

  /**
   * Admin: record a partial refund on the booking (ledger / support; no payment gateway).
   */
  static async recordAdminPartialRefund(bookingId: string, amount: number, reason: string) {
    return api.post<{ booking?: Booking; message?: string }>(
      `/bookings/${bookingId}/admin-partial-refund`,
      { amount, reason },
      {
        loadingMessage: 'Recording partial refund…',
        successMessage: 'Partial refund recorded.',
        errorMessage: 'Failed to record partial refund.',
      }
    )
  }

  /**
   * Get booking details with full populated data (Admin only)
   */
  static async getBookingDetails(id: string) {
    return api.get<any>(`/bookings/${id}`, {
      loadingMessage: 'Loading booking details...',
      showSuccessToast: false,
    })
  }

  /**
   * Delete booking (Admin only)
   */
  static async deleteBooking(id: string) {
    return api.delete<void>(`/bookings/${id}`, {
      loadingMessage: 'Deleting booking...',
      successMessage: 'Booking deleted successfully!',
      errorMessage: 'Failed to delete booking.',
    })
  }

  /**
   * Admin hub: resolve bookings for a professional using multiple server query shapes,
   * optional dedicated admin route, then a bounded client-side filter as last resort.
   */
  static async getBookingsForProfessionalAdmin(
    mongoProfessionalId: string,
    humanProfessionalId: string | undefined,
    query: BookingsQuery = {},
  ): Promise<{
    api: Awaited<ReturnType<typeof BookingsService.getBookings>>
    loadMeta: {
      strategy: 'query_professionalId' | 'query_professional_id' | 'admin_route' | 'client_slice' | 'empty'
      warning?: string
    }
  }> {
    const page = query.page ?? 1
    const limit = query.limit ?? 25
    const base: BookingsQuery = { ...query, page, limit }

    const payloadOf = (res: Awaited<ReturnType<typeof BookingsService.getBookings>>) =>
      (res.data || {}) as BookingsResponse

    const isConsistentAssignment = (res: Awaited<ReturnType<typeof BookingsService.getBookings>>) => {
      if (!res.success) return false
      const { bookings = [] } = payloadOf(res)
      if (bookings.length === 0) return true
      return bookings.every((b) => bookingMatchesProfessional(b, mongoProfessionalId, humanProfessionalId))
    }

    const hasRows = (res: Awaited<ReturnType<typeof BookingsService.getBookings>>) => {
      if (!res.success) return false
      const { bookings = [], pagination } = payloadOf(res)
      const total = pagination?.total ?? 0
      return bookings.length > 0 || total > 0
    }

    let r = await this.getBookings({ ...base, professionalId: mongoProfessionalId })
    if (hasRows(r) && isConsistentAssignment(r)) {
      return { api: r, loadMeta: { strategy: 'query_professionalId' } }
    }

    r = await this.getBookings({ ...base, professional_id: mongoProfessionalId } as BookingsQuery)
    if (hasRows(r) && isConsistentAssignment(r)) {
      return { api: r, loadMeta: { strategy: 'query_professional_id' } }
    }

    try {
      const params = new URLSearchParams()
      Object.entries(base).forEach(([k, v]) => {
        if (v !== undefined && v !== null && k !== 'professionalId' && k !== 'professional_id') {
          params.append(k, String(v))
        }
      })
      const qs = params.toString()
      const adminUrl = `/bookings/admin/professional/${mongoProfessionalId}${qs ? `?${qs}` : ''}`
      const adminRes = await api.get<BookingsResponse>(adminUrl, {
        loadingMessage: 'Loading bookings...',
        showSuccessToast: false,
      })
      if (adminRes.success && hasRows(adminRes) && isConsistentAssignment(adminRes)) {
        return { api: adminRes, loadMeta: { strategy: 'admin_route' } }
      }
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      if (status && status !== 404) {
        /* fall through */
      }
    }

    const MAX = 150
    const wide = await this.getBookings({
      page: 1,
      limit: MAX,
      status: base.status,
      dateFrom: base.dateFrom,
      dateTo: base.dateTo,
      source: base.source,
    })
    const all = payloadOf(wide).bookings ?? []
    const matched = all.filter((b) => bookingMatchesProfessional(b, mongoProfessionalId, humanProfessionalId))
    const pageSize = Number(limit) || 25
    const p = Number(page) || 1
    const start = (p - 1) * pageSize
    const slice = matched.slice(start, start + pageSize)
    const warning =
      matched.length === 0
        ? 'No assigned bookings found. Ensure the API exposes assignment fields (professional / professionalId) and supports GET /bookings?professionalId=… or GET /bookings/admin/professional/:id.'
        : 'Server did not return a professional-scoped list. Showing matches from the latest ' +
          MAX +
          ' bookings (client-side filter; totals are approximate).'

    return {
      api: {
        success: true,
        data: {
          bookings: slice,
          pagination: {
            page: p,
            limit: pageSize,
            total: matched.length,
            totalPages: Math.max(1, Math.ceil(matched.length / pageSize)),
          },
        },
        message: wide.message || 'OK',
      },
      loadMeta: {
        strategy: matched.length === 0 ? 'empty' : 'client_slice',
        warning,
      },
    }
  }
}
