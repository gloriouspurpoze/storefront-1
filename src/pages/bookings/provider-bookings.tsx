import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  IndianRupee,
  User,
  Phone,
  Play,
} from 'lucide-react'
import { BookingsService } from '../../services/api/bookings.service'
import type { Booking } from '../../types'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const tabs = [
  { label: 'All Bookings', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

function statusBadgeClass(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
    case 'accepted':
      return 'bg-sky-500/15 text-sky-800 dark:text-sky-200'
    case 'in_progress':
      return 'bg-primary/15 text-primary'
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
    case 'cancelled':
      return 'bg-destructive/15 text-destructive'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function ProviderBookings() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTab, setCurrentTab] = useState(0)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchBookings()
  }, [currentTab, searchQuery])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      const status = tabs[currentTab].value
      const query: Record<string, unknown> = {
        page: pagination.page,
        limit: pagination.limit,
      }

      if (status !== 'all') {
        query.status = status
      }

      if (searchQuery) {
        query.search = searchQuery
      }

      const response = await BookingsService.getProviderBookings(query)
      if (response.success && response.data) {
        setBookings(response.data.bookings || [])
        if (response.data.pagination) {
          setPagination(response.data.pagination)
        }
      } else {
        setBookings([])
      }
    } catch (err: unknown) {
      console.error('Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    const cls = 'h-3.5 w-3.5'
    switch (status) {
      case 'pending':
        return <Calendar className={cls} />
      case 'accepted':
      case 'completed':
        return <CheckCircle className={cls} />
      case 'cancelled':
        return <XCircle className={cls} />
      default:
        return <Play className={cls} />
    }
  }

  const filteredBookings = bookings

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setDetailsOpen(true)
  }

  const handleAcceptBooking = async (b: Booking) => {
    try {
      await BookingsService.updateBookingStatus(b.id, { status: 'accepted' })
      await fetchBookings()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to accept booking')
    }
  }

  const handleStartJob = async (b: Booking) => {
    try {
      await BookingsService.updateBookingStatus(b.id, { status: 'in_progress' })
      await fetchBookings()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start job')
    }
  }

  const handleCompleteJob = async (b: Booking) => {
    try {
      await BookingsService.completeBooking(b.id)
      await fetchBookings()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete job')
    }
  }

  const handleCancelBooking = async (b: Booking) => {
    try {
      await BookingsService.cancelBooking(b.id, 'Cancelled by provider')
      await fetchBookings()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">Manage your assigned service bookings</p>
      </div>

      {error && (
        <div
          className="mb-4 flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
          <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" className="gap-1" size="sm">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <div className="border-b">
          <div className="flex flex-wrap gap-1 overflow-x-auto p-1">
            {tabs.map((tab, index) => (
              <Button
                key={tab.value}
                type="button"
                variant={currentTab === index ? 'default' : 'ghost'}
                size="sm"
                className="shrink-0"
                onClick={() => setCurrentTab(index)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {(booking as any).booking_number ||
                          booking.bookingNumber ||
                          `BK-${String(booking.id).slice(0, 8)}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {((booking as any).customer_name?.charAt(0) ||
                                booking.customerName?.charAt(0) ||
                                'C') as string}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {(booking as any).customer_name || booking.customerName || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(booking as any).customer_phone ||
                                booking.customerPhone ||
                                booking.customer?.phone ||
                                ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {(booking as any).service_name ||
                            booking.serviceName ||
                            (booking as any).service_request?.service_name ||
                            (booking as any).serviceRequest?.title ||
                            'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">{booking.category || ''}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{(booking as any).scheduled_date || booking.scheduledDate || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          {(booking as any).scheduled_time || booking.scheduledTime || ''}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[150px] truncate text-sm">
                          {(booking as any).service_address || (booking as any).address || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">{booking.city || ''}</p>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${(booking as any).total_amount ?? booking.totalAmount ?? (booking as any).estimated_cost ?? booking.estimatedCost ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn('inline-flex max-w-full items-center gap-1 capitalize', statusBadgeClass(booking.status))}
                        >
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={() => handleViewDetails(booking)}>View Details</DropdownMenuItem>
                            {booking.status === 'pending' && (
                              <DropdownMenuItem onSelect={() => void handleAcceptBooking(booking)}>
                                Accept Booking
                              </DropdownMenuItem>
                            )}
                            {booking.status === 'accepted' && (
                              <DropdownMenuItem onSelect={() => void handleStartJob(booking)}>Start Job</DropdownMenuItem>
                            )}
                            {booking.status === 'in_progress' && (
                              <DropdownMenuItem onSelect={() => void handleCompleteJob(booking)}>
                                Complete Job
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => void handleCancelBooking(booking)}
                            >
                              Cancel Booking
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={detailsOpen}
        onOpenChange={(o) => {
          if (!o) setDetailsOpen(false)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-4 py-1">
              <div className="rounded-lg bg-primary p-3 text-primary-foreground">
                <p className="text-xl font-bold">
                  {(selectedBooking as any).booking_number ||
                    selectedBooking.bookingNumber ||
                    `BK-${String(selectedBooking.id).slice(0, 8)}`}
                </p>
                <Badge className="mt-1 border-white/30 bg-white/10 capitalize text-primary-foreground">
                  {selectedBooking.status}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Customer</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {(selectedBooking as any).customer_name || selectedBooking.customerName || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {(selectedBooking as any).customer_phone ||
                        selectedBooking.customerPhone ||
                        selectedBooking.customer?.phone ||
                        'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {(selectedBooking as any).service_address || (selectedBooking as any).address || 'N/A'}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Service</h4>
                  <p className="text-sm font-semibold">
                    {(selectedBooking as any).service_name ||
                      selectedBooking.serviceName ||
                      (selectedBooking as any).service_request?.service_name ||
                      (selectedBooking as any).serviceRequest?.title ||
                      'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedBooking.category || ''}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {(selectedBooking as any).scheduled_date || selectedBooking.scheduledDate} at{' '}
                    {(selectedBooking as any).scheduled_time || selectedBooking.scheduledTime}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      ${(selectedBooking as any).total_amount ??
                        selectedBooking.totalAmount ??
                        (selectedBooking as any).estimated_cost ??
                        selectedBooking.estimatedCost ??
                        0}
                    </span>
                  </div>
                </div>
              </div>
              {selectedBooking.notes && (
                <div>
                  <h4 className="mb-1 text-sm font-medium text-muted-foreground">Notes</h4>
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">{selectedBooking.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedBooking?.status === 'pending' && (
              <Button
                type="button"
                onClick={() => {
                  setDetailsOpen(false)
                  void handleAcceptBooking(selectedBooking)
                }}
              >
                Accept Booking
              </Button>
            )}
            {selectedBooking?.status === 'accepted' && (
              <Button
                type="button"
                onClick={() => {
                  setDetailsOpen(false)
                  void handleStartJob(selectedBooking)
                }}
              >
                Start Job
              </Button>
            )}
            {selectedBooking?.status === 'in_progress' && (
              <Button
                type="button"
                onClick={() => {
                  setDetailsOpen(false)
                  void handleCompleteJob(selectedBooking)
                }}
              >
                Complete Job
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
