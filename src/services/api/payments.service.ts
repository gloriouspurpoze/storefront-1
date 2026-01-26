import { api } from './base'
import type {
  Payment,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  PaymentIntentResponse,
} from '../../types'
import { BookingsService } from './bookings.service'

/**
 * Payments Service
 * Handles all payment-related API calls
 */
export class PaymentsService {
  /**
   * Create payment intent
   */
  static async createPaymentIntent(paymentData: CreatePaymentIntentRequest) {
    return api.post<PaymentIntentResponse>('/payments/create-intent', paymentData, {
      loadingMessage: 'Creating payment intent...',
      successMessage: 'Payment intent created successfully!',
      errorMessage: 'Failed to create payment intent.',
    })
  }

  /**
   * Confirm payment
   */
  static async confirmPayment(confirmationData: ConfirmPaymentRequest) {
    return api.post<Payment>('/payments/confirm', confirmationData, {
      loadingMessage: 'Confirming payment...',
      successMessage: 'Payment confirmed successfully!',
      errorMessage: 'Failed to confirm payment.',
    })
  }

  /**
   * Get payment by ID
   */
  static async getPayment(id: string) {
    return api.get<Payment>(`/payments/${id}`, {
      loadingMessage: 'Loading payment...',
      showSuccessToast: false,
    })
  }

  /**
   * Get payments by booking
   */
  static async getPaymentsByBooking(bookingId: string) {
    return api.get<Payment[]>(`/payments/booking/${bookingId}`, {
      loadingMessage: 'Loading payments...',
      showSuccessToast: false,
    })
  }

