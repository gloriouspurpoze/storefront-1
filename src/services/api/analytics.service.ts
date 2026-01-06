import { api } from './base'
import type { DashboardAnalytics } from '../../types'

/**
 * Analytics Service
 * Handles all analytics and reporting-related API calls
 */
export class AnalyticsService {
  /**
   * Get dashboard analytics (Admin only)
   */
  static async getDashboardAnalytics() {
    return api.get<DashboardAnalytics>('/analytics/dashboard', {
      loadingMessage: 'Loading dashboard analytics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(dateRange?: {
    startDate: string
    endDate: string
  }) {
    const params = dateRange ? new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }) : new URLSearchParams()

    const endpoint = `/analytics/users${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<{
      totalUsers: number
      newUsers: number
      activeUsers: number
      userTypes: {
        customers: number
        providers: number
        admins: number
      }
      userGrowth: Array<{
        date: string
        newUsers: number
        totalUsers: number
      }>
      userActivity: Array<{
        date: string
        activeUsers: number
        logins: number
      }>
    }>(endpoint, {
      loadingMessage: 'Loading user analytics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get provider analytics
   */
  static async getProviderAnalytics(dateRange?: {
    startDate: string
    endDate: string
  }) {
    const params = dateRange ? new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }) : new URLSearchParams()

    const endpoint = `/analytics/providers${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<{
      totalProviders: number
      newProviders: number
      verifiedProviders: number
      pendingVerification: number
      topProviders: Array<{
        id: string
        businessName: string
        rating: number
        totalBookings: number
        totalRevenue: number
      }>
      providerGrowth: Array<{
        date: string
        newProviders: number
        verifiedProviders: number
      }>
      serviceTypeDistribution: Array<{
        serviceType: string
        count: number
        percentage: number
      }>
    }>(endpoint, {
      loadingMessage: 'Loading provider analytics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get service request analytics
   */
  static async getServiceRequestAnalytics(dateRange?: {
    startDate: string
    endDate: string
  }) {
    const params = dateRange ? new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }) : new URLSearchParams()

    const endpoint = `/analytics/service-requests${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<{
      totalRequests: number
      newRequests: number
      completedRequests: number
      cancelledRequests: number
      averageCompletionTime: number
      statusDistribution: Array<{
        status: string
        count: number
        percentage: number
      }>
      serviceTypeDistribution: Array<{
        serviceType: string
        count: number
        percentage: number
        averageRating: number
      }>
      urgencyDistribution: Array<{
        urgency: string
        count: number
        percentage: number
      }>
      requestTrends: Array<{
        date: string
        requests: number
        completions: number
      }>
    }>(endpoint, {
      loadingMessage: 'Loading service request analytics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get booking analytics
   */
  static async getBookingAnalytics(dateRange?: {
    startDate: string
    endDate: string
  }) {
    const params = dateRange ? new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }) : new URLSearchParams()

    const endpoint = `/analytics/bookings${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<{
      totalBookings: number
      newBookings: number
      completedBookings: number
      cancelledBookings: number
      totalRevenue: number
      averageBookingValue: number
      completionRate: number
      cancellationRate: number
      statusDistribution: Array<{
        status: string
        count: number
        percentage: number
      }>
      monthlyRevenue: Array<{
        month: string
        revenue: number
        bookings: number
      }>
      topServiceTypes: Array<{
        serviceType: string
        bookings: number
        revenue: number
        averageValue: number
      }>
    }>(endpoint, {
      loadingMessage: 'Loading booking analytics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get payment analytics
   */
  static async getPaymentAnalytics(dateRange?: {
    startDate: string
    endDate: string
  }) {
    const params = dateRange ? new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }) : new URLSearchParams()

    const endpoint = `/analytics/payments${params.toString() ? `?${params.toString()}` : ''}`
    
    return api.get<{
      totalTransactions: number
      successfulTransactions: number
      failedTransactions: number
      totalRevenue: number
      totalRefunds: number
      netRevenue: number
      averageTransactionAmount: number
      successRate: number
      paymentMethodDistribution: Array<{
        method: string
        count: number
        amount: number
        percentage: number
      }>
      revenueTrends: Array<{
        date: string
        revenue: number
        transactions: number
      }>
    }>(endpoint, {
      loadingMessage: 'Loading payment analytics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get revenue analytics
   */
  static async getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'monthly', months: number = 12) {
    return api.get<{
      totalRevenue: number
      grossRevenue: number
      netRevenue: number
      totalRefunds: number
      averageRevenue: number
      growthRate: number
      revenueBreakdown: Array<{
        period: string
        revenue: number
        bookings: number
        averageBookingValue: number
      }>
      revenueByServiceType: Array<{
        serviceType: string
        revenue: number
        percentage: number
        bookings: number
      }>
    }>(`/analytics/revenue?period=${period}&months=${months}`, {
      loadingMessage: 'Loading revenue analytics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get geographic analytics
   */
  static async getGeographicAnalytics() {
    return api.get<{
      totalLocations: number
      topCities: Array<{
        city: string
        state: string
        requests: number
        bookings: number
        revenue: number
      }>
      serviceCoverage: Array<{
        area: string
        providerCount: number
        serviceTypes: string[]
        averageRating: number
      }>
    }>('/analytics/geographic', {
      loadingMessage: 'Loading geographic analytics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics() {
    return api.get<{
      systemPerformance: {
        averageResponseTime: number
        uptime: number
        errorRate: number
      }
      userExperience: {
        averageBookingTime: number
        customerSatisfaction: number
        providerSatisfaction: number
      }
      businessMetrics: {
        conversionRate: number
        retentionRate: number
        churnRate: number
      }
    }>('/analytics/performance', {
      loadingMessage: 'Loading performance metrics...',
      showSuccessToast: false,
    })
  }

  /**
   * Get custom report
   */
  static async getCustomReport(reportConfig: {
    metrics: string[]
    dimensions: string[]
    dateRange: {
      startDate: string
      endDate: string
    }
    filters?: Record<string, any>
  }) {
    return api.post<{
      data: any[]
      summary: Record<string, any>
      metadata: {
        generatedAt: string
        recordCount: number
      }
    }>('/analytics/custom-report', reportConfig, {
      loadingMessage: 'Generating custom report...',
      successMessage: 'Custom report generated successfully!',
      errorMessage: 'Failed to generate custom report.',
    })
  }

  /**
   * Export analytics data
   */
  static async exportAnalyticsData(exportConfig: {
    reportType: string
    format: 'csv' | 'excel' | 'pdf'
    dateRange?: {
      startDate: string
      endDate: string
    }
    filters?: Record<string, any>
  }) {
    return api.post<{
      downloadUrl: string
      filename: string
      expiresAt: string
    }>('/analytics/export', exportConfig, {
      loadingMessage: 'Preparing export...',
      successMessage: 'Export ready for download!',
      errorMessage: 'Failed to prepare export.',
    })
  }
}
