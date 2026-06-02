import type { ApiClient } from '../types'
import { unwrapApiData } from '../unwrap'

export interface DashboardAnalyticsOverview {
  totalUsers: number
  totalProviders: number
  totalServiceRequests: number
  totalBookings: number
  totalRevenue: number
}

export interface DashboardAnalytics {
  overview: DashboardAnalyticsOverview
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
  serviceStats: Array<{
    serviceType: string
    totalRequests: number
    completedRequests: number
    averageRating: number
  }>
}

function emptyAnalytics(): DashboardAnalytics {
  return {
    overview: {
      totalUsers: 0,
      totalProviders: 0,
      totalServiceRequests: 0,
      totalBookings: 0,
      totalRevenue: 0,
    },
    recentActivity: [],
    serviceStats: [],
  }
}

export function createAnalyticsService(api: ApiClient) {
  return {
    async getDashboardAnalytics(): Promise<DashboardAnalytics> {
      try {
        const res = await api.get<unknown>('/analytics/dashboard')
        const data = unwrapApiData<Partial<DashboardAnalytics>>(res.data ?? res)
        if (!data || typeof data !== 'object') return emptyAnalytics()
        return {
          overview: { ...emptyAnalytics().overview, ...(data.overview ?? {}) },
          recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
          serviceStats: Array.isArray(data.serviceStats) ? data.serviceStats : [],
        }
      } catch {
        return emptyAnalytics()
      }
    },
  }
}

export type AnalyticsService = ReturnType<typeof createAnalyticsService>
