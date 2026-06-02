import type { ApiClient } from '../types'

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  activeProviders: number
  averageRating: number
  revenueGrowth: number
  ordersGrowth: number
  providersGrowth: number
  ratingChange: number
}

export interface RecentOrder {
  id: string
  customer: string
  service: string
  amount: number
  status: string
  date: string
  avatar?: string
}

export interface AdminDashboardData {
  stats: DashboardStats
  revenueData: Array<{ month: string; revenue: number; orders: number; services: number }>
  categoryPerformance: Array<{ name: string; value: number; count: number; growth: number; color: string }>
  recentOrders: RecentOrder[]
  topProviders: Array<{ name: string; rating: number; jobs: number; revenue: number; avatar?: string }>
}

function normalizeAdminDashboardPayload(raw: unknown): AdminDashboardData {
  let data = raw
  if (
    raw &&
    typeof raw === 'object' &&
    (raw as { data?: unknown }).data != null &&
    typeof (raw as { data?: unknown }).data === 'object' &&
    !Array.isArray((raw as { data?: unknown }).data)
  ) {
    data = (raw as { data: unknown }).data
  }
  if (!data || typeof data !== 'object') {
    return emptyDashboard()
  }
  const d = data as Record<string, unknown>
  const summary = (d.summary || {}) as Record<string, unknown>
  const fromStats = (d.stats || {}) as Record<string, unknown>

  const stats: DashboardStats = {
    totalRevenue: Number(fromStats.totalRevenue ?? summary.totalRevenue ?? 0),
    totalOrders: Number(fromStats.totalOrders ?? summary.totalOrders ?? 0),
    activeProviders: Number(fromStats.activeProviders ?? summary.totalProviders ?? 0),
    averageRating: Number(fromStats.averageRating ?? summary.averageRating ?? 0),
    revenueGrowth: Number(fromStats.revenueGrowth ?? 0),
    ordersGrowth: Number(fromStats.ordersGrowth ?? 0),
    providersGrowth: Number(fromStats.providersGrowth ?? 0),
    ratingChange: Number(fromStats.ratingChange ?? 0),
  }

  let recentOrders: RecentOrder[] = []
  if (Array.isArray(d.recentOrders) && d.recentOrders.length) {
    recentOrders = (d.recentOrders as Record<string, unknown>[]).map(mapRecentOrder)
  } else if (Array.isArray((d.recentActivity as { orders?: unknown })?.orders)) {
    recentOrders = ((d.recentActivity as { orders: Record<string, unknown>[] }).orders).map(mapRecentOrder)
  }

  return {
    stats,
    revenueData: Array.isArray(d.revenueData) ? (d.revenueData as AdminDashboardData['revenueData']) : [],
    categoryPerformance: Array.isArray(d.categoryPerformance)
      ? (d.categoryPerformance as AdminDashboardData['categoryPerformance'])
      : [],
    recentOrders,
    topProviders: Array.isArray(d.topProviders) ? (d.topProviders as AdminDashboardData['topProviders']) : [],
  }
}

function mapRecentOrder(o: Record<string, unknown>): RecentOrder {
  return {
    id: String(o.id ?? o._id ?? ''),
    customer: String(o.customer ?? '—'),
    service: String(o.service ?? o.orderNumber ? `Order #${o.orderNumber}` : '—'),
    amount: Number(o.amount ?? o.totalAmount ?? 0),
    status: String(o.status ?? 'pending'),
    date:
      typeof o.date === 'string'
        ? o.date
        : o.createdAt
          ? new Date(String(o.createdAt)).toLocaleString()
          : '',
    avatar: o.avatar as string | undefined,
  }
}

function emptyDashboard(): AdminDashboardData {
  const stats: DashboardStats = {
    totalRevenue: 0,
    totalOrders: 0,
    activeProviders: 0,
    averageRating: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    providersGrowth: 0,
    ratingChange: 0,
  }
  return {
    stats,
    revenueData: [],
    categoryPerformance: [],
    recentOrders: [],
    topProviders: [],
  }
}

export function createDashboardService(api: ApiClient) {
  return {
    async getAdminDashboard(): Promise<AdminDashboardData> {
      const attempts = [
        () => api.get<unknown>('/dashboard/admin'),
        () => api.get<unknown>('/dashboard/quick-stats'),
        () => api.get<{ recentOrders?: Record<string, unknown>[]; stats?: Record<string, unknown> }>(
          '/orders/dashboard',
          { params: { limit: 10 } },
        ),
      ]
      let lastError: unknown
      for (const run of attempts) {
        try {
          const res = await run()
          return normalizeAdminDashboardPayload(res.data ?? res)
        } catch (e) {
          lastError = e
        }
      }
      throw lastError instanceof Error ? lastError : new Error('Dashboard unavailable')
    },
  }
}

export type DashboardService = ReturnType<typeof createDashboardService>
