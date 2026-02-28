import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Stack,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  AttachMoney as DollarIcon,
  People as PeopleIcon,
  ShoppingCart as CartIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
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

const CHART_COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#4f46e5', '#b45309']

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
  const theme = useTheme()
  const [timeRange, setTimeRange] = useState('6m')
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
    topProviders: Array<{ id: string; businessName: string; rating: number; totalBookings: number; totalRevenue: number }>
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
          topProviders: Array<{ id: string; businessName: string; rating: number; totalBookings: number; totalRevenue: number }>
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your business performance and key metrics
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Stack>
      </Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value={TIME_RANGES.LAST_7_DAYS}>Last 7 days</MenuItem>
                  <MenuItem value={TIME_RANGES.LAST_30_DAYS}>Last 30 days</MenuItem>
                  <MenuItem value={TIME_RANGES.LAST_3_MONTHS}>Last 3 months</MenuItem>
                  <MenuItem value={TIME_RANGES.LAST_6_MONTHS}>Last 6 months</MenuItem>
                  <MenuItem value={TIME_RANGES.LAST_YEAR}>Last year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={selectedMetric}
                  label="Metric"
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <MenuItem value="revenue">Revenue</MenuItem>
                  <MenuItem value="orders">Orders</MenuItem>
                  <MenuItem value="users">Users</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(revenueAnalytics?.totalRevenue ?? overview?.totalRevenue ?? 0)}
            change={revenueAnalytics?.growthRate}
            icon={<DollarIcon />}
            color="primary"
            subtitle={`Last ${months} month(s)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Bookings"
            value={String(overview?.totalBookings ?? 0)}
            icon={<CartIcon />}
            color="success"
            subtitle={`Last ${months} month(s)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Users"
            value={String(overview?.totalUsers ?? userAnalytics?.totalUsers ?? 0)}
            icon={<PeopleIcon />}
            color="info"
            subtitle={`Last ${months} month(s)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Avg. Booking Value"
            value={formatCurrency(bookingAnalytics?.averageBookingValue ?? revenueAnalytics?.averageRevenue ?? 0)}
            icon={<AssignmentIcon />}
            color="warning"
            subtitle={`Last ${months} month(s)`}
          />
        </Grid>
      </Grid>
      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Revenue & Orders Trend
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monthly performance over the last {months} month(s)
              </Typography>
              <Box sx={{ height: 350 }}>
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
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.main}
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stackId="2"
                        stroke={theme.palette.secondary.main}
                        fill={theme.palette.secondary.main}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                    No revenue data for this period
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Revenue by Category
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Distribution of revenue across service categories
              </Typography>
              <Box sx={{ height: 300 }}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                    No category data for this period
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Bottom Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Top Providers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Top providers by bookings and revenue
              </Typography>
              <Stack spacing={2}>
                {(providerAnalytics?.topProviders?.length
                  ? providerAnalytics.topProviders
                  : []
                ).map((provider, index) => (
                  <Paper key={provider.id || index} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {provider.businessName || 'Provider'}
                      </Typography>
                      <Chip
                        label={`★ ${Number(provider.rating).toFixed(1)}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {provider.totalBookings ?? 0} bookings
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(provider.totalRevenue ?? 0)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
                {(!providerAnalytics?.topProviders?.length) && (
                  <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    No provider data for this period
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                User Growth
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                User registration trends
              </Typography>
              <Box sx={{ height: 300 }}>
                {userGrowthChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userGrowthChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" name="Total users" fill={theme.palette.info.main} />
                      <Bar dataKey="newUsers" name="New users" fill={theme.palette.success.main} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                    No user growth data for this period
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Additional Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {dashboardServiceStats.length > 0
                  ? (
                      dashboardServiceStats.reduce((s, t) => s + (t.averageRating ?? 0), 0) /
                      dashboardServiceStats.length
                    ).toFixed(1)
                  : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {overview?.totalServiceRequests ?? '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Service Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {bookingAnalytics?.completionRate != null
                  ? `${(bookingAnalytics.completionRate <= 1 ? bookingAnalytics.completionRate * 100 : bookingAnalytics.completionRate).toFixed(0)}%`
                  : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {overview?.totalProviders ?? providerAnalytics?.totalProviders ?? '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Providers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}