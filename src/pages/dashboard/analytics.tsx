import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  IndianRupee,
  ShoppingCart,
  Users,
  ClipboardList,
  Star,
  CalendarClock,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { formatCurrency } from '../../lib/utils'
import { StatCard } from '../../shared/components'
import { TIME_RANGES } from '../../constants'
import { AnalyticsService } from '../../services/api'
import type { DashboardAnalytics } from '../../types'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { CHART_TOKENS, CHART_CATEGORICAL } from '../../lib/chartPalette'

// DESIGN.md tokens (no more hardcoded chart hexes)
const CHART_COLORS = CHART_CATEGORICAL
const COL_PRIMARY = CHART_TOKENS.primary
const COL_SECONDARY = CHART_TOKENS.secondary
const COL_INFO = CHART_TOKENS.info
const COL_SUCCESS = CHART_TOKENS.success

function getMonthsFromTimeRange(timeRange: string): number {
  switch (timeRange) {
    case TIME_RANGES.LAST_7_DAYS:
    case TIME_RANGES.LAST_30_DAYS:
      return 1
    case TIME_RANGES.LAST_3_MONTHS:
      return 3
    case TIME_RANGES.LAST_6_MONTHS:
      return 6
    case TIME_RANGES.LAST_YEAR:
      return 12
    default:
      return 6
  }
}

