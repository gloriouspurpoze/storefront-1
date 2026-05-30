import { apiClient } from '../apiClient';
import { api } from './base';
import type { OrderStatsResponse } from './orders.service';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeProviders: number;
  averageRating: number;
  revenueGrowth: number;
  ordersGrowth: number;
  providersGrowth: number;
  ratingChange: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  orders: number;
  services: number;
}

export interface CategoryPerformance {
  name: string;
  value: number;
  count: number;
  growth: number;
  color: string;
}

export interface RecentOrder {
  id: string;
  customer: string;
  service: string;
  amount: number;
  status: string;
  date: string;
  avatar?: string;
}

export interface TopProvider {
  name: string;
  rating: number;
  jobs: number;
  revenue: number;
  avatar?: string;
}

export interface AdminDashboardData {
  stats: DashboardStats;
  revenueData: RevenueDataPoint[];
  categoryPerformance: CategoryPerformance[];
  recentOrders: RecentOrder[];
  topProviders: TopProvider[];
}

/** Backend (fixer-backend) returns summary + recentActivity; legacy/mock may return stats + recentOrders. */
function normalizeAdminDashboardPayload(raw: any): AdminDashboardData {
  let data = raw
  if (
    raw &&
    typeof raw === 'object' &&
    raw.data != null &&
    typeof raw.data === 'object' &&
    !Array.isArray(raw.data)
  ) {
    data = raw.data
  }
  if (!data || typeof data !== 'object') {
    return {
      stats: {
        totalRevenue: 0,
        totalOrders: 0,
        activeProviders: 0,
        averageRating: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        providersGrowth: 0,
        ratingChange: 0,
      },
      revenueData: [],
      categoryPerformance: [],
      recentOrders: [],
      topProviders: [],
    }
  }

  const summary = data.summary || {}
  const fromStats = data.stats || {}

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

  let revenueData: RevenueDataPoint[] = Array.isArray(data.revenueData) ? data.revenueData : []
  if (revenueData.length === 0 && (stats.totalRevenue > 0 || stats.totalOrders > 0)) {
    const label = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })
    revenueData = [
      {
        month: label,
        revenue: stats.totalRevenue,
        orders: stats.totalOrders,
        services: 0,
      },
    ]
  }

  let categoryPerformance: CategoryPerformance[] = Array.isArray(data.categoryPerformance)
    ? data.categoryPerformance
    : []
  if (categoryPerformance.length === 0 && data.statusBreakdowns?.orders) {
    const ob = data.statusBreakdowns.orders as Record<string, number>
    categoryPerformance = Object.entries(ob).map(([name, count], i) => ({
      name,
      value: count,
      count,
      growth: 0,
      color: ['#024ad8', '#0e3191', '#356373', '#ff5050', '#b3262b'][i % 5],
    }))
  }

  let recentOrders: RecentOrder[] = []
  if (Array.isArray(data.recentOrders) && data.recentOrders.length) {
    recentOrders = data.recentOrders.map((o: any) => ({
      id: String(o.id ?? o._id ?? ''),
      customer: o.customer ?? '—',
      service: o.service ?? '—',
      amount: Number(o.amount ?? 0),
      status: String(o.status ?? 'pending'),
      date: typeof o.date === 'string' ? o.date : o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
      avatar: o.avatar,
    }))
  } else if (Array.isArray(data.recentActivity?.orders)) {
    recentOrders = data.recentActivity.orders.map((o: any) => ({
      id: String(o.id ?? o._id ?? ''),
      customer: o.customer ?? '—',
      service: o.orderNumber ? `Order #${o.orderNumber}` : 'Order',
      amount: Number(o.totalAmount ?? o.amount ?? 0),
      status: String(o.status ?? 'pending'),
      date: o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
      avatar: o.avatar,
    }))
  }

  if (Array.isArray(data.recentActivity?.bookings) && data.recentActivity.bookings.length > 0) {
    const fromBookings = data.recentActivity.bookings.map((b: any) => ({
      id: String(b.id ?? b._id ?? ''),
      customer: b.customer ?? '—',
      service: b.orderNumber ? `Booking ${b.orderNumber}` : 'Booking',
      amount: Number(b.totalAmount ?? b.amount ?? 0),
      status: String(b.status ?? 'pending'),
      date: b.createdAt ? new Date(b.createdAt).toLocaleString() : '',
      avatar: b.avatar,
    }))
    recentOrders = [...recentOrders, ...fromBookings].sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0
      const tb = b.date ? new Date(b.date).getTime() : 0
      return tb - ta
    }).slice(0, 10)
  }

  const topProviders: TopProvider[] = Array.isArray(data.topProviders) ? data.topProviders : []

  return {
    stats,
    revenueData,
    categoryPerformance,
    recentOrders,
    topProviders,
  }
}

