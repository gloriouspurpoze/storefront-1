/**
 * ============================================================================
 * PROFESSIONAL DASHBOARD
 * ============================================================================
 * Main dashboard for professionals (when they login to admin panel)
 * 
 * Features:
 * - Statistics overview (bookings, earnings, ratings)
 * - Recent bookings
 * - Today's schedule
 * - Quick actions
 * - Notifications
 * - Earnings chart
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  TrendingUp,
  CalendarToday,
  AttachMoney,
  Star,
  Assignment,
  Notifications,
  Schedule,
  CheckCircle,
  Pending,
  Phone,
  Navigation,
  Refresh,
} from '@mui/icons-material'
import { useAppSelector } from '../../store/hooks'
import { BookingsService } from '../../services/api/bookings.service'
import { useNavigate } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Stats {
  totalBookings: number
  pendingBookings: number
  completedBookings: number
  todaysBookings: number
  totalEarnings: number
  thisMonthEarnings: number
  averageRating: number
  totalReviews: number
}

interface Booking {
  _id: string
  serviceName: string
  customerName: string
  customerPhone: string
  scheduledDate: string
  scheduledTime: string
  address: {
    area: string
    city: string
  }
  status: string
  totalAmount: number
}

export function ProfessionalDashboard() {
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    todaysBookings: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('📊 Loading professional dashboard data...')
      
      // Load stats from API using professional endpoint
      // Note: Backend uses /provider/my-bookings for both but routes correctly by JWT userType
      const statsResponse = await BookingsService.getProfessionalBookings({ limit: 1000 })
      
      if (statsResponse.success && statsResponse.data) {
        const allBookings = statsResponse.data.bookings || statsResponse.data || []
        
        // Calculate stats from bookings
        const pending = allBookings.filter(b => b.status === 'pending').length
        const completed = allBookings.filter(b => b.status === 'completed').length
        const today = new Date().toISOString().split('T')[0]
        const todaysCount = allBookings.filter(b => 
          b.scheduledDate && b.scheduledDate.startsWith(today)
        ).length
        
        const totalEarnings = allBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
        
        const thisMonth = new Date().getMonth()
        const thisMonthEarnings = allBookings
          .filter(b => {
            if (b.status !== 'completed' || !b.completedDate) return false
            const bookingMonth = new Date(b.completedDate).getMonth()
            return bookingMonth === thisMonth
          })
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
        
        setStats({
          totalBookings: allBookings.length,
          pendingBookings: pending,
          completedBookings: completed,
          todaysBookings: todaysCount,
          totalEarnings,
          thisMonthEarnings,
          averageRating: user?.averageRating || 0,
          totalReviews: user?.totalReviews || 0,
        })
        
        // Get recent bookings (last 5)
        const recent = allBookings
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 5)
          .map(booking => ({
            _id: booking._id || booking.id,
            serviceName: booking.services?.[0]?.serviceName || booking.services?.[0]?.serviceDetails?.name || 'Service',
            customerName: `${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''}`.trim() || 'Customer',
            customerPhone: booking.customer?.phone || booking.address?.phone || 'N/A',
            scheduledDate: booking.scheduledDate ? new Date(booking.scheduledDate).toISOString().split('T')[0] : 'N/A',
            scheduledTime: booking.scheduledTime || 'N/A',
            address: {
              area: booking.address?.area || '',
              city: booking.address?.city || 'N/A',
            },
            status: booking.status || 'pending',
            totalAmount: booking.totalAmount || 0,
          }))
        
        setRecentBookings(recent)
        
        // Get today's bookings
        const todaysBookings = allBookings
          .filter(b => b.scheduledDate && b.scheduledDate.startsWith(today))
          .map(booking => ({
            _id: booking._id || booking.id,
            serviceName: booking.services?.[0]?.serviceName || booking.services?.[0]?.serviceDetails?.name || 'Service',
            customerName: `${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''}`.trim() || 'Customer',
            customerPhone: booking.customer?.phone || booking.address?.phone || 'N/A',
            scheduledDate: booking.scheduledDate ? new Date(booking.scheduledDate).toISOString().split('T')[0] : 'N/A',
            scheduledTime: booking.scheduledTime || 'N/A',
            address: {
              area: booking.address?.area || '',
              city: booking.address?.city || 'N/A',
            },
            status: booking.status || 'pending',
            totalAmount: booking.totalAmount || 0,
          }))
        
        setTodayBookings(todaysBookings)
        
        console.log('✅ Dashboard data loaded successfully')
      } else {
        throw new Error(statsResponse.message || 'Failed to load dashboard data')
      }
    } catch (err: any) {
      console.error('❌ Failed to load dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'confirmed': return 'info'
      case 'in_progress': return 'primary'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const earningsChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        label: 'Monthly Earnings (₹)',
        data: [8000, 9500, 11000, 10500, 12000, 11500, 13000, 12500, 14000, 13500, 12500],
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderColor: 'rgba(37, 99, 235, 1)',
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Welcome back, {user?.firstName || 'Professional'}! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Here's what's happening with your bookings today
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadDashboardData}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Bookings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalBookings}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    +{stats.pendingBookings} pending
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                  <Assignment sx={{ color: 'primary.main' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Today's Jobs
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.todaysBookings}
                  </Typography>
                  <Typography variant="caption" color="info.main">
                    {stats.completedBookings} completed
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', width: 56, height: 56 }}>
                  <CalendarToday sx={{ color: 'info.main' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    This Month
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{stats.thisMonthEarnings.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    ₹{stats.totalEarnings.toLocaleString()} total
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                  <AttachMoney sx={{ color: 'success.main' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Rating
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.averageRating}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats.totalReviews} reviews
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                  <Star sx={{ color: 'warning.main' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Schedule */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Today's Schedule
              </Typography>
              <Button size="small" href="/professional/bookings">
                View All
              </Button>
            </Box>

            {todayBookings.length === 0 ? (
              <Alert severity="info">No bookings scheduled for today</Alert>
            ) : (
              <List>
                {todayBookings.map((booking, index) => (
                  <React.Fragment key={booking._id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{ px: 0, cursor: 'pointer' }}
                      onClick={() => navigate(`/bookings/${booking._id}`)}
                      secondaryAction={
                        <Box display="flex" gap={1}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`tel:${booking.customerPhone}`)
                            }}
                          >
                            <Phone />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              const query = `${booking.address.area}, ${booking.address.city}`
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
                            }}
                          >
                            <Navigation />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <Schedule sx={{ color: 'primary.main' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {booking.serviceName}
                            </Typography>
                            <Chip
                              label={booking.status}
                              size="small"
                              color={getStatusColor(booking.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {booking.customerName} • {booking.customerPhone}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {booking.scheduledTime} • {booking.address.area}, {booking.address.city}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              ₹{booking.totalAmount}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'success.light' }}>
                    <CheckCircle sx={{ color: 'success.main' }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Booking Completed"
                  secondary="AC Repair - John Doe"
                />
              </ListItem>
              <Divider />
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'warning.light' }}>
                    <Pending sx={{ color: 'warning.main' }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="New Booking Assigned"
                  secondary="Plumbing - Jane Smith"
                />
              </ListItem>
              <Divider />
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'info.light' }}>
                    <Star sx={{ color: 'info.main' }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="New Review"
                  secondary="5 stars from Sarah"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Earnings Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Earnings Overview
              </Typography>
              <Button size="small" href="/professional/earnings">
                View Details
              </Button>
            </Box>
            <Box height={300}>
              <Line data={earningsChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

