import { apiClient } from '../apiClient';

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
      color: ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
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

  const topProviders: TopProvider[] = Array.isArray(data.topProviders) ? data.topProviders : []

  return {
    stats,
    revenueData,
    categoryPerformance,
    recentOrders,
    topProviders,
  }
}

class DashboardService {
  /**
   * Get admin dashboard data
   */
  async getAdminDashboard(): Promise<AdminDashboardData> {
    try {
      const response = await apiClient.get('/dashboard/admin') as any;
      return normalizeAdminDashboardPayload(response)
    } catch (error: any) {
      console.error('Error fetching admin dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get('/dashboard/quick-stats') as any;
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
      const response = await apiClient.get(`/analytics/revenue?months=${months}`) as any;
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
      const response = await apiClient.get('/analytics/categories') as any;
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
      const response = await apiClient.get(`/orders/recent?limit=${limit}`) as any;
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
      const response = await apiClient.get(`/providers/top?limit=${limit}`) as any;
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
      const response = await apiClient.get(`/dashboard/activity?limit=${limit}`) as any;
      return response.data || response;
    } catch (error: any) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;

