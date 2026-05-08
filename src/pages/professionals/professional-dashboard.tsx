/**
 * ============================================================================
 * PROFESSIONAL DASHBOARD
 * ============================================================================
 * Main dashboard for professionals (when they login to admin panel)
 */

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  IndianRupee,
  Star,
  ClipboardList,
  Clock,
  CheckCircle2,
  Loader2,
  CircleAlert,
  Phone,
  Navigation,
  RefreshCw,
} from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
import { BookingsService } from '../../services/api/bookings.service'
import { useNavigate, Link } from 'react-router-dom'
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
import { Badge, Button, Card, CardContent } from '../../components/ui'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

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

function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'confirmed':
      return 'secondary'
    case 'in_progress':
      return 'default'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
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
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const statsResponse = await BookingsService.getProfessionalBookings({ limit: 1000 })

      if (statsResponse.success && statsResponse.data) {
        const allBookings = statsResponse.data.bookings || statsResponse.data || []

        const pending = allBookings.filter((b) => b.status === 'pending').length
        const completed = allBookings.filter((b) => b.status === 'completed').length
        const today = new Date().toISOString().split('T')[0]
        const todaysCount = allBookings.filter(
          (b) => b.scheduledDate && b.scheduledDate.startsWith(today),
        ).length

        const totalEarnings = allBookings
          .filter((b) => b.status === 'completed')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)

        const thisMonth = new Date().getMonth()
        const thisMonthEarnings = allBookings
          .filter((b) => {
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

        const todaysBookingsList = allBookings
          .filter((b) => b.scheduledDate && b.scheduledDate.startsWith(today))
          .map((booking) => ({
            _id: booking._id || booking.id,
            serviceName:
              booking.services?.[0]?.serviceName ||
              booking.services?.[0]?.serviceDetails?.name ||
              'Service',
            customerName:
              `${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''}`.trim() || 'Customer',
            customerPhone: booking.customer?.phone || booking.address?.phone || 'N/A',
            scheduledDate: booking.scheduledDate
              ? new Date(booking.scheduledDate).toISOString().split('T')[0]
              : 'N/A',
            scheduledTime: booking.scheduledTime || 'N/A',
            address: {
              area: booking.address?.area || '',
              city: booking.address?.city || 'N/A',
            },
            status: booking.status || 'pending',
            totalAmount: booking.totalAmount || 0,
          }))

        setTodayBookings(todaysBookingsList)
      } else {
        throw new Error(statsResponse.message || 'Failed to load dashboard data')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(message)
    } finally {
      setLoading(false)
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
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.firstName || 'Professional'}!</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening with your bookings today</p>
        </div>
        <Button type="button" variant="outline" onClick={loadDashboardData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-3xl font-bold">{stats.totalBookings}</p>
                <p className="text-xs text-green-600">+{stats.pendingBookings} pending</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <ClipboardList className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Jobs</p>
                <p className="text-3xl font-bold">{stats.todaysBookings}</p>
                <p className="text-xs text-sky-600">{stats.completedBookings} completed</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/10">
                <Calendar className="h-7 w-7 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold">₹{stats.thisMonthEarnings.toLocaleString()}</p>
                <p className="text-xs text-green-600">₹{stats.totalEarnings.toLocaleString()} total</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
                <IndianRupee className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-3xl font-bold">{stats.averageRating}</p>
                <p className="text-xs text-muted-foreground">{stats.totalReviews} reviews</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
                <Star className="h-7 w-7 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="border-border shadow-none lg:col-span-8">
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Today's Schedule</h2>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/professional/bookings">View All</Link>
              </Button>
            </div>

            {todayBookings.length === 0 ? (
              <div
                role="status"
                className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm"
              >
                No bookings scheduled for today
              </div>
            ) : (
              <ul className="divide-y">
                {todayBookings.map((booking) => (
                  <li key={booking._id}>
                    <div
                      className="flex cursor-pointer gap-3 py-4 first:pt-0"
                      onClick={() => navigate(`/bookings/${booking._id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/bookings/${booking._id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <Avatar className="h-10 w-10 bg-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Clock className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{booking.serviceName}</span>
                          <Badge variant={statusBadgeVariant(booking.status)} className="capitalize">
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.customerName} · {booking.customerPhone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.scheduledTime} · {booking.address.area}, {booking.address.city}
                        </p>
                        <p className="text-sm font-semibold text-green-600">₹{booking.totalAmount}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`tel:${booking.customerPhone}`)
                          }}
                          aria-label="Call customer"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            const query = `${booking.address.area}, ${booking.address.city}`
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
                          }}
                          aria-label="Open in maps"
                        >
                          <Navigation className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-none lg:col-span-4">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
            <ul className="space-y-0 divide-y">
              <li className="flex gap-3 py-3 first:pt-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/15">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Booking Completed</p>
                  <p className="text-xs text-muted-foreground">AC Repair - John Doe</p>
                </div>
              </li>
              <li className="flex gap-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                  <CircleAlert className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">New Booking Assigned</p>
                  <p className="text-xs text-muted-foreground">Plumbing - Jane Smith</p>
                </div>
              </li>
              <li className="flex gap-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/15">
                  <Star className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">New Review</p>
                  <p className="text-xs text-muted-foreground">5 stars from Sarah</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none lg:col-span-12">
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Earnings Overview</h2>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/professional/earnings">View Details</Link>
              </Button>
            </div>
            <div className="h-[300px]">
              <Line data={earningsChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}
    </div>
  )
}
