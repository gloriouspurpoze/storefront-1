import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  Badge,
  Avatar,
  AvatarFallback,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Separator,
} from '../../components/ui'
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Star,
  Wrench,
  ClipboardList,
  IndianRupee,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Bell,
  Loader2,
} from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
import { useNavigate } from 'react-router-dom'
import { BookingsService } from '../../services/api/bookings.service'
import type { Booking } from '../../types'
import { cn } from '../../lib/utils'

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? ''
  const map: Record<string, { label: string; className: string; Icon: typeof Clock }> = {
    pending: { label: status, className: 'border-bloom-coral/40 bg-bloom-rose text-bloom-coral', Icon: Clock },
    accepted: { label: status, className: 'border-primary/20 bg-primary-soft text-primary', Icon: ClipboardList },
    'in-progress': { label: status, className: 'border-primary/20 bg-primary-soft text-primary-deep', Icon: Wrench },
    completed: { label: status, className: 'border-storm-mist/30 bg-storm-mist/30 text-storm-deep', Icon: CheckCircle2 },
    cancelled: { label: status, className: 'border-destructive/20 bg-destructive/10 text-destructive', Icon: XCircle },
  }
  const cfg = map[s] ?? {
    label: status,
    className: 'border-muted bg-muted/50 text-foreground',
    Icon: ClipboardList,
  }
  const Icon = cfg.Icon
  return (
    <Badge variant="outline" className={cn('gap-1 capitalize', cfg.className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  )
}

export function ProviderDashboard() {
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    responseRate: 0,
  })

  const [recentBookings, setRecentBookings] = useState<Booking[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const statsRes = await BookingsService.getProviderBookingStats()
      if (statsRes.success && statsRes.data) {
        const s: any = statsRes.data
        setStats({
          totalBookings: s.totalBookings || 0,
          completedBookings: s.completedBookings || 0,
          pendingBookings: s.pendingBookings || 0,
          cancelledBookings: s.cancelledBookings || 0,
          totalEarnings: s.totalEarnings || 0,
          averageRating: s.averageRating || 0,
          totalReviews: s.totalReviews || 0,
          responseRate: s.responseRate || 0,
        })
      }

      const bookingsRes = await BookingsService.getProviderBookings({
        limit: 3,
        page: 1,
      })
      if (bookingsRes.success && bookingsRes.data) {
        setRecentBookings(bookingsRes.data.bookings || [])
      } else {
        setRecentBookings([])
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const completionPct =
    stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back, {user?.firstName || 'Provider'}!
          </h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening with your services today</p>
        </div>
        <Button className="rounded-lg" onClick={() => navigate('/provider/profile')}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <div className="flex items-start justify-between gap-2">
            <span>{error}</span>
            <button type="button" className="text-destructive underline" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {stats.pendingBookings > 0 && (
            <div
              className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary dark:border-primary dark:bg-primary/50 dark:text-primary-deep"
              role="status"
            >
              <Bell className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                You have{' '}
                <strong>
                  {stats.pendingBookings} pending booking{stats.pendingBookings > 1 ? 's' : ''}
                </strong>{' '}
                waiting for your response!
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Total Bookings',
                value: stats.totalBookings,
                sub: '+12%',
                icon: ClipboardList,
                iconBg: 'bg-primary/15 text-primary',
                chip: 'default' as const,
              },
              {
                title: 'Completed Jobs',
                value: stats.completedBookings,
                sub: '+8%',
                icon: CheckCircle2,
                iconBg: 'bg-storm-deep/15 text-storm-deep dark:text-storm-sea',
                chip: 'success' as const,
              },
              {
                title: 'Total Earnings',
                value: `$${stats?.totalEarnings?.toLocaleString()}`,
                sub: '+15%',
                icon: IndianRupee,
                iconBg: 'bg-bloom-coral/15 text-bloom-coral dark:text-bloom-coral',
                chip: 'success' as const,
              },
              {
                title: 'Average Rating',
                value: stats.averageRating.toFixed(1),
                sub: `${stats.totalReviews} reviews`,
                icon: Star,
                iconBg: 'bg-primary/15 text-primary dark:text-primary',
                chip: 'reviews' as const,
              },
            ].map((card) => (
              <Card key={card.title} className="h-full rounded-xl">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className={cn('flex h-12 w-12 items-center justify-center rounded-lg', card.iconBg)}
                    >
                      <card.icon className="h-6 w-6" />
                    </div>
                    {card.chip === 'reviews' ? (
                      <Badge variant="secondary" className="text-xs">
                        {card.sub}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-storm-mist/30 text-storm-deep dark:bg-storm-deep/40 dark:text-on-ink">
                        {card.sub}
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="rounded-xl lg:col-span-2">
              <CardContent className="pt-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">Recent Bookings</h2>
                  <Button variant="outline" size="sm" className="rounded-md" onClick={() => navigate('/provider/bookings')}>
                    View All
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {booking.customerName?.charAt(0) || 'C'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{booking.customerName || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate">
                            {booking.serviceName || booking.serviceRequest?.title || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{booking.scheduledDate || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{booking.scheduledTime || ''}</div>
                          </TableCell>
                          <TableCell className="font-semibold tabular-nums">
                            ${booking.totalAmount ?? booking.estimatedCost ?? 0}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={booking.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => navigate('/provider/bookings')}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {recentBookings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                            No recent bookings
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="rounded-xl">
                <CardContent className="pt-6">
                  <h2 className="mb-4 text-lg font-semibold">Provider Information</h2>
                  <div className="mb-4 flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                        {user?.firstName?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">Service Provider</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Service Area: City Area</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardContent className="pt-6">
                  <h2 className="mb-4 text-lg font-semibold">Performance Metrics</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Rate</span>
                        <span className="font-medium">{stats.responseRate}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, stats.responseRate)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span className="font-medium">{completionPct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-storm-deep transition-all"
                          style={{ width: `${Math.min(100, completionPct)}%` }}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="py-2 text-center">
                      <p className="text-3xl font-bold text-primary">{stats.averageRating}</p>
                      <div className="mt-1 flex justify-center gap-0.5">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              'h-5 w-5',
                              index < Math.floor(stats.averageRating)
                                ? 'fill-bloom-coral text-bloom-coral'
                                : 'text-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">Based on {stats.totalReviews} reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-primary bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      className="w-full bg-background text-foreground hover:bg-background/90"
                      onClick={() => navigate('/provider/bookings')}
                    >
                      View All Bookings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                      onClick={() => navigate('/provider/profile')}
                    >
                      Update Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
