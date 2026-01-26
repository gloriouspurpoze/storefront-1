import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  useMediaQuery,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  LinearProgress,
  IconButton,
  Button,
  Divider,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  ShoppingCart as ShoppingCartIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreVertIcon,
  FiberManualRecord as DotIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  LocalOffer as LocalOfferIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend
} from 'recharts'
import { formatCurrency } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import { useTheme as useCustomTheme, useThemeColors } from '../../contexts/theme-context'
import { dashboardService } from '../../services/api/dashboard.service'
import type { AdminDashboardData } from '../../services/api/dashboard.service'

// Color palette for charts
const chartColors = {
  primary: '#2563eb',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  divider: '#e5e7eb',
  textSecondary: '#6b7280',
  background: '#ffffff',
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
    case 'delivered':
      return 'success'
    case 'in_progress':
    case 'processing':
      return 'warning'
    case 'pending':
      return 'info'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
    case 'delivered':
      return <CheckCircleIcon fontSize="small" />
    case 'in_progress':
    case 'processing':
      return <ScheduleIcon fontSize="small" />
    case 'pending':
      return <PendingIcon fontSize="small" />
    default:
      return <DotIcon fontSize="small" />
  }
}

export function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setError(null)
      const data = await dashboardService.getAdminDashboard()
      setDashboardData(data)
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!dashboardData) {
    return null
  }

  const { 
    stats, 
    revenueData, 
    categoryPerformance, 
    recentOrders, 
    topProviders 
  } = dashboardData

  // Provide default values to prevent undefined errors
  const safeStats = stats || {
    totalRevenue: 0,
    totalOrders: 0,
    activeProviders: 0,
    averageRating: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    providersGrowth: 0,
    ratingChange: 0
  }

  const safeRevenueData = revenueData || []
  const safeCategoryPerformance = categoryPerformance || []
  const safeRecentOrders = recentOrders || []
  const safeTopProviders = topProviders || []

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default' }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              mb: 0.5,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
            }}
          >
            Welcome back, Admin! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your business today
          </Typography>
        </Box>
        <IconButton 
          onClick={handleRefresh} 
          disabled={refreshing}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          <RefreshIcon className={refreshing ? 'rotating' : ''} />
        </IconButton>
      </Box>

      {/* Key Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              top: '-100px',
              right: '-50px'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Revenue
                </Typography>
                <MoneyIcon sx={{ opacity: 0.8 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {formatCurrency(safeStats.totalRevenue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {safeStats.revenueGrowth >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                <Typography variant="body2">
                  {safeStats.revenueGrowth >= 0 ? '+' : ''}{safeStats.revenueGrowth.toFixed(1)}% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              top: '-100px',
              right: '-50px'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Orders
                </Typography>
                <ShoppingCartIcon sx={{ opacity: 0.8 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {safeStats.totalOrders}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {safeStats.ordersGrowth >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                <Typography variant="body2">
                  {safeStats.ordersGrowth >= 0 ? '+' : ''}{safeStats.ordersGrowth.toFixed(1)}% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              top: '-100px',
              right: '-50px'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Active Providers
                </Typography>
                <BuildIcon sx={{ opacity: 0.8 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {safeStats.activeProviders}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {safeStats.providersGrowth >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                <Typography variant="body2">
                  {safeStats.providersGrowth >= 0 ? '+' : ''}{safeStats.providersGrowth.toFixed(1)}% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              top: '-100px',
              right: '-50px'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Avg. Rating
                </Typography>
                <StarIcon sx={{ opacity: 0.8 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {safeStats.averageRating.toFixed(1)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {safeStats.ratingChange >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                <Typography variant="body2">
                  {safeStats.ratingChange >= 0 ? '+' : ''}{safeStats.ratingChange.toFixed(1)} from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Revenue & Orders Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Performance metrics for the last 6 months
                </Typography>
              </Box>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.divider} />
                  <XAxis dataKey="month" stroke={chartColors.textSecondary} />
                  <YAxis stroke={chartColors.textSecondary} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: chartColors.background,
                      border: `1px solid ${chartColors.divider}`,
                      borderRadius: 8
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
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
            </Box>
          </Paper>
        </Grid>

        {/* Category Performance */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Top Categories
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Best performing services
                </Typography>
              </Box>
            </Box>
            <Stack spacing={2}>
              {safeCategoryPerformance.length > 0 ? (
                safeCategoryPerformance.map((category, index) => (
                  <Box key={category.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: category.color
                          }}
                        />
                        <Typography variant="body2" fontWeight={500}>
                          {category.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {formatCurrency(category.value)}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(category.value / (safeCategoryPerformance[0]?.value || 1)) * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: `${category.color}20`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: category.color,
                          borderRadius: 3
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {category.count} services
                      </Typography>
                      <Typography variant="caption" color="success.main" fontWeight={500}>
                        +{category.growth.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No category data available
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Orders & Top Providers */}
      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Recent Orders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest customer orders
                </Typography>
              </Box>
              <Button 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/orders')}
              >
                View All
              </Button>
            </Box>
            <List>
              {safeRecentOrders.length > 0 ? (
                safeRecentOrders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    <ListItem 
                      sx={{ 
                        px: 0,
                        py: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderRadius: 1,
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar src={order.avatar} sx={{ bgcolor: 'primary.main' }}>
                          {order.customer.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {order.customer}
                            </Typography>
                            <Chip 
                              label={order.id}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {order.service}
                            </Typography>
                            <DotIcon sx={{ fontSize: 6, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {order.date}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                          {formatCurrency(order.amount)}
                        </Typography>
                        <Chip 
                          label={order.status}
                          size="small"
                          color={getStatusColor(order.status) as any}
                          icon={getStatusIcon(order.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                    </ListItem>
                    {index < safeRecentOrders.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No recent orders
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Top Providers */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Top Providers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Best performing this month
                </Typography>
              </Box>
            </Box>
            <Stack spacing={2}>
              {safeTopProviders.length > 0 ? (
                safeTopProviders.map((provider, index) => (
                  <Box 
                    key={provider.name}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${chartColors.divider}`,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        cursor: 'pointer'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Avatar src={provider.avatar} sx={{ bgcolor: 'primary.main' }}>
                        {provider.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {provider.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                          <Typography variant="caption" fontWeight={500}>
                            {provider.rating.toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            • {provider.jobs} jobs
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Revenue
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={600} color="primary">
                        {formatCurrency(provider.revenue)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No provider data available
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Add CSS for rotating animation */}
      <style>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </Box>
  )
}

export default Dashboard