function getDateRangeFromTimeRange(timeRange: string): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  switch (timeRange) {
    case TIME_RANGES.LAST_7_DAYS:
      start.setDate(start.getDate() - 7)
      break
    case TIME_RANGES.LAST_30_DAYS:
      start.setDate(start.getDate() - 30)
      break
    case TIME_RANGES.LAST_3_MONTHS:
      start.setMonth(start.getMonth() - 3)
      break
    case TIME_RANGES.LAST_6_MONTHS:
      start.setMonth(start.getMonth() - 6)
      break
    case TIME_RANGES.LAST_YEAR:
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      start.setMonth(start.getMonth() - 6)
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export function Analytics() {
  const [timeRange, setTimeRange] = useState<string>(TIME_RANGES.LAST_6_MONTHS)
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<DashboardAnalytics['overview'] | null>(null)
  const [revenueAnalytics, setRevenueAnalytics] = useState<{
    totalRevenue: number
    growthRate: number
    averageRevenue: number
    revenueBreakdown: Array<{ period: string; revenue: number; bookings: number }>
    revenueByServiceType: Array<{ serviceType: string; revenue: number; percentage: number }>
  } | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<{
    totalUsers: number
    newUsers: number
    userGrowth: Array<{ date: string; newUsers: number; totalUsers: number }>
  } | null>(null)
  const [providerAnalytics, setProviderAnalytics] = useState<{
    totalProviders: number
    topProviders: Array<{
      id: string
      businessName: string
      rating: number
      totalBookings: number
      totalRevenue: number
    }>
  } | null>(null)
  const [bookingAnalytics, setBookingAnalytics] = useState<{
    completionRate: number
    averageBookingValue: number
  } | null>(null)
  const [dashboardServiceStats, setDashboardServiceStats] = useState<DashboardAnalytics['serviceStats']>([])

  const months = useMemo(() => getMonthsFromTimeRange(timeRange), [timeRange])
  const dateRange = useMemo(() => getDateRangeFromTimeRange(timeRange), [timeRange])

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardRes, revenueRes, usersRes, providersRes, bookingRes] = await Promise.allSettled([
        AnalyticsService.getDashboardAnalytics(),
        AnalyticsService.getRevenueAnalytics('monthly', months),
        AnalyticsService.getUserAnalytics(dateRange),
        AnalyticsService.getProviderAnalytics(dateRange),
        AnalyticsService.getBookingAnalytics(dateRange),
      ])

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value?.success && dashboardRes.value?.data) {
        const data = dashboardRes.value.data as DashboardAnalytics
        setOverview(data.overview ?? null)
        setDashboardServiceStats(data.serviceStats ?? [])
      }
      if (revenueRes.status === 'fulfilled' && revenueRes.value?.success && revenueRes.value?.data) {
        const data = revenueRes.value.data as {
          totalRevenue: number
          growthRate: number
          averageRevenue: number
          revenueBreakdown: Array<{ period: string; revenue: number; bookings: number }>
          revenueByServiceType: Array<{ serviceType: string; revenue: number; percentage: number }>
        }
        setRevenueAnalytics({
          totalRevenue: data.totalRevenue ?? 0,
          growthRate: data.growthRate ?? 0,
          averageRevenue: data.averageRevenue ?? 0,
          revenueBreakdown: data.revenueBreakdown ?? [],
          revenueByServiceType: data.revenueByServiceType ?? [],
        })
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.success && usersRes.value?.data) {
        const data = usersRes.value.data as {
          totalUsers: number
          newUsers: number
          userGrowth: Array<{ date: string; newUsers: number; totalUsers: number }>
        }
        setUserAnalytics({
          totalUsers: data.totalUsers ?? 0,
          newUsers: data.newUsers ?? 0,
          userGrowth: data.userGrowth ?? [],
        })
      }
      if (providersRes.status === 'fulfilled' && providersRes.value?.success && providersRes.value?.data) {
        const data = providersRes.value.data as {
          totalProviders: number
          topProviders: Array<{
            id: string
            businessName: string
            rating: number
            totalBookings: number
            totalRevenue: number
          }>
        }
        setProviderAnalytics({
          totalProviders: data.totalProviders ?? 0,
          topProviders: data.topProviders ?? [],
        })
      }
      if (bookingRes.status === 'fulfilled' && bookingRes.value?.success && bookingRes.value?.data) {
        const data = bookingRes.value.data as { completionRate: number; averageBookingValue: number }
        setBookingAnalytics({
          completionRate: data.completionRate ?? 0,
          averageBookingValue: data.averageBookingValue ?? 0,
        })
      }

      const firstRejection = [dashboardRes, revenueRes].find((r) => r.status === 'rejected')
      if (firstRejection?.status === 'rejected') {
        setError((firstRejection as PromiseRejectedResult).reason?.message ?? 'Failed to load analytics')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [timeRange, months])

  const revenueChartData = useMemo(() => {
    if (!revenueAnalytics?.revenueBreakdown?.length) return []
    return revenueAnalytics.revenueBreakdown.map((p) => ({
      month: p.period?.length >= 3 ? p.period.slice(0, 3) : p.period,
      revenue: p.revenue ?? 0,
      orders: p.bookings ?? 0,
    }))
  }, [revenueAnalytics])

  const categoryChartData = useMemo(() => {
    if (!revenueAnalytics?.revenueByServiceType?.length) return []
    return revenueAnalytics.revenueByServiceType.map((s, i) => ({
      name: s.serviceType || 'Other',
      value: s.percentage ?? 0,
      revenue: s.revenue ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [revenueAnalytics])

  const userGrowthChartData = useMemo(() => {
    if (!userAnalytics?.userGrowth?.length) return []
    return userAnalytics.userGrowth.map((u) => ({
      date: u.date,
      users: u.totalUsers ?? 0,
      newUsers: u.newUsers ?? 0,
    }))
  }, [userAnalytics])

  const handleExport = async () => {
    try {
      await AnalyticsService.exportAnalyticsData({
        reportType: 'analytics-dashboard',
        format: 'csv',
        dateRange: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      })
    } catch {
      // Error handled by service toast
    }
  }

  const handleRefresh = () => fetchAll()

  if (loading && !overview && !revenueAnalytics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-14 w-14 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex-1">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics dashboard</h1>
          <p className="text-muted-foreground">Track your business performance and key metrics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-1" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" variant="outline" className="gap-1" asChild>
            <Link to="/analytics/funnels">Growth funnels</Link>
          </Button>
          <Button type="button" className="gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 rounded-md border border-bloom-coral/50 bg-bloom-coral/10 px-3 py-2 text-sm text-bloom-coral dark:text-bloom-deep"
          role="alert"
        >
          <div className="flex items-center justify-between gap-2">
            {error}
            <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Time range</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_RANGES.LAST_7_DAYS}>Last 7 days</SelectItem>
                <SelectItem value={TIME_RANGES.LAST_30_DAYS}>Last 30 days</SelectItem>
                <SelectItem value={TIME_RANGES.LAST_3_MONTHS}>Last 3 months</SelectItem>
                <SelectItem value={TIME_RANGES.LAST_6_MONTHS}>Last 6 months</SelectItem>
                <SelectItem value={TIME_RANGES.LAST_YEAR}>Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Metric</Label>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger>
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <StatCard
            title="Total revenue"
            value={formatCurrency(revenueAnalytics?.totalRevenue ?? overview?.totalRevenue ?? 0)}
            change={revenueAnalytics?.growthRate}
            icon={<IndianRupee className="h-6 w-6" />}
            color="primary"
            subtitle={`Last ${months} month(s)`}
          />
        </div>
        <div>
          <StatCard
            title="Total bookings"
            value={String(overview?.totalBookings ?? 0)}
            icon={<ShoppingCart className="h-6 w-6" />}
            color="success"
            subtitle={`Last ${months} month(s)`}
          />
        </div>
        <div>
          <StatCard
            title="Active users"
            value={String(overview?.totalUsers ?? userAnalytics?.totalUsers ?? 0)}
            icon={<Users className="h-6 w-6" />}
            color="info"
            subtitle={`Last ${months} month(s)`}
          />
        </div>
        <div>
          <StatCard
            title="Avg. booking value"
            value={formatCurrency(bookingAnalytics?.averageBookingValue ?? revenueAnalytics?.averageRevenue ?? 0)}
            icon={<ClipboardList className="h-6 w-6" />}
            color="warning"
            subtitle={`Last ${months} month(s)`}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Revenue &amp; orders trend</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Monthly performance over the last {months} month(s)
              </p>
              <div className="h-[350px] w-full min-w-0">
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? 'Revenue' : 'Bookings',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke={COL_PRIMARY}
                        fill={COL_PRIMARY}
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stackId="2"
                        stroke={COL_SECONDARY}
                        fill={COL_SECONDARY}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No revenue data for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Revenue by category</h2>
              <p className="mb-4 text-sm text-muted-foreground">Distribution of revenue across service categories</p>
              <div className="h-[300px] w-full min-w-0">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No category data for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Top providers</h2>
            <p className="mb-4 text-sm text-muted-foreground">Top providers by bookings and revenue</p>
            <div className="space-y-3">
              {(providerAnalytics?.topProviders?.length ? providerAnalytics.topProviders : []).map((provider, index) => (
                <div key={provider.id || index} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">{provider.businessName || 'Provider'}</span>
                    <Badge variant="outline" className="text-xs">
                      ★ {Number(provider.rating).toFixed(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{provider.totalBookings ?? 0} bookings</span>
                    <span className="font-semibold">{formatCurrency(provider.totalRevenue ?? 0)}</span>
                  </div>
                </div>
              ))}
              {(!providerAnalytics?.topProviders?.length) && (
                <p className="py-6 text-center text-sm text-muted-foreground">No provider data for this period</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">User growth</h2>
            <p className="mb-4 text-sm text-muted-foreground">User registration trends</p>
            <div className="h-[300px] w-full min-w-0">
              {userGrowthChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userGrowthChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" name="Total users" fill={COL_INFO} />
                    <Bar dataKey="newUsers" name="New users" fill={COL_SUCCESS} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No user growth data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="mx-auto mb-2 h-10 w-10 text-bloom-coral" />
            <p className="mb-1 text-3xl font-bold">
              {dashboardServiceStats.length > 0
                ? (
                    dashboardServiceStats.reduce((s, t) => s + (t.averageRating ?? 0), 0) / dashboardServiceStats.length
                  ).toFixed(1)
                : '—'}
            </p>
            <p className="text-sm text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CalendarClock className="mx-auto mb-2 h-10 w-10 text-primary" />
            <p className="mb-1 text-3xl font-bold">{overview?.totalServiceRequests ?? '—'}</p>
            <p className="text-sm text-muted-foreground">Service requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <ClipboardList className="mx-auto mb-2 h-10 w-10 text-storm-deep" />
            <p className="mb-1 text-3xl font-bold">
              {bookingAnalytics?.completionRate != null
                ? `${(bookingAnalytics.completionRate <= 1 ? bookingAnalytics.completionRate * 100 : bookingAnalytics.completionRate).toFixed(0)}%`
                : '—'}
            </p>
            <p className="text-sm text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="mx-auto mb-2 h-10 w-10 text-primary" />
            <p className="mb-1 text-3xl font-bold">
              {overview?.totalProviders ?? providerAnalytics?.totalProviders ?? '—'}
            </p>
            <p className="text-sm text-muted-foreground">Active providers</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
