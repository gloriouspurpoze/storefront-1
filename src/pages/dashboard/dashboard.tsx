import React, { useEffect, useState } from 'react'
import {
  Star,
  ArrowRight,
  MoreVertical,
  Circle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts'
import { formatCurrency } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../../services/api/dashboard.service'
import type { AdminDashboardData } from '../../services/api/dashboard.service'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { cn } from '../../lib/utils'
import { CHART_PALETTE, CHART_TOKENS } from '../../lib/chartPalette'
import { useVerticalDashboard } from '../../hooks/useVerticalDashboard'
import { useEngagementStatus } from '../../hooks/useEngagementStatus'
import { VerticalDashboardKpiRow } from '../../components/dashboard/VerticalDashboardKpiRow'

// DESIGN.md tokens (no more hardcoded chart hexes)
const chartColors = {
  primary: CHART_TOKENS.primary,
  secondary: CHART_PALETTE.primaryDeep,
  success: CHART_TOKENS.success,
  warning: CHART_TOKENS.warning,
  error: CHART_TOKENS.destructive,
  info: CHART_TOKENS.info,
  divider: CHART_TOKENS.grid,
  textSecondary: CHART_TOKENS.axis,
  background: CHART_TOKENS.surface,
}

// DESIGN.md token map per booking status (matches StatusBadge mapping)
function statusBadgeClass(status: string) {
  switch (status) {
    case 'completed':
    case 'delivered':
      return 'border-storm-deep/30 bg-storm-mist/30 text-storm-deep'
    case 'in_progress':
    case 'processing':
      return 'border-bloom-coral/30 bg-bloom-rose text-bloom-deep'
    case 'pending':
      return 'border-primary/30 bg-primary-soft text-primary-deep'
    case 'cancelled':
      return 'border-destructive/30 bg-destructive/10 text-destructive'
    default:
      return 'border-hairline bg-cloud text-foreground'
  }
}

function StatusIcon({ status }: { status: string }) {
  const c = 'h-3.5 w-3.5'
  switch (status) {
    case 'completed':
    case 'delivered':
      return <CheckCircle2 className={c} />
    case 'in_progress':
    case 'processing':
      return <Clock className={c} />
    case 'pending':
      return <Clock className={c} />
    default:
      return <Circle className={c} />
  }
}

export function Dashboard() {
  const navigate = useNavigate()
  const { tagline, kpis, hasSection, pack } = useVerticalDashboard()
  const { labelFor } = useEngagementStatus()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setError(null)
      const data = await dashboardService.getAdminDashboard()
      setDashboardData(data)
    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-14 w-14 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">
          <div className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" onClick={fetchDashboardData}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const emptyDashboard: AdminDashboardData = {
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

  const { stats, revenueData, categoryPerformance, recentOrders, topProviders } = dashboardData ?? emptyDashboard

  const safeStats = stats || {
    totalRevenue: 0,
    totalOrders: 0,
    activeProviders: 0,
    averageRating: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    providersGrowth: 0,
    ratingChange: 0,
  }

  const safeRevenueData = revenueData || []
  const safeCategoryPerformance = categoryPerformance || []
  const safeRecentOrders = recentOrders || []
  const safeTopProviders = topProviders || []

  const maxCat =
    safeCategoryPerformance.length > 0 ? Math.max(...safeCategoryPerformance.map((c) => c.value), 1) : 1

  return (
    <div className="min-h-screen flex-1 bg-background p-4 sm:p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back — {pack.label}
          </h1>
          <p className="text-muted-foreground">{tagline ?? "Here's what's happening with your business today"}</p>
        </div>
        <Button
          type="button"
          size="icon"
          className="rounded-full"
          disabled={refreshing}
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
        </Button>
      </div>

      <VerticalDashboardKpiRow widgets={kpis} stats={safeStats} />

      {(hasSection('revenue_chart') || hasSection('category_performance')) && (
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {hasSection('revenue_chart') && (
        <div className={cn(hasSection('category_performance') ? 'lg:col-span-8' : 'lg:col-span-12')}>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Revenue &amp; Orders Overview</h2>
                  <p className="text-sm text-muted-foreground">Performance metrics for the last 6 months</p>
                </div>
                <Button type="button" variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={safeRevenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.divider} />
                    <XAxis dataKey="month" stroke={chartColors.textSecondary} />
                    <YAxis stroke={chartColors.textSecondary} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.background,
                        border: `1px solid ${chartColors.divider}`,
                        borderRadius: 8,
                      }}
                      formatter={(value: number | string, name: string) => [
                        name === 'revenue' ? formatCurrency(Number(value)) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders',
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={chartColors.primary}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke={chartColors.secondary}
                      fillOpacity={1}
                      fill="url(#colorOrders)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {hasSection('category_performance') && (
        <div className={cn(hasSection('revenue_chart') ? 'lg:col-span-4' : 'lg:col-span-12')}>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Top Categories</h2>
                <p className="text-sm text-muted-foreground">Best performing services</p>
              </div>
              <div className="flex flex-col gap-4">
                {safeCategoryPerformance.length > 0 ? (
                  safeCategoryPerformance.map((category) => {
                    const pct = (category.value / maxCat) * 100
                    return (
                      <div key={category.name}>
                        <div className="mb-1 flex justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-primary">{formatCurrency(category.value)}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: category.color }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                          <span>{category.count} services</span>
                          <span className="font-medium text-storm-deep">+{category.growth.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">No category data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
      )}

      {(hasSection('recent_orders') || hasSection('top_providers')) && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {hasSection('recent_orders') && (
        <div className={cn(hasSection('top_providers') ? 'lg:col-span-8' : 'lg:col-span-12')}>
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Recent Orders</h2>
                  <p className="text-sm text-muted-foreground">Latest customer orders</p>
                </div>
                <Button type="button" variant="outline" className="gap-1" onClick={() => navigate('/orders')}>
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {safeRecentOrders.length > 0 ? (
                <ul className="divide-y">
                  {safeRecentOrders.map((order) => (
                    <li key={order.id}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 rounded-md py-3 text-left transition-colors hover:bg-muted/60"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <Avatar className="mt-0.5 h-10 w-10">
                          {order.avatar ? <AvatarImage src={order.avatar} alt="" /> : null}
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {order.customer.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{order.customer}</span>
                            <Badge variant="outline" className="text-xs">
                              {order.id}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                            <span>{order.service}</span>
                            <Circle className="h-1 w-1 fill-current" />
                            <span>{order.date}</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="mb-1 font-semibold">{formatCurrency(order.amount)}</p>
                          <Badge
                            variant="secondary"
                            className={cn('inline-flex max-w-full items-center gap-1 capitalize', statusBadgeClass(order.status))}
                          >
                            <StatusIcon status={order.status} />
                            {labelFor(order.status)}
                          </Badge>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No recent orders</p>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {hasSection('top_providers') && (
        <div className={cn(hasSection('recent_orders') ? 'lg:col-span-4' : 'lg:col-span-12')}>
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Top Providers</h2>
                <p className="text-sm text-muted-foreground">Best performing this month</p>
              </div>
              <div className="flex flex-col gap-3">
                {safeTopProviders.length > 0 ? (
                  safeTopProviders.map((provider) => (
                    <div
                      key={provider.name}
                      className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                          {provider.avatar ? <AvatarImage src={provider.avatar} alt="" /> : null}
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {provider.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{provider.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 text-bloom-coral" />
                            <span className="font-medium">{provider.rating.toFixed(1)}</span>
                            <span>• {provider.jobs} jobs</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-semibold text-primary">{formatCurrency(provider.revenue)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">No provider data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
      )}
    </div>
  )
}

export default Dashboard
