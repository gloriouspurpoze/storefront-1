import type { DashboardLayoutDef } from '../core/dashboardWidgets'

export const salonDashboardLayout: DashboardLayoutDef = {
  tagline: "Here's how appointments and your team are performing today.",
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
      id: 'appointments',
      label: 'Appointments',
      statSource: 'totalOrders',
      growthSource: 'ordersGrowth',
      icon: 'Calendar',
      gradient: 'bloom',
      format: 'integer',
    },
    {
      id: 'stylists',
      label: 'Active stylists',
      statSource: 'activeProviders',
      growthSource: 'providersGrowth',
      icon: 'Scissors',
      gradient: 'primaryBright',
      format: 'integer',
    },
    {
      id: 'rating',
      label: 'Client rating',
      statSource: 'averageRating',
      growthSource: 'ratingChange',
      icon: 'Star',
      gradient: 'storm',
      format: 'rating',
    },
  ],
  sections: ['revenue_chart', 'category_performance', 'recent_orders', 'top_providers'],
}
