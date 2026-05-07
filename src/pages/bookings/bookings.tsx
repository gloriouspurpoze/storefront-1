import React, { useMemo, useState, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Search,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Clock,
  RefreshCw,
  UserCog,
  RefreshCcw,
  Trash2,
  Globe,
  Smartphone,
  MoreVertical,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { FixedMessage } from '../../components/common/FixedMessage'
import { Pagination } from '../../components/common/Pagination'
import { cn } from '../../lib/utils'
import { Booking, BookingsQuery } from '../../types'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'
import { BookingsService, ProvidersService } from '../../services/api'
import { AssignProviderModal } from '../../components/bookings/AssignProviderModal'
import { AssignProfessionalDialog } from '../../components/bookings/AssignProfessionalDialog'
import { UpdateBookingStatusModal } from '../../components/bookings/UpdateBookingStatusModal'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'

const statusConfig: Record<
  string,
  { color: string; bg: string; icon: LucideIcon; label: string; gradient: string }
> = {
  pending: {
    color: '#FF9800',
    bg: '#FFF3E0',
    icon: CalendarClock,
    label: 'Pending',
    gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
  },
  confirmed: {
    color: '#2196F3',
    bg: '#E3F2FD',
    icon: CheckCircle2,
    label: 'Confirmed',
    gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
  },
  in_progress: {
    color: '#9C27B0',
    bg: '#F3E5F5',
    icon: Clock,
    label: 'In Progress',
    gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
  },
  completed: {
    color: '#4CAF50',
    bg: '#E8F5E9',
    icon: CheckCircle2,
    label: 'Completed',
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
  },
  cancelled: {
    color: '#F44336',
    bg: '#FFEBEE',
    icon: XCircle,
    label: 'Cancelled',
    gradient: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
  },
  scheduled: {
    color: '#00ACC1',
    bg: '#E0F7FA',
    icon: Calendar,
    label: 'Scheduled',
    gradient: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
  },
  accepted: {
    color: '#1565C0',
    bg: '#E3F2FD',
    icon: CheckCircle2,
    label: 'Accepted',
    gradient: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
  },
}

const statusTabs: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function Bookings() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const professionalIdFromUrl = searchParams.get('professionalId') || undefined
  const confirm = useAppConfirm()

  // State management
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSource, setSelectedSource] = useState<'all' | 'web' | 'mobile_app'>('all')
  const [page, setPage] = useState(1) // 1-based (API)
  const [pageSize, setPageSize] = useState(20)
  const [totalRows, setTotalRows] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    if (!snackbar.open) return undefined
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 6000)
    return () => window.clearTimeout(t)
  }, [snackbar.open, snackbar.message])

  // Modal states
  const [assignProviderModal, setAssignProviderModal] = useState<{
    open: boolean
    bookingId: string | null
  }>({ open: false, bookingId: null })

  const [updateStatusModal, setUpdateStatusModal] = useState<{
    open: boolean
    bookingId: string | null
    currentStatus: string | null
  }>({ open: false, bookingId: null, currentStatus: null })

  const [assignProfessionalModal, setAssignProfessionalModal] = useState<{
    open: boolean
    bookingId: string | null
    scheduledDateIso?: string | null
  }>({ open: false, bookingId: null })

  const [availableProviders, setAvailableProviders] = useState<any[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)

  const [statsLoading, setStatsLoading] = useState(false)
  const [bookingStats, setBookingStats] = useState<{
    total: number
    byStatus: Record<string, number>
    totalRevenue: number
  } | null>(null)

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      const query: BookingsQuery = {
        page,
        limit: pageSize,
      }

      if (selectedStatus !== 'all') {
        query.status = selectedStatus
      }
      if (selectedSource !== 'all') {
        query.source = selectedSource
      }

      if (professionalIdFromUrl) {
        query.professionalId = professionalIdFromUrl
      }

      const response = await BookingsService.getBookings(query)
      
      if (response.success && response.data) {
        setBookings(response.data.bookings || [])
        if (response.data.pagination) {
          setTotalRows(response.data.pagination.total || 0)
        }
      } else {
        throw new Error(response.message || 'Failed to fetch bookings')
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err)
      setError(err.message || 'Failed to load bookings')
      setBookings([])
      setTotalRows(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [page, pageSize, selectedStatus, selectedSource, professionalIdFromUrl])

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true)
        const response = await BookingsService.getBookingStats()
        const raw = (response as any)?.data
        if (response.success && raw) {
          // Support both flat (data.total) and nested (data.stats.total) or snake_case (data.total_bookings)
          const stats = raw.stats ?? raw
          const total =
            stats.total ??
            raw.total ??
            (raw as any).total_bookings ??
            0
          const byStatus =
            stats.byStatus ??
            stats.by_status ??
            raw.byStatus ??
            raw.by_status ??
            {}
          const totalRevenue =
            stats.totalRevenue ??
            stats.total_revenue ??
            raw.totalRevenue ??
            raw.total_revenue ??
            0
          setBookingStats({
            total: Number(total),
            byStatus: typeof byStatus === 'object' && byStatus !== null ? byStatus : {},
            totalRevenue: Number(totalRevenue),
          })
        }
      } catch {
        // Non-blocking; keep stats section functional using fallback values.
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [])

  // Filter bookings locally by search term
  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        if (!searchTerm) return true
        const searchLower = searchTerm.toLowerCase()
        return (
          booking.notes?.toLowerCase().includes(searchLower) ||
          booking.serviceRequest?.title?.toLowerCase().includes(searchLower) ||
          booking.id.toString().includes(searchLower) ||
          booking.bookingNumber?.toLowerCase().includes(searchLower) ||
          booking.customerName?.toLowerCase().includes(searchLower) ||
          booking.customerPhone?.toLowerCase().includes(searchLower) ||
          booking.serviceName?.toLowerCase().includes(searchLower)
        )
      }),
    [bookings, searchTerm]
  )

  const resolvedStats = useMemo(() => {
    const fromList = {
      total: totalRows > 0 ? totalRows : bookings.length,
      pending: bookings.filter((b) => (b.status ?? (b as any).status) === 'pending').length,
      confirmed: bookings.filter((b) => (b.status ?? (b as any).status) === 'confirmed').length,
      scheduled: bookings.filter((b) => (b.status ?? (b as any).status) === 'scheduled').length,
      accepted: bookings.filter((b) => (b.status ?? (b as any).status) === 'accepted').length,
      in_progress: bookings.filter((b) => (b.status ?? (b as any).status) === 'in_progress').length,
      completed: bookings.filter((b) => (b.status ?? (b as any).status) === 'completed').length,
      cancelled: bookings.filter((b) => (b.status ?? (b as any).status) === 'cancelled').length,
      revenue: bookings
        .filter((b) => (b.status ?? (b as any).status) === 'completed')
        .reduce((sum, b) => sum + (Number(b.totalAmount) || Number((b as any).total_amount) || 0), 0),
    }

    // Use server stats only when they have at least a non-zero total; otherwise fall back to list-derived stats
    if (bookingStats && bookingStats.total > 0) {
      return {
        total: bookingStats.total,
        pending: bookingStats.byStatus?.pending ?? 0,
        confirmed: bookingStats.byStatus?.confirmed ?? 0,
        scheduled: bookingStats.byStatus?.scheduled ?? 0,
        accepted: bookingStats.byStatus?.accepted ?? 0,
        in_progress: bookingStats.byStatus?.in_progress ?? 0,
        completed: bookingStats.byStatus?.completed ?? 0,
        cancelled: bookingStats.byStatus?.cancelled ?? 0,
        revenue: bookingStats.totalRevenue ?? 0,
      }
    }

    // When stats API returned 0 or failed: show totals from list/pagination so cards match the table
    return {
      total: fromList.total,
      pending: totalRows > 0 ? fromList.pending : fromList.pending,
      confirmed: fromList.confirmed,
      scheduled: fromList.scheduled,
      accepted: fromList.accepted,
      in_progress: fromList.in_progress,
      completed: fromList.completed,
      cancelled: fromList.cancelled,
      revenue: fromList.revenue,
    }
  }, [bookingStats, bookings, totalRows])

  const handleRefresh = () => {
    fetchBookings()
  }

  const handleViewBooking = (booking: Booking) => {
    navigate(`/bookings/${booking.id}`)
  }

  const handleCancelBooking = async (bookingId: string) => {
    const ok = await confirm({
      title: 'Cancel booking?',
      message: 'Are you sure you want to cancel this booking?',
      danger: true,
      confirmLabel: 'Cancel booking',
    })
    if (!ok) return

    try {
      setLoading(true)
      await BookingsService.cancelBooking(bookingId, 'Cancelled by admin')
      setSnackbar({ open: true, message: 'Booking cancelled successfully', severity: 'success' })
      fetchBookings()
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to cancel booking', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    setPage(1)
  }

  const fetchAvailableProviders = async () => {
    try {
      setLoadingProviders(true)
      const response = await ProvidersService.getAvailableProviders({
        limit: 50
      })
      
      if (response.success && response.data) {
        const providers = response.data.providers?.map((provider: any) => ({
          id: provider.id || provider._id,
          businessName: provider.businessName,
          email: provider.businessEmail || provider.email,
          phone: provider.businessPhone || provider.phone,
          rating: provider.averageRating || provider.rating,
          totalJobs: provider.totalJobs || provider.completedJobs || 0,
          verificationStatus: provider.verificationStatus,
          avatar: provider.logo,
        })) || []
        
        setAvailableProviders(providers)
      }
    } catch (err: any) {
      console.error('Error fetching providers:', err)
      setAvailableProviders([])
    } finally {
      setLoadingProviders(false)
    }
  }

  const handleOpenAssignProvider = async (bookingId: string) => {
    setAssignProviderModal({ open: true, bookingId })

    if (availableProviders.length === 0) {
      await fetchAvailableProviders()
    }
  }

  const handleAssignProvider = async (
    providerId: string,
    options: { notifyProvider: boolean; notifyCustomer: boolean }
  ) => {
    if (!assignProviderModal.bookingId) return

    try {
      await BookingsService.assignProvider(
        assignProviderModal.bookingId,
        providerId,
        options
      )
      
      setSnackbar({ 
        open: true, 
        message: 'Provider assigned successfully!', 
        severity: 'success' 
      })
      setAssignProviderModal({ open: false, bookingId: null })
      fetchBookings()
    } catch (err: any) {
      setSnackbar({ 
        open: true, 
        message: err.message || 'Failed to assign provider', 
        severity: 'error' 
      })
    }
  }

  const handleOpenUpdateStatus = (bookingId: string, currentStatus: string) => {
    setUpdateStatusModal({ open: true, bookingId, currentStatus })
  }

  const handleUpdateStatus = async (
    status: string,
    options: {
      notes?: string
      notifyCustomer: boolean
      notifyProvider: boolean
    }
  ) => {
    if (!updateStatusModal.bookingId) return

    try {
      await BookingsService.adminUpdateBookingStatus(
        updateStatusModal.bookingId,
        status,
        options
      )
      
      setSnackbar({ 
        open: true, 
        message: 'Booking status updated successfully!', 
        severity: 'success' 
      })
      setUpdateStatusModal({ open: false, bookingId: null, currentStatus: null })
      fetchBookings()
    } catch (err: any) {
      setSnackbar({ 
        open: true, 
        message: err.message || 'Failed to update status', 
        severity: 'error' 
      })
    }
  }

  const getBookingRowId = (row: Booking) =>
    String(row.id ?? (row as any)._id ?? `${(row as any).serviceRequestId}-${row.scheduledDate}`)

  const totalPages = Math.max(1, Math.ceil((totalRows || 0) / pageSize))

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Bookings Management</h1>
        <p className="text-sm text-muted-foreground md:text-base">Manage and track all service bookings</p>
      </div>

      {professionalIdFromUrl ? (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Filtered by professional.</span>{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to={`/professionals/${professionalIdFromUrl}`}>
            Open command center
          </Link>
          {' · '}
          <Link className="text-muted-foreground underline-offset-4 hover:underline" to="/bookings">
            Clear filter
          </Link>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Total Bookings',
            value: resolvedStats.total,
            icon: UserCog,
            color: '#2196F3',
            gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            onStatus: 'all' as const,
          },
          {
            title: 'Pending',
            value: resolvedStats.pending,
            icon: CalendarClock,
            color: '#FF9800',
            gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            onStatus: 'pending' as const,
          },
          {
            title: 'In Progress',
            value: resolvedStats.in_progress,
            icon: Clock,
            color: '#9C27B0',
            gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
            onStatus: 'in_progress' as const,
          },
          {
            title: 'Completed',
            value: resolvedStats.completed,
            icon: CheckCircle2,
            color: '#4CAF50',
            gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
            onStatus: 'completed' as const,
          },
        ].map((s) => {
          const Ic = s.icon
          return (
            <Card
              key={s.title}
              className="relative cursor-pointer overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => handleStatusChange(s.onStatus)}
            >
              <div
                className="absolute right-0 top-0 h-28 w-28 translate-x-4 -translate-y-4 rounded-full opacity-[0.12]"
                style={{ background: s.gradient }}
              />
              <CardContent className="relative flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground md:text-sm">{s.title}</p>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>
                    {s.value}
                  </p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ color: s.color, backgroundColor: `${s.color}18` }}
                >
                  <Ic className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
            <div className="relative min-w-0 lg:col-span-4">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search booking #, customer, service, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <Label className="text-xs">Source</Label>
              <Select
                value={selectedSource}
                onValueChange={(v) => {
                  setSelectedSource(v as 'all' | 'web' | 'mobile_app')
                  setPage(1)
                }}
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="web">Website</SelectItem>
                  <SelectItem value="mobile_app">Mobile app</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 lg:col-span-6">
              <Tabs value={selectedStatus} onValueChange={handleStatusChange} className="w-full">
                <TabsList className="h-auto w-full flex-wrap justify-start p-1">
                  {statusTabs.map((t) => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="px-2 py-1.5 text-xs font-bold sm:text-sm"
                    >
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {statsLoading && <p className="mt-1 text-xs text-muted-foreground">Updating stats…</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && !loading && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="relative min-h-[400px] w-full overflow-x-auto p-0">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <div className="border-b p-2 sm:flex sm:items-center sm:justify-between">
              <p className="px-1 text-sm font-semibold text-muted-foreground">
                {totalRows ? `${totalRows.toLocaleString()} bookings` : 'Bookings'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto mt-2 gap-1.5 sm:mt-0"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/[0.06]">
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Assign Professional</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-sm text-muted-foreground">
                      {searchTerm || selectedStatus !== 'all' || selectedSource !== 'all'
                        ? 'No bookings match your current filters.'
                        : 'No bookings yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((row) => {
                    const name =
                      row.customerName ||
                      (row.customer
                        ? `${row.customer.firstName || ''} ${row.customer.lastName || ''}`.trim()
                        : '') ||
                      'N/A'
                    const phone = row.customerPhone || row.customer?.phone || ''
                    const title =
                      row.serviceRequest?.title ||
                      row.serviceName ||
                      row.services?.[0]?.serviceName ||
                      'N/A'
                    const city = row.serviceRequest?.location?.city || row.city || row.address?.city || ''
                    const state = row.serviceRequest?.location?.state || ''
                    const professional = (row as any).professional
                    const hasProfessionalId =
                      !!(row as any).professionalId ||
                      (row as any).professional_id ||
                      professional?.id ||
                      professional?._id
                    const provider = row.provider || (row as any).assignedProfessional
                    let proName =
                      (professional
                        ? [professional.firstName, professional.lastName].filter(Boolean).join(' ').trim()
                        : '') ||
                      provider?.businessName ||
                      (provider?.user
                        ? `${(provider.user as any).firstName || ''} ${(provider.user as any).lastName || ''}`.trim()
                        : '') ||
                      ''
                    if (!proName && hasProfessionalId) proName = 'Professional'
                    const isCompletedOrCancelled = row.status === 'completed' || row.status === 'cancelled'
                    const ps = (row.paymentStatus || 'pending').toString().toLowerCase()
                    const isPaid = ['paid', 'completed', 'success', 'received', 'customer_paid', 'verified'].includes(ps)
                    const st = row.status
                    const cfg = (statusConfig as any)[st] || statusConfig.pending
                    const StatusIc = cfg.icon
                    const src = (row as any).source || row.source
                    const isWeb = src === 'web'

                    return (
                      <TableRow
                        key={getBookingRowId(row)}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => navigate(`/bookings/${row.id}`)}
                      >
                        <TableCell className="align-top">
                          <p className="text-sm font-extrabold">
                            {row.bookingNumber || `#${row.id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex min-w-0 max-w-[200px] items-center gap-2">
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                              style={{ background: 'rgb(102 126 234 / 0.15)', color: '#3f51b5' }}
                            >
                              {getInitials(name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">{name}</p>
                              <p className="truncate text-xs text-muted-foreground">{phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="max-w-[220px]">
                            <p className="truncate text-sm font-bold">{title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {city}
                              {city && state ? ', ' : ''}
                              {state}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-bold">{formatDate(row.scheduledDate)}</p>
                              <p className="text-xs text-muted-foreground">{row.scheduledTime || 'TBD'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-600 align-top">
                          {formatCurrency(row.totalAmount || 0)}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs capitalize',
                              isPaid
                                ? 'border-emerald-200 bg-emerald-500/10 text-emerald-800'
                                : 'border-amber-200 bg-amber-500/10 text-amber-800',
                            )}
                          >
                            {(row.paymentStatus || '—').toString().replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <div
                            className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-extrabold"
                            style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: 'transparent' }}
                          >
                            <StatusIc className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
                            {cfg.label}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {src ? (
                            <div className="inline-flex items-center gap-1 text-xs">
                              {isWeb ? <Globe className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                              {isWeb ? 'Website' : 'Mobile app'}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-wrap items-center gap-1">
                            {proName ? (
                              <span className="max-w-[100px] truncate text-xs sm:text-sm">{proName}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unassigned</span>
                            )}
                            {!isCompletedOrCancelled && (
                              <Button
                                type="button"
                                size="sm"
                                variant={proName ? 'outline' : 'default'}
                                className="h-7 min-w-[72px] px-2 text-xs"
                                onClick={() => {
                                  const raw = row.scheduledDate ?? (row as { scheduled_date?: string }).scheduled_date
                                  let scheduledDateIso: string | null = null
                                  if (raw) {
                                    const d = new Date(raw as string)
                                    if (!Number.isNaN(d.getTime())) scheduledDateIso = d.toISOString()
                                  }
                                  setAssignProfessionalModal({
                                    open: true,
                                    bookingId: String(row.id),
                                    scheduledDateIso,
                                  })
                                }}
                              >
                                {proName ? 'Change' : 'Assign'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className="w-24 align-top text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end gap-0.5">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="View"
                              onClick={() => navigate(`/bookings/${row.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  title="More"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewBooking(row)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={row.status === 'completed' || row.status === 'cancelled'}
                                  onClick={() => handleOpenAssignProvider(String(row.id))}
                                >
                                  <UserCog className="mr-2 h-4 w-4" />
                                  Assign provider
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenUpdateStatus(String(row.id), String(row.status))}
                                >
                                  <RefreshCcw className="mr-2 h-4 w-4" />
                                  Update status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  disabled={row.status === 'completed' || row.status === 'cancelled'}
                                  onClick={() => handleCancelBooking(String(row.id))}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Cancel booking
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            {totalRows > 0 && (
              <div className="mt-0 border-t p-0">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalRows}
                  itemsPerPage={pageSize}
                  onPageChange={setPage}
                  onItemsPerPageChange={(n) => {
                    setPageSize(n)
                    setPage(1)
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="border-t bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {searchTerm || selectedStatus !== 'all' || selectedSource !== 'all'
              ? 'Try adjusting your search, status, or source filter.'
              : 'Bookings will appear here when customers schedule services.'}
          </div>
        )}
      </Card>

      {snackbar.open && (
        <FixedMessage variant={snackbar.severity === 'error' ? 'error' : 'default'}>
          {snackbar.message}
        </FixedMessage>
      )}
      {/* Modals */}
      {assignProviderModal.open && assignProviderModal.bookingId && (
        <AssignProviderModal
          open={assignProviderModal.open}
          onClose={() => setAssignProviderModal({ open: false, bookingId: null })}
          bookingId={assignProviderModal.bookingId}
          onAssign={handleAssignProvider}
          availableProviders={availableProviders}
        />
      )}

      {updateStatusModal.open && updateStatusModal.bookingId && updateStatusModal.currentStatus && (
        <UpdateBookingStatusModal
          open={updateStatusModal.open}
          onClose={() => setUpdateStatusModal({ open: false, bookingId: null, currentStatus: null })}
          bookingId={updateStatusModal.bookingId}
          currentStatus={updateStatusModal.currentStatus as any}
          onUpdate={handleUpdateStatus}
        />
      )}

      {assignProfessionalModal.open && assignProfessionalModal.bookingId && (
        <AssignProfessionalDialog
          open={assignProfessionalModal.open}
          onClose={() => setAssignProfessionalModal({ open: false, bookingId: null })}
          bookingId={assignProfessionalModal.bookingId}
          scheduledDateIso={assignProfessionalModal.scheduledDateIso ?? undefined}
          onAssigned={() => {
            setAssignProfessionalModal({ open: false, bookingId: null })
            fetchBookings()
          }}
        />
      )}
    </div>
  )
}
