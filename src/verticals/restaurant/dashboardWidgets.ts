import type { DashboardLayoutDef } from '../core/dashboardWidgets'

export const restaurantDashboardLayout: DashboardLayoutDef = {
  tagline: "Here's how front-of-house and orders are performing today.",
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
      id: 'covers',
      label: 'Reservations & orders',
      statSource: 'totalOrders',
      growthSource: 'ordersGrowth',
      icon: 'UtensilsCrossed',
      gradient: 'bloom',
      format: 'integer',
    },
    {
      id: 'staff',
      label: 'Active staff',
      statSource: 'activeProviders',
      growthSource: 'providersGrowth',
      icon: 'Users',
      gradient: 'primaryBright',
      format: 'integer',
    },
    {
      id: 'rating',
      label: 'Guest rating',
      statSource: 'averageRating',
      growthSource: 'ratingChange',
      icon: 'Star',
      gradient: 'storm',
      format: 'rating',
    },
  ],
  sections: ['revenue_chart', 'recent_orders', 'top_providers'],
}
