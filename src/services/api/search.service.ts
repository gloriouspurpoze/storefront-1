import { api } from './base'
import type {
  SearchResponse,
  SearchQuery,
  SearchResult,
} from '../../types'

/**
 * Search Service
 * Handles all search-related API calls
 */
export class SearchService {
  /**
   * Global search across all entities
   */
  static async globalSearch(query: SearchQuery) {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/search${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<SearchResponse>(endpoint, {
      loadingMessage: 'Searching...',
      showSuccessToast: false,
    })
  }

  /**
   * Search users
   */
  static async searchUsers(searchTerm: string, query: {
    page?: number
    limit?: number
    userType?: string
  } = {}) {
    return this.globalSearch({
      q: searchTerm,
      type: 'users',
      page: query.page,
      limit: query.limit,
    })
  }

  /**
   * Search providers
   */
  static async searchProviders(searchTerm: string, query: {
    page?: number
    limit?: number
    serviceType?: string
    verificationStatus?: string
  } = {}) {
    const params = new URLSearchParams({
      q: searchTerm,
      type: 'providers',
    })
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/search${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<SearchResponse>(endpoint, {
      loadingMessage: 'Searching providers...',
      showSuccessToast: false,
    })
  }

  /**
   * Search services
   */
  static async searchServices(searchTerm: string, query: {
    page?: number
    limit?: number
    serviceType?: string
    status?: string
  } = {}) {
    const params = new URLSearchParams({
      q: searchTerm,
      type: 'services',
    })
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/search${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<SearchResponse>(endpoint, {
      loadingMessage: 'Searching services...',
      showSuccessToast: false,
    })
  }

  /**
   * Search products
   */
  static async searchProducts(searchTerm: string, query: {
    page?: number
    limit?: number
    categoryId?: string
    providerId?: string
    isFeatured?: boolean
  } = {}) {
    const params = new URLSearchParams({
      q: searchTerm,
      type: 'products',
    })
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/search${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<SearchResponse>(endpoint, {
      loadingMessage: 'Searching products...',
      showSuccessToast: false,
    })
  }

  /**
   * Search bookings
   */
  static async searchBookings(searchTerm: string, query: {
    page?: number
    limit?: number
    status?: string
    customerId?: string
    providerId?: string
  } = {}) {
    const params = new URLSearchParams({
      q: searchTerm,
      type: 'bookings',
    })
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/search${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<SearchResponse>(endpoint, {
      loadingMessage: 'Searching bookings...',
      showSuccessToast: false,
    })
  }

  /**
   * Search quotes
   */
  static async searchQuotes(searchTerm: string, query: {
    page?: number
    limit?: number
    status?: string
    providerId?: string
  } = {}) {
    const params = new URLSearchParams({
      q: searchTerm,
      type: 'quotes',
    })
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/search${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<SearchResponse>(endpoint, {
      loadingMessage: 'Searching quotes...',
      showSuccessToast: false,
    })
  }

  /**
   * Get search suggestions
   */
  static async getSearchSuggestions(query: string, limit: number = 10) {
    return api.get<{
      suggestions: Array<{
        text: string
        type: string
        category?: string
      }>
      popular: Array<{
        text: string
        count: number
      }>
    }>(`/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`, {
      showLoading: false,
      showSuccessToast: false,
      showErrorToast: false,
    })
  }

  /**
   * Get search history
   */
  static async getSearchHistory(limit: number = 20) {
    return api.get<Array<{
      query: string
      timestamp: string
      resultCount: number
    }>>(`/search/history?limit=${limit}`, {
      loadingMessage: 'Loading search history...',
      showSuccessToast: false,
    })
  }

  /**
   * Clear search history
   */
  static async clearSearchHistory() {
    return api.delete('/search/history', {
      loadingMessage: 'Clearing search history...',
      successMessage: 'Search history cleared successfully!',
      errorMessage: 'Failed to clear search history.',
    })
  }

  /**
   * Get trending searches
   */
  static async getTrendingSearches(limit: number = 10, period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
    return api.get<Array<{
      query: string
      count: number
      trend: 'up' | 'down' | 'stable'
      percentage: number
    }>>(`/search/trending?limit=${limit}&period=${period}`, {
      loadingMessage: 'Loading trending searches...',
      showSuccessToast: false,
    })
  }

  /**
   * Get search analytics
   */
  static async getSearchAnalytics(dateRange?: {
    startDate: string
    endDate: string
  }) {
    const params = dateRange ? new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }) : new URLSearchParams()

    const endpoint = `/search/analytics${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<{
      totalSearches: number
      uniqueSearchers: number
      averageResultsPerSearch: number
      searchSuccessRate: number
      topQueries: Array<{
        query: string
        count: number
        resultCount: number
      }>
      searchTrends: Array<{
        date: string
        searches: number
        uniqueSearchers: number
      }>
      resultTypeDistribution: Array<{
        type: string
        count: number
        percentage: number
      }>
    }>(endpoint, {
      loadingMessage: 'Loading search analytics...',
      showSuccessToast: false,
    })
  }

  /**
   * Advanced search with filters
   */
  static async advancedSearch(searchConfig: {
    query: string
    type?: string
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    return api.post<SearchResponse>('/search/advanced', searchConfig, {
      loadingMessage: 'Performing advanced search...',
      successMessage: 'Search completed successfully!',
      errorMessage: 'Advanced search failed.',
    })
  }
}
