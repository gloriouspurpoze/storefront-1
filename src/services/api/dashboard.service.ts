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

class DashboardService {
  /**
   * Get admin dashboard data
   */
  async getAdminDashboard(): Promise<AdminDashboardData> {
    try {
      const response = await apiClient.get('/dashboard/admin') as any;
      // apiClient.get() returns the parsed JSON response directly
      // Backend returns: { success: true, message: '...', data: {...} }
      const data = response.data || response;
      
      // Ensure all required properties exist with defaults
      return {
        stats: data.stats || {
          totalRevenue: 0,
          totalOrders: 0,
          activeProviders: 0,
          averageRating: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
          providersGrowth: 0,
          ratingChange: 0
        },
        revenueData: data.revenueData || [],
        categoryPerformance: data.categoryPerformance || [],
        recentOrders: data.recentOrders || [],
        topProviders: data.topProviders || []
      };
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

