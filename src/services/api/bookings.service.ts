import { api } from './base'
import type {
  Booking,
  UpdateBookingStatusRequest,
  BookingsResponse,
  BookingsQuery,
} from '../../types'

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
   * Start work on booking (Professional/Provider)
   * Tries multiple endpoint patterns
   */
  static async startBooking(id: string, notes?: string) {
    // Try different endpoint patterns
    const endpoints = [
      `/bookings/provider/${id}/start`,
      `/bookings/${id}/start`,
      `/bookings/provider/${id}/status`,
      `/bookings/${id}/status`,
    ]
    
    let lastError: any = null
    
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i]
      const isLast = i === endpoints.length - 1
      
      try {
        const result = await api.patch<Booking>(endpoint, { 
          status: 'in_progress',
          notes 
        }, {
          loadingMessage: i === 0 ? 'Starting work...' : undefined, // Only show loading on first attempt
          successMessage: 'Work started successfully!',
          errorMessage: 'Failed to start work.',
          showErrorToast: false, // Don't show toast on individual attempts
          showLoading: i === 0, // Only show loading on first attempt
        })
        
        // If successful, return immediately
        if (result.success) {
          return result
        }
      } catch (err: any) {
        lastError = err
        
        // Check if it's a 404/not found error
        const is404 = err.status === 404 || 
                     (err as any)?.code === 'NOT_FOUND' ||
                     err.message?.toLowerCase().includes('not found') ||
                     err.message?.toLowerCase().includes('404')
        
        // If it's not a 404, throw immediately (don't try other endpoints)
        if (!is404) {
          throw err
        }
        
        // If this is the last endpoint and it's a 404, throw a helpful error
        if (isLast) {
          throw new Error('Unable to start work. The booking status update endpoint is not available on the server. Please contact support or check if the backend API is properly configured.')
        }
        
        // Otherwise, continue to next endpoint
        continue
      }
    }
    
    // This should never be reached, but just in case
    throw lastError || new Error('No valid endpoint found to start booking')
  }

  /**
   * Complete booking (Professional/Provider)
   * Tries multiple endpoint patterns
   * Note: Backend should handle payment completion and admin notification
   */
  static async completeBooking(id: string, notes?: string, options?: {
    notifyAdmin?: boolean
    notifyCustomer?: boolean
  }) {
    // Try different endpoint patterns
    const endpoints = [
      `/bookings/provider/${id}/complete`,
      `/bookings/${id}/complete`,
      `/bookings/provider/${id}/status`,
      `/bookings/${id}/status`,
    ]
    
    let lastError: any = null
    
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i]
      const isLast = i === endpoints.length - 1
      
      try {
        // For status endpoints, use PATCH with status: 'completed'
        // For complete endpoints, use PUT with notes
        const isStatusEndpoint = endpoint.includes('/status')
        const body = isStatusEndpoint 
          ? { 
              status: 'completed', 
              notes,
              notifyAdmin: options?.notifyAdmin !== false,
              notifyCustomer: options?.notifyCustomer !== false,
            }
          : { 
              notes,
              notifyAdmin: options?.notifyAdmin !== false,
              notifyCustomer: options?.notifyCustomer !== false,
            }
        
        let result: any
        if (isStatusEndpoint) {
          result = await api.patch<Booking>(endpoint, body, {
            loadingMessage: i === 0 ? 'Completing booking...' : undefined,
            successMessage: 'Booking completed successfully!',
            errorMessage: 'Failed to complete booking.',
            showErrorToast: false,
            showLoading: i === 0,
          })
        } else {
          result = await api.put<Booking>(endpoint, body, {
            loadingMessage: i === 0 ? 'Completing booking...' : undefined,
            successMessage: 'Booking completed successfully!',
            errorMessage: 'Failed to complete booking.',
            showErrorToast: false,
            showLoading: i === 0,
          })
        }
        
        // If successful, return immediately
        if (result.success) {
          return result
        }
      } catch (err: any) {
        lastError = err
        
        // Check if it's a 404/not found error
        const is404 = err.status === 404 || 
                     (err as any)?.code === 'NOT_FOUND' ||
                     err.message?.toLowerCase().includes('not found') ||
                     err.message?.toLowerCase().includes('404')
        
        // If it's not a 404, throw immediately (don't try other endpoints)
        if (!is404) {
          throw err
        }
        
        // If this is the last endpoint and it's a 404, throw a helpful error
        if (isLast) {
          throw new Error('Unable to complete booking. The booking completion endpoint is not available on the server. Please contact support or check if the backend API is properly configured.')
        }
        
        // Otherwise, continue to next endpoint
        continue
      }
    }
    
    // This should never be reached, but just in case
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
   * Note: Uses same endpoint as provider, backend differentiates by JWT userType
   */
  static async getProfessionalBookings(query: BookingsQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    // Backend uses same endpoint but routes to different service based on JWT userType
    const endpoint = `/bookings/provider/my-bookings${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<BookingsResponse>(endpoint, {
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
}