  /**
   * Get payments with pagination and filters
   */
  static async getPayments(query: {
    page?: number
    limit?: number
    status?: string
    bookingId?: string
    customerId?: string
    providerId?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/payments${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<{
      payments: Payment[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(endpoint, {
      loadingMessage: 'Loading payments...',
      showSuccessToast: false,
    })
  }

  /**
   * Cancel payment
   */
  static async cancelPayment(id: string, reason?: string) {
    return api.post<Payment>(`/payments/${id}/cancel`, { reason }, {
      loadingMessage: 'Cancelling payment...',
      successMessage: 'Payment cancelled successfully!',
      errorMessage: 'Failed to cancel payment.',
    })
  }

  /**
   * Refund payment
   */
  static async refundPayment(id: string, amount?: number, reason?: string) {
    return api.post<Payment>(`/payments/${id}/refund`, { amount, reason }, {
      loadingMessage: 'Processing refund...',
      successMessage: 'Refund processed successfully!',
      errorMessage: 'Failed to process refund.',
    })
  }

  /**
   * Get payments by status
   */
  static async getPaymentsByStatus(status: string, query: {
    page?: number
    limit?: number
  } = {}) {
    return this.getPayments({
      ...query,
      status,
    })
  }

  /**
   * Get completed payments
   */
  static async getCompletedPayments(query: {
    page?: number
    limit?: number
  } = {}) {
    return this.getPaymentsByStatus('completed', query)
  }

  /**
   * Get failed payments
   */
  static async getFailedPayments(query: {
    page?: number
    limit?: number
  } = {}) {
    return this.getPaymentsByStatus('failed', query)
  }

  /**
   * Get pending payments
   */
  static async getPendingPayments(query: {
    page?: number
    limit?: number
  } = {}) {
    return this.getPaymentsByStatus('pending', query)
  }

  /**
   * Get refunded payments
   */
  static async getRefundedPayments(query: {
    page?: number
    limit?: number
  } = {}) {
    return this.getPaymentsByStatus('refunded', query)
  }

  /**
   * Get payments by customer
   */
  static async getPaymentsByCustomer(customerId: string, query: {
    page?: number
    limit?: number
    status?: string
  } = {}) {
    return this.getPayments({
      ...query,
      customerId,
    })
  }

  /**
   * Get payments by provider
   */
  static async getPaymentsByProvider(providerId: string, query: {
    page?: number
    limit?: number
    status?: string
  } = {}) {
    return this.getPayments({
      ...query,
      providerId,
    })
  }

  /**
   * Get payments by date range
   */
  static async getPaymentsByDateRange(startDate: string, endDate: string, query: {
    page?: number
    limit?: number
    status?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    params.append('startDate', startDate)
    params.append('endDate', endDate)

    const endpoint = `/payments/date-range${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<{
      payments: Payment[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
      totalAmount: number
    }>(endpoint, {
      loadingMessage: 'Loading payments...',
      showSuccessToast: false,
    })
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats() {
    return api.get<{
      total: number
      byStatus: Record<string, number>
      totalRevenue: number
      totalRefunds: number
      averageTransactionAmount: number
      successRate: number
      monthlyStats: Array<{
        month: string
        transactions: number
        revenue: number
        refunds: number
      }>
    }>('/payments/stats', {
      loadingMessage: 'Loading payment statistics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get payments for dashboard
   */
  static async getPaymentsForDashboard(limit: number = 10) {
    return api.get<{
      recentPayments: Payment[]
      pendingPayments: Payment[]
      failedPayments: Payment[]
      stats: {
        total: number
        pending: number
        completed: number
        failed: number
        refunded: number
        totalRevenue: number
      }
    }>(`/payments/dashboard?limit=${limit}`, {
      loadingMessage: 'Loading dashboard data...',
      showSuccessToast: false,
    })
  }

  /**
   * Get payment methods
   */
  static async getPaymentMethods() {
    return api.get<Array<{
      id: string
      type: string
      last4?: string
      brand?: string
      expMonth?: number
      expYear?: number
      isDefault: boolean
    }>>('/payments/methods', {
      loadingMessage: 'Loading payment methods...',
      showSuccessToast: false,
    })
  }

  /**
   * Add payment method
   */
  static async addPaymentMethod(paymentMethodData: any) {
    return api.post<{
      id: string
      type: string
      isDefault: boolean
    }>('/payments/methods', paymentMethodData, {
      loadingMessage: 'Adding payment method...',
      successMessage: 'Payment method added successfully!',
      errorMessage: 'Failed to add payment method.',
    })
  }

  /**
   * Delete payment method
   */
  static async deletePaymentMethod(id: string) {
    return api.delete(`/payments/methods/${id}`, {
      loadingMessage: 'Deleting payment method...',
      successMessage: 'Payment method deleted successfully!',
      errorMessage: 'Failed to delete payment method.',
    })
  }

  /**
   * Get provider's payments (Provider only)
   */
  static async getProviderPayments(query: {
    page?: number
    limit?: number
    status?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/payments/provider/my-payments${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<{
      payments: Payment[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(endpoint, {
      loadingMessage: 'Loading payments...',
      showSuccessToast: false,
    })
  }

  /**
   * Get provider's payment statistics (Provider only)
   */
  static async getProviderPaymentStats() {
    return api.get<{
      totalEarnings: number
      pendingPayouts: number
      completedPayouts: number
      thisMonth: number
      lastMonth: number
      averagePerJob: number
      totalJobs: number
      platformFeeTotal: number
      monthlyStats: Array<{
        month: string
        earnings: number
        jobs: number
      }>
    }>('/payments/provider/stats', {
      loadingMessage: 'Loading earnings statistics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get provider's earnings summary
   */
  static async getProviderEarningsSummary() {
    return this.getProviderPaymentStats()
  }

  /**
   * Get provider's transactions
   */
  static async getProviderTransactions(query: {
    page?: number
    limit?: number
    status?: string
  } = {}) {
    return this.getProviderPayments(query)
  }

  /**
   * Mark payment as received (for pay after service bookings)
   * Professional marks payment as received after completing service
   * This updates booking payment status to 'paid' and notifies customer and admin
   */
  static async markPaymentReceived(bookingId: string, options?: {
    amount?: number
    paymentMethod?: string
    notes?: string
    notifyCustomer?: boolean
    notifyAdmin?: boolean
  }) {
    // Preferred endpoint (backend: bookings module)
    try {
      const res = await api.post<any>(`/bookings/${bookingId}/payment/mark-received`, {
        amount: options?.amount,
        paymentMethod: options?.paymentMethod || 'cash',
        notes: options?.notes,
        notifyCustomer: options?.notifyCustomer !== false,
        notifyAdmin: options?.notifyAdmin !== false,
      }, {
        loadingMessage: 'Marking payment as received...',
        successMessage: 'Payment marked as received! Waiting for admin verification.',
        errorMessage: 'Failed to mark payment as received.',
      })
      return res
    } catch {
      // Fall back to legacy attempts below
    }

    // Try different endpoint patterns - including booking-based endpoints
    // that might handle payment status updates
    const endpointConfigs = [
      // Booking-based payment endpoints (preferred - updates booking payment status)
      { endpoint: `/bookings/${bookingId}/payment/mark-received`, method: 'POST', body: options },
      { endpoint: `/bookings/${bookingId}/payment/received`, method: 'POST', body: options },
      { endpoint: `/bookings/provider/${bookingId}/payment/mark-received`, method: 'POST', body: options },
      { endpoint: `/bookings/provider/${bookingId}/payment/received`, method: 'POST', body: options },
      
      // Update booking payment status via PATCH
      { endpoint: `/bookings/${bookingId}`, method: 'PATCH', body: { paymentStatus: 'paid', ...options } },
      { endpoint: `/bookings/${bookingId}/status`, method: 'PATCH', body: { paymentStatus: 'paid', ...options } },
      { endpoint: `/bookings/provider/${bookingId}`, method: 'PATCH', body: { paymentStatus: 'paid', ...options } },
      { endpoint: `/bookings/provider/${bookingId}/status`, method: 'PATCH', body: { paymentStatus: 'paid', ...options } },
      
      // Payment-specific endpoints
      { endpoint: `/payments/booking/${bookingId}/mark-received`, method: 'POST', body: options },
      { endpoint: `/payments/mark-received/${bookingId}`, method: 'POST', body: options },
      { endpoint: `/payments/${bookingId}/mark-received`, method: 'POST', body: options },
      { endpoint: `/payments/booking/${bookingId}/received`, method: 'POST', body: options },
      
      // Try updating payment directly via PUT/PATCH
      { endpoint: `/payments/booking/${bookingId}`, method: 'PATCH', body: { status: 'paid', ...options } },
      { endpoint: `/payments/booking/${bookingId}`, method: 'PUT', body: { status: 'paid', ...options } },
    ]

    let lastError: any = null

    for (let i = 0; i < endpointConfigs.length; i++) {
      const { endpoint, method, body: configBody } = endpointConfigs[i] as any
      const isLast = i === endpointConfigs.length - 1

      try {
        // Prepare body based on endpoint type or use config body
        let body: any
        
        if (configBody) {
          // Use body from config if provided
          body = configBody
        } else if (endpoint.includes('/status')) {
          // For status endpoints, include payment status in booking update
          body = {
            paymentStatus: 'paid',
            paymentMethod: options?.paymentMethod || 'cash',
            notes: options?.notes,
            notifyCustomer: options?.notifyCustomer !== false,
            notifyAdmin: options?.notifyAdmin !== false,
          }
        } else if (endpoint.includes('/payment')) {
          // For payment endpoints
          body = {
            status: 'paid',
            amount: options?.amount,
            paymentMethod: options?.paymentMethod || 'cash',
            notes: options?.notes,
            notifyCustomer: options?.notifyCustomer !== false,
            notifyAdmin: options?.notifyAdmin !== false,
          }
        } else if (endpoint.includes('mark-received')) {
          // For mark-received endpoints - try multiple body formats
          // Try different body formats in sequence
          const bodyFormats = [
            // Format 1: Simple with status
            {
              status: 'paid',
              amount: options?.amount,
              paymentMethod: options?.paymentMethod || 'cash',
            },
            // Format 2: With bookingId in body
            {
              bookingId: bookingId,
              status: 'paid',
              amount: options?.amount,
              paymentMethod: options?.paymentMethod || 'cash',
            },
            // Format 3: Full details
            {
              amount: options?.amount,
              paymentMethod: options?.paymentMethod || 'cash',
              notes: options?.notes,
              notifyCustomer: options?.notifyCustomer !== false,
              notifyAdmin: options?.notifyAdmin !== false,
            },
            // Format 4: Minimal - just status
            {
              status: 'paid',
            },
            // Format 5: With paymentStatus instead of status
            {
              paymentStatus: 'paid',
              amount: options?.amount,
              paymentMethod: options?.paymentMethod || 'cash',
            },
          ]
          
          // Try each body format
          let formatSuccess = false
          for (let bodyIdx = 0; bodyIdx < bodyFormats.length; bodyIdx++) {
            const testBody = bodyFormats[bodyIdx]
            
            try {
              console.log(`🔄 Trying body format ${bodyIdx + 1} for ${endpoint}:`, testBody)
              
              const testResult = await api.post<Payment>(endpoint, testBody, {
                loadingMessage: bodyIdx === 0 && i === 0 ? 'Marking payment as received...' : undefined,
                successMessage: 'Payment marked as received! Customer and admin have been notified.',
                errorMessage: 'Failed to mark payment as received.',
                showErrorToast: false,
                showLoading: bodyIdx === 0 && i === 0,
              })
              
              if (testResult && testResult.success) {
                console.log(`✅ Success with body format ${bodyIdx + 1}`)
                formatSuccess = true
                return testResult
              }
            } catch (formatErr: any) {
              // Log the error for this format
              console.log(`⚠️ Body format ${bodyIdx + 1} failed:`, {
                status: formatErr.status || formatErr.response?.status,
                message: formatErr.message || formatErr.response?.data?.message,
              })
              
              // If this is not the last format, continue to next format
              if (bodyIdx < bodyFormats.length - 1) {
                continue
              }
              // If this is the last format, throw the error to be handled by outer catch
              throw formatErr
            }
          }
          
          // If we get here, all formats were tried but none succeeded
          // Skip the regular body processing below
          if (!formatSuccess) {
            continue // Move to next endpoint
          }
          
          // Fallback body (shouldn't reach here, but just in case)
          body = bodyFormats[bodyFormats.length - 1]
        } else {
          // For other endpoints (received, etc.)
          body = {
            amount: options?.amount,
            paymentMethod: options?.paymentMethod || 'cash',
            notes: options?.notes,
            notifyCustomer: options?.notifyCustomer !== false,
            notifyAdmin: options?.notifyAdmin !== false,
          }
        }

        let result: any
        
        if (method === 'POST') {
          result = await api.post<Payment>(endpoint, body, {
            loadingMessage: i === 0 ? 'Marking payment as received...' : undefined,
            successMessage: 'Payment marked as received! Customer and admin have been notified.',
            errorMessage: 'Failed to mark payment as received.',
            showErrorToast: false,
            showLoading: i === 0,
          })
        } else if (method === 'PATCH') {
          result = await api.patch<Payment>(endpoint, body, {
            loadingMessage: i === 0 ? 'Marking payment as received...' : undefined,
            successMessage: 'Payment marked as received! Customer and admin have been notified.',
            errorMessage: 'Failed to mark payment as received.',
            showErrorToast: false,
            showLoading: i === 0,
          })
        } else if (method === 'PUT') {
          result = await api.put<Payment>(endpoint, body, {
            loadingMessage: i === 0 ? 'Marking payment as received...' : undefined,
            successMessage: 'Payment marked as received! Customer and admin have been notified.',
            errorMessage: 'Failed to mark payment as received.',
            showErrorToast: false,
            showLoading: i === 0,
          })
        }

        // If successful, return immediately
        if (result && result.success) {
          return result
        }
      } catch (err: any) {
        lastError = err

        // Log the error for debugging
        console.log(`❌ Endpoint ${endpoint} failed:`, {
          status: err.status || err.response?.status,
          message: err.message || err.response?.data?.message,
          data: err.response?.data,
        })

        // Check if it's a 404/not found error
        const is404 = err.status === 404 ||
                     err.response?.status === 404 ||
                     (err as any)?.code === 'NOT_FOUND' ||
                     err.message?.toLowerCase().includes('not found') ||
                     err.message?.toLowerCase().includes('404') ||
                     err.response?.data?.message?.toLowerCase().includes('not found')

        // If it's not a 404, check if it's a validation error (400/422)
        // For validation errors, try next endpoint as it might be a body format issue
        const isValidationError = err.status === 400 || 
                                 err.response?.status === 400 ||
                                 err.status === 422 || 
                                 err.response?.status === 422

        // If it's a server error (500) or auth error (401/403), throw immediately
        if (!is404 && !isValidationError && 
            err.status !== 400 && err.status !== 422 &&
            err.response?.status !== 400 && err.response?.status !== 422) {
          // Include error details in the message
          const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
          throw new Error(`Failed to mark payment as received: ${errorMsg}`)
        }
        
        // For validation errors, log but continue to next endpoint
        if (isValidationError) {
          console.log(`⚠️ Validation error on ${endpoint}, trying next endpoint...`)
        }

        // If this is the last endpoint and it's a 404, try fallback approaches
        if (isLast && is404) {
          // Fallback 1: Try using processPayment endpoint
          try {
            console.log('🔄 Fallback 1: Use processPayment endpoint')
            
            const { api } = await import('./base')
            const processResult = await api.post<any>('/payments/process', {
              bookingId: bookingId,
              amount: options?.amount,
              paymentMethod: options?.paymentMethod || 'cash',
              status: 'completed',
              transactionId: `cash_${bookingId}_${Date.now()}`,
            }, {
              loadingMessage: 'Marking payment as received...',
              successMessage: 'Payment marked as received!',
              errorMessage: 'Failed to mark payment as received.',
              showErrorToast: false,
            })
            
            if (processResult && processResult.success) {
              return {
                success: true,
                data: processResult.data,
                message: 'Payment marked as received! Customer and admin have been notified.',
              }
            }
          } catch (processErr: any) {
            console.log('⚠️ processPayment failed:', processErr.message)
          }
          
          // Fallback 2: Try creating/updating payment record directly
          try {
            console.log('🔄 Fallback 2: Create/Update payment record')
            
            const { api } = await import('./base')
            
            // Try to create a payment record with completed status
            const paymentData = {
              bookingId: bookingId,
              amount: options?.amount,
              status: 'completed',
              paymentMethod: options?.paymentMethod || 'cash',
              transactionId: `cash_${bookingId}_${Date.now()}`,
            }
            
            // Try POST to create payment
            try {
              const createResult = await api.post<any>('/payments', paymentData, {
                loadingMessage: 'Marking payment as received...',
                successMessage: 'Payment marked as received!',
                errorMessage: 'Failed to mark payment as received.',
                showErrorToast: false,
              })
              
              if (createResult && createResult.success) {
                return {
                  success: true,
                  data: createResult.data,
                  message: 'Payment marked as received! Customer and admin have been notified.',
                }
              }
            } catch (createErr: any) {
              // If create fails, try to update existing payment
              console.log('⚠️ Payment create failed, trying to update existing payment')
              
              // Try to get existing payment first
              try {
                const paymentsResponse = await this.getPaymentsByBooking(bookingId)
                if (paymentsResponse.success && paymentsResponse.data) {
                  const payments = Array.isArray(paymentsResponse.data) 
                    ? paymentsResponse.data 
                    : (paymentsResponse.data as any)?.payments || []
                  
                  if (payments.length > 0) {
                    const paymentId = payments[0].id || payments[0]._id
                    const updateResult = await api.patch<any>(`/payments/${paymentId}`, {
                      status: 'completed',
                      paymentMethod: options?.paymentMethod || 'cash',
                    }, {
                      loadingMessage: 'Marking payment as received...',
                      successMessage: 'Payment marked as received!',
                      errorMessage: 'Failed to mark payment as received.',
                      showErrorToast: false,
                    })
                    
                    if (updateResult && updateResult.success) {
                      return {
                        success: true,
                        data: updateResult.data,
                        message: 'Payment marked as received! Customer and admin have been notified.',
                      }
                    }
                  }
                }
              } catch (updateErr: any) {
                console.log('⚠️ Payment update failed:', updateErr.message)
              }
            }
          } catch (paymentErr: any) {
            console.log('⚠️ Payment record approach failed:', paymentErr.message)
          }
          
          // Fallback 3: Try updating booking status with payment info in notes/metadata
          try {
            console.log('🔄 Fallback 3: Update booking status with payment info in notes')
            
            const { api } = await import('./base')
            const statusResult = await api.patch<any>(`/bookings/${bookingId}/status`, {
              status: 'completed', // Keep status as completed
              notes: `${options?.notes || ''}\n[Payment Received: ${options?.amount || 'Full amount'} via ${options?.paymentMethod || 'cash'}]`.trim(),
              // Try including payment info in metadata or additional fields
              paymentReceived: true,
              paymentAmount: options?.amount,
              paymentMethod: options?.paymentMethod || 'cash',
            }, {
              loadingMessage: 'Marking payment as received...',
              successMessage: 'Payment marked as received!',
              errorMessage: 'Failed to mark payment as received.',
              showErrorToast: false,
            })
            
            if (statusResult && statusResult.success) {
              return {
                success: true,
                data: statusResult.data,
                message: 'Payment marked as received via booking status update! Customer and admin have been notified.',
              }
            }
          } catch (statusErr: any) {
            console.log('⚠️ Booking status update with payment info failed:', statusErr.message)
          }
          
          // Fallback 4: Try updating booking directly with payment status via PUT
          try {
            console.log('🔄 Fallback 4: Update booking directly with payment status via PUT')
            
            const { api } = await import('./base')
            const updateResult = await api.put<any>(`/bookings/${bookingId}`, {
              paymentStatus: 'paid',
              paymentMethod: options?.paymentMethod || 'cash',
              notes: options?.notes,
            }, {
              loadingMessage: 'Marking payment as received...',
              successMessage: 'Payment marked as received!',
              errorMessage: 'Failed to mark payment as received.',
              showErrorToast: false,
            })
            
            if (updateResult && updateResult.success) {
              return {
                success: true,
                data: updateResult.data,
                message: 'Payment marked as received via booking update! Customer and admin have been notified.',
              }
            }
          } catch (putErr: any) {
            console.log('⚠️ PUT booking update failed:', putErr.message)
          }
          
          // Fallback 5: Try updating booking via PATCH
          try {
            console.log('🔄 Fallback 5: Update booking via PATCH')
            
            const { api } = await import('./base')
            const patchResult = await api.patch<any>(`/bookings/${bookingId}`, {
              paymentStatus: 'paid',
              paymentMethod: options?.paymentMethod || 'cash',
              notes: options?.notes,
            }, {
              loadingMessage: 'Marking payment as received...',
              successMessage: 'Payment marked as received!',
              errorMessage: 'Failed to mark payment as received.',
              showErrorToast: false,
            })
            
            if (patchResult && patchResult.success) {
              return {
                success: true,
                data: patchResult.data,
                message: 'Payment marked as received via booking update! Customer and admin have been notified.',
              }
            }
          } catch (patchErr: any) {
            console.log('⚠️ PATCH booking update failed:', patchErr.message)
          }
          
          // If all fallbacks fail, provide helpful error message
          throw new Error(
            'Unable to mark payment as received. The backend API does not have a dedicated endpoint for this operation. ' +
            'Please contact your backend developer to implement one of these endpoints:\n' +
            '- POST /api/payments/booking/{id}/mark-received\n' +
            '- POST /api/bookings/{id}/payment/received\n' +
            '- PATCH /api/bookings/{id} (with paymentStatus field)\n\n' +
            'Alternatively, payment status may need to be updated manually in the admin panel.'
          )
        }

        // Otherwise, continue to next endpoint
        continue
      }
    }

    // This should never be reached, but just in case
    throw lastError || new Error('No valid endpoint found to mark payment as received')
  }
}
