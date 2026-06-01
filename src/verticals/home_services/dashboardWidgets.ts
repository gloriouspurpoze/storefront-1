import type { DashboardLayoutDef } from '../core/dashboardWidgets'

export const homeServicesDashboardLayout: DashboardLayoutDef = {
  tagline: "Here's what's happening with your home services business today.",
  kpis: [
    {
      id: 'revenue',
      label: 'Total revenue',
      statSource: 'totalRevenue',
      growthSource: 'revenueGrowth',
      icon: 'IndianRupee',
      gradient: 'primary',
      format: 'currency',
    },
    {
      id: 'orders',
      label: 'Total bookings',
      statSource: 'totalOrders',
      growthSource: 'ordersGrowth',
      icon: 'ShoppingCart',
      gradient: 'bloom',
      format: 'integer',
    },
    {
      id: 'providers',
      label: 'Active professionals',
      statSource: 'activeProviders',
      growthSource: 'providersGrowth',
      icon: 'Wrench',
      gradient: 'primaryBright',
      format: 'integer',
    },
    {
      id: 'rating',
      label: 'Avg. rating',
      statSource: 'averageRating',
      growthSource: 'ratingChange',
      icon: 'Star',
      gradient: 'storm',
      format: 'rating',
    },
  ],
  sections: ['revenue_chart', 'category_performance', 'recent_orders', 'top_providers'],
}
