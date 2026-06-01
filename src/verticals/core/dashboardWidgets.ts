/** KPI stat fields returned by `dashboardService.getAdminDashboard()`. */
export type DashboardStatSource =
  | 'totalRevenue'
  | 'totalOrders'
  | 'activeProviders'
  | 'averageRating'

export type DashboardGrowthSource =
  | 'revenueGrowth'
  | 'ordersGrowth'
  | 'providersGrowth'
  | 'ratingChange'

export type DashboardKpiGradient = 'primary' | 'bloom' | 'primaryBright' | 'storm'

/** Lucide icon name — same convention as sidebar (`verticalIconRegistry`). */
export type DashboardWidgetIcon = string

export interface DashboardKpiWidgetDef {
  id: string
  label: string
  statSource: DashboardStatSource
  growthSource: DashboardGrowthSource
  icon: DashboardWidgetIcon
  gradient: DashboardKpiGradient
  /** Format revenue with `formatCurrency`; counts/ratings as plain numbers. */
  format: 'currency' | 'integer' | 'rating'
}

export type DashboardSectionKey =
  | 'revenue_chart'
  | 'category_performance'
  | 'recent_orders'
  | 'top_providers'

export interface DashboardLayoutDef {
  kpis: DashboardKpiWidgetDef[]
  sections: DashboardSectionKey[]
  /** Subtitle under the dashboard greeting. */
  tagline?: string
}