function adminDataFromOrdersDashboard(res: {
  data?: {
    recentOrders?: Array<Record<string, unknown>>
    stats?: Record<string, unknown>
  }
}): AdminDashboardData {
  const payload = res.data || {}
  const rows = Array.isArray(payload.recentOrders) ? payload.recentOrders : []
  const stats = payload.stats || {}
  const recentOrders: RecentOrder[] = rows.map((o) => ({
    id: String(o.id ?? o._id ?? ''),
    customer: String(o.customer ?? o.userId ?? '—'),
    service: String(o.orderNumber ? `Order #${o.orderNumber}` : 'Order'),
    amount: Number(o.totalAmount ?? o.amount ?? 0),
    status: String(o.status ?? 'pending'),
    date:
      typeof o.createdAt === 'string'
        ? new Date(o.createdAt).toLocaleString()
        : typeof o.date === 'string'
          ? o.date
          : '',
    avatar: o.avatar as string | undefined,
  }))
  return {
    stats: {
      totalRevenue: 0,
      totalOrders: Number(stats.total ?? 0),
      activeProviders: 0,
      averageRating: 0,
      revenueGrowth: 0,
      ordersGrowth: 0,
      providersGrowth: 0,
      ratingChange: 0,
    },
    revenueData: [],
    categoryPerformance: [],
    recentOrders,
    topProviders: [],
  }
}

class DashboardService {
  /**
   * Get admin dashboard data (several backends expose different routes — try each).
   */
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const attempts: Array<{ label: string; run: () => Promise<AdminDashboardData> }> = [
      {
        label: '/dashboard/admin',
        run: async () => {
          const response = (await apiClient.get('/dashboard/admin', {
            showSuccessToast: false,
            showLoading: false,
          })) as any
          return normalizeAdminDashboardPayload(response)
        },
      },
      {
        label: '/dashboard/quick-stats',
        run: async () => {
          const response = (await apiClient.get('/dashboard/quick-stats', {
            showSuccessToast: false,
            showLoading: false,
          })) as any
          return normalizeAdminDashboardPayload(response)
        },
      },
      {
        label: '/orders/dashboard',
        run: async () => {
          const res = await api.get<{
            recentOrders?: Array<Record<string, unknown>>
            stats?: Record<string, unknown>
          }>(`/orders/dashboard?limit=10`, {
            showLoading: false,
            showErrorToast: false,
            showSuccessToast: false,
          })
          return adminDataFromOrdersDashboard(res)
        },
      },
      {
        label: '/orders/stats',
        run: async () => {
          const res = await api.get<OrderStatsResponse>('/orders/stats', {
            showLoading: false,
            showErrorToast: false,
            showSuccessToast: false,
          })
          const inner = res.data
          if (!inner) throw new Error('Empty order stats')
          return normalizeAdminDashboardPayload({
            stats: {
              totalOrders: inner.totalOrders,
              totalRevenue: inner.totalRevenue,
              activeProviders: 0,
              averageRating: 0,
              revenueGrowth: 0,
              ordersGrowth: 0,
              providersGrowth: 0,
              ratingChange: 0,
            },
            recentOrders: inner.recentOrders,
          })
        },
      },
    ]

    let lastError: unknown
    for (const { run } of attempts) {
      try {
        return await run()
      } catch (e) {
        lastError = e
      }
    }
    console.error('Error fetching admin dashboard (all fallbacks failed):', lastError)
    throw lastError instanceof Error ? lastError : new Error('Dashboard unavailable')
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get('/dashboard/quick-stats', {
        showSuccessToast: false,
        showLoading: false,
      }) as any;
      return response.data || response;
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get revenue data for charts
   */
  async getRevenueData(months: number = 6): Promise<RevenueDataPoint[]> {
    try {
      const response = await apiClient.get(`/analytics/revenue?months=${months}`, {
        showSuccessToast: false,
        showLoading: false,
      }) as any;
      return response.data || response;
    } catch (error: any) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  }

  /**
   * Get category performance
   */
  async getCategoryPerformance(): Promise<CategoryPerformance[]> {
    try {
      const response = await apiClient.get('/analytics/categories', {
        showSuccessToast: false,
        showLoading: false,
      }) as any;
      return response.data || response;
    } catch (error: any) {
      console.error('Error fetching category performance:', error);
      throw error;
    }
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    try {
      const response = await apiClient.get(`/orders/recent?limit=${limit}`, {
        showSuccessToast: false,
        showLoading: false,
      }) as any;
      return response.data || response;
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  }

  /**
   * Get top providers
   */
  async getTopProviders(limit: number = 5): Promise<TopProvider[]> {
    try {
      const response = await apiClient.get(`/providers/top?limit=${limit}`, {
        showSuccessToast: false,
        showLoading: false,
      }) as any;
      return response.data || response;
    } catch (error: any) {
      console.error('Error fetching top providers:', error);
      throw error;
    }
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(limit: number = 10) {
    try {
      const response = await apiClient.get(`/dashboard/activity?limit=${limit}`, {
        showSuccessToast: false,
        showLoading: false,
      }) as any;
      return response.data || response;
    } catch (error: any) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;

