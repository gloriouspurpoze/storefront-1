import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Stack,
  Paper,
  Chip,
} from '@mui/material'
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
// Mock data for charts
const revenueData = [
  { month: 'Jan', revenue: 12000, orders: 45, users: 120 },
  { month: 'Feb', revenue: 15000, orders: 52, users: 135 },
  { month: 'Mar', revenue: 18000, orders: 61, users: 150 },
  { month: 'Apr', revenue: 22000, orders: 73, users: 168 },
  { month: 'May', revenue: 19000, orders: 68, users: 155 },
  { month: 'Jun', revenue: 25000, orders: 85, users: 180 },
  { month: 'Jul', revenue: 28000, orders: 92, users: 195 },
  { month: 'Aug', revenue: 32000, orders: 105, users: 210 },
]
const categoryData = [
  { name: 'Plumbing', value: 35, revenue: 3200, color: '#2563eb' },
  { name: 'Electrical', value: 28, revenue: 2800, color: '#7c3aed' },
  { name: 'Cleaning', value: 20, revenue: 1200, color: '#059669' },
  { name: 'HVAC', value: 12, revenue: 1800, color: '#dc2626' },
  { name: 'Security', value: 5, revenue: 2400, color: '#d97706' },
]
const topProducts = [
  { name: 'Professional Pipe Wrench Set', sales: 45, revenue: 4049.55, growth: 12.5 },
  { name: 'Smart Touchless Faucet', sales: 32, revenue: 9599.68, growth: 8.3 },
  { name: 'LED Recessed Light Kit', sales: 28, revenue: 2239.72, growth: -2.1 },
  { name: 'Smart Thermostat', sales: 25, revenue: 4999.75, growth: 15.7 },
  { name: 'Robot Vacuum Cleaner', sales: 18, revenue: 10799.82, growth: 22.4 },
]
export function Analytics() {
  const theme = useTheme()
  const [timeRange, setTimeRange] = useState('6m')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const handleExport = () => {
    console.log('Exporting analytics data...')
    // Handle export logic here
  }
  const handleRefresh = () => {
    console.log('Refreshing analytics data...')
    // Handle refresh logic here
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
            value={formatCurrency(15420.50)}
            change={20.1}
            icon={<DollarIcon />}
            color="primary"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Orders"
            value="1,234"
            change={12.5}
            icon={<CartIcon />}
            color="success"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Users"
            value="2,456"
            change={8.3}
            icon={<PeopleIcon />}
            color="info"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Avg. Order Value"
            value={formatCurrency(285.75)}
            change={-2.3}
            icon={<AssignmentIcon />}
            color="warning"
            subtitle="This month"
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
                Monthly performance over the last 8 months
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(Number(value)) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  </PieChart>
                </ResponsiveContainer>
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
                Top Performing Products
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Best selling products by revenue
              </Typography>
              <Stack spacing={2}>
                {topProducts.map((product, index) => (
                  <Paper key={index} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {product.name}
                      </Typography>
                      <Chip
                        label={`${product.growth > 0 ? '+' : ''}${product.growth}%`}
                        size="small"
                        color={product.growth > 0 ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {product.sales} sales
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(product.revenue)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
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
                Monthly user registration trends
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill={theme.palette.info.main} />
                  </BarChart>
                </ResponsiveContainer>
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
                4.8
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
                2.3h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. Response Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                89%
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
                156
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