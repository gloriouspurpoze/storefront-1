import { api } from './base'
import type {
  Quote,
  CreateQuoteRequest,
  QuotesResponse,
  QuotesQuery,
} from '../../types'

/**
 * Quotes Service
 * Handles all quote-related API calls
 */
export class QuotesService {
  /**
   * Get quotes with pagination and filters
   */
  static async getQuotes(query: QuotesQuery = {}) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/quotes${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<QuotesResponse>(endpoint, {
      loadingMessage: 'Loading quotes...',
      showSuccessToast: false,
    })
  }

  /**
   * Get single quote by ID
   */
  static async getQuote(id: string) {
    return api.get<Quote>(`/quotes/${id}`, {
      loadingMessage: 'Loading quote...',
      showSuccessToast: false,
    })
  }

  /**
   * Create new quote for service request
   */
  static async createQuote(quote: CreateQuoteRequest) {
    return api.post<Quote>('/quotes', quote, {
      loadingMessage: 'Creating quote...',
      successMessage: 'Quote created successfully!',
      errorMessage: 'Failed to create quote.',
    })
  }

  /**
   * Update existing quote
   */
  static async updateQuote(id: string, quote: Partial<CreateQuoteRequest>) {
    return api.put<Quote>(`/quotes/${id}`, quote, {
      loadingMessage: 'Updating quote...',
      successMessage: 'Quote updated successfully!',
      errorMessage: 'Failed to update quote.',
    })
  }

  /**
   * Delete quote
   */
  static async deleteQuote(id: string) {
    return api.delete(`/quotes/${id}`, {
      loadingMessage: 'Deleting quote...',
      successMessage: 'Quote deleted successfully!',
      errorMessage: 'Failed to delete quote.',
    })
  }

  /**
   * Accept a quote
   */
  static async acceptQuote(id: string) {
    return api.put<Quote>(`/quotes/${id}/accept`, {}, {
      loadingMessage: 'Accepting quote...',
      successMessage: 'Quote accepted successfully!',
      errorMessage: 'Failed to accept quote.',
    })
  }

  /**
   * Reject a quote
   */
  static async rejectQuote(id: string, reason?: string) {
    return api.put<Quote>(`/quotes/${id}/reject`, { reason }, {
      loadingMessage: 'Rejecting quote...',
      successMessage: 'Quote rejected successfully!',
      errorMessage: 'Failed to reject quote.',
    })
  }

  /**
   * Get quotes by service request
   */
  static async getQuotesByServiceRequest(serviceRequestId: string, query: Omit<QuotesQuery, 'serviceRequestId'> = {}) {
    return this.getQuotes({
      ...query,
      serviceRequestId,
    })
  }

  /**
   * Get quotes by provider
   */
  static async getQuotesByProvider(providerId: string, query: Omit<QuotesQuery, 'providerId'> = {}) {
    return this.getQuotes({
      ...query,
      providerId,
    })
  }

  /**
   * Get quotes by status
   */
  static async getQuotesByStatus(status: string, query: Omit<QuotesQuery, 'status'> = {}) {
    return this.getQuotes({
      ...query,
      status,
    })
  }

  /**
   * Get pending quotes
   */
  static async getPendingQuotes(query: Omit<QuotesQuery, 'status'> = {}) {
    return this.getQuotesByStatus('pending', query)
  }

  /**
   * Get accepted quotes
   */
  static async getAcceptedQuotes(query: Omit<QuotesQuery, 'status'> = {}) {
    return this.getQuotesByStatus('accepted', query)
  }

  /**
   * Get rejected quotes
   */
  static async getRejectedQuotes(query: Omit<QuotesQuery, 'status'> = {}) {
    return this.getQuotesByStatus('rejected', query)
  }

  /**
   * Get expired quotes
   */
  static async getExpiredQuotes(query: Omit<QuotesQuery, 'status'> = {}) {
    return this.getQuotesByStatus('expired', query)
  }

  /**
   * Extend quote validity
   */
  static async extendQuoteValidity(id: string, newValidUntil: string) {
    return api.patch<Quote>(`/quotes/${id}/extend`, { validUntil: newValidUntil }, {
      loadingMessage: 'Extending quote validity...',
      successMessage: 'Quote validity extended successfully!',
      errorMessage: 'Failed to extend quote validity.',
    })
  }

  /**
   * Get quote statistics
   */
  static async getQuoteStats() {
    return api.get<{
      total: number
      byStatus: Record<string, number>
      averageAmount: number
      totalValue: number
      conversionRate: number
    }>('/quotes/stats', {
      loadingMessage: 'Loading quote statistics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get quotes for dashboard
   */
  static async getQuotesForDashboard(limit: number = 10) {
    return api.get<{
      recentQuotes: Quote[]
      pendingQuotes: Quote[]
      acceptedQuotes: Quote[]
      stats: {
        total: number
        pending: number
        accepted: number
        rejected: number
      }
    }>(`/quotes/dashboard?limit=${limit}`, {
      loadingMessage: 'Loading dashboard data...',
      showSuccessToast: false,
    })
  }
}
