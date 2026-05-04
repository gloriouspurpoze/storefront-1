/**
 * Admin command center for a single professional: overview, bookings, earnings estimate,
 * reviews, documents, service coverage, and moderation (suspend / block / reinstate).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { BookingsService } from '../../services/api/bookings.service'
import { PaymentsService } from '../../services/api/payments.service'
import { ReviewsService } from '../../services/api/reviews.service'
import { usersService } from '../../services/api/users.service'
import type { Professional } from '../../types/professional.types'
import type { Booking, Payment } from '../../types'
import { buildActivityTimelineFromBookings } from '../../lib/professionalActivity'
import { usePermissions } from '../../hooks/usePermissions'
import {
  extractProfessionalFromGetResponse,
  normalizeProfessionalFromApi,
  professionalDisplayAccountStatus,
} from '../../lib/professionalAdmin'
import { formatCurrency, formatDate } from '../../lib/utils'
import { getProfessionalCategoryLabel } from '../../constants/professionalCategories'

type TabKey = 'overview' | 'bookings' | 'activity' | 'earnings' | 'reviews' | 'documents' | 'coverage' | 'moderation'

function daysUntilExpiry(iso?: string): number | null {
  if (!iso?.trim()) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

function bookingRowId(b: Booking): string {
  return String(b.id || (b as { _id?: string })._id || '')
}

function cancellationText(b: Booking): string {
  const r = b.cancellationReason ?? b.cancellation_reason
  return (r && String(r).trim()) || '—'
}

export function ProfessionalAdminHub() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { checkPermission } = usePermissions()
  const canModerate = checkPermission('edit_providers')

  const [tab, setTab] = useState<TabKey>('overview')
  const [loadingPro, setLoadingPro] = useState(true)
  const [proError, setProError] = useState<string | null>(null)
  const [professional, setProfessional] = useState<Professional | null>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [bookingPage, setBookingPage] = useState(1)
  const [bookingTotal, setBookingTotal] = useState(0)
  const bookingLimit = 25

  const [reviews, setReviews] = useState<
    Awaited<ReturnType<typeof ReviewsService.getBookingReviews>>['reviews']
  >([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const [suspendOpen, setSuspendOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendUntil, setSuspendUntil] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [modBusy, setModBusy] = useState(false)
  const [reinstateOpen, setReinstateOpen] = useState(false)

  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [bookingsLoadMeta, setBookingsLoadMeta] = useState<{
    strategy: string
    warning?: string
  } | null>(null)

  const [apiActivityEvents, setApiActivityEvents] = useState<
    Array<{ id: string; occurredAt: string; kind: string; title: string; description?: string; bookingId?: string }>
  >([])
  const [activityLoading, setActivityLoading] = useState(false)

  const [earningsPayments, setEarningsPayments] = useState<Payment[]>([])
  const [earningsLoading, setEarningsLoading] = useState(false)
  const [earningsHint, setEarningsHint] = useState<string | null>(null)

  const loadProfessional = useCallback(async () => {
    if (!id) {
      setProError('Missing professional id')
      setLoadingPro(false)
      return
    }
    setLoadingPro(true)
    setProError(null)
    try {
      const res = await ProfessionalsService.getProfessional(id)
      const inner = extractProfessionalFromGetResponse(res.data as unknown)
      if (!inner) {
        setProError('Professional not found')
        setProfessional(null)
        return
      }
      setProfessional(normalizeProfessionalFromApi(inner))
    } catch (e) {
      setProError(e instanceof Error ? e.message : 'Failed to load professional')
      setProfessional(null)
    } finally {
      setLoadingPro(false)
    }
  }, [id])

  useEffect(() => {
    void loadProfessional()
  }, [loadProfessional])

  const loadBookings = useCallback(async () => {
    if (!id || !professional) return
    setBookingsLoading(true)
    setBookingsError(null)
    try {
      const query: Parameters<typeof BookingsService.getBookingsForProfessionalAdmin>[2] = {
        page: bookingPage,
        limit: bookingLimit,
        dateFrom: dateFrom.trim() || undefined,
        dateTo: dateTo.trim() || undefined,
      }
      if (bookingStatusFilter !== 'all') {
        query.status = bookingStatusFilter
      }
      const { api: res, loadMeta } = await BookingsService.getBookingsForProfessionalAdmin(
        id,
        professional.professionalId,
        query,
      )
      setBookingsLoadMeta(loadMeta)
      if (!res.success) {
        setBookingsError(res.message || 'Could not load bookings')
        setBookings([])
        setBookingTotal(0)
        return
      }
      const payload = res.data as { bookings?: Booking[]; pagination?: { total?: number } } | undefined
      const list = payload?.bookings ?? []
      setBookings(list)
      setBookingTotal(payload?.pagination?.total ?? list.length)
    } catch (e) {
      setBookingsError(e instanceof Error ? e.message : 'Could not load bookings')
      setBookings([])
      setBookingTotal(0)
      setBookingsLoadMeta(null)
    } finally {
      setBookingsLoading(false)
    }
  }, [id, professional, bookingPage, bookingStatusFilter, dateFrom, dateTo])

  useEffect(() => {
    if (!id || !professional) return
    if (tab === 'bookings' || tab === 'earnings' || tab === 'overview' || tab === 'activity') void loadBookings()
  }, [tab, id, professional, loadBookings])

  const loadApiActivity = useCallback(async () => {
    if (!id) return
    setActivityLoading(true)
    try {
      const res = await ProfessionalsService.getProfessionalActivity(id, { limit: 50 })
      const raw = res.data as Record<string, unknown> | undefined
      const nested = raw?.data as { events?: typeof apiActivityEvents } | undefined
      const events =
        (raw && Array.isArray(raw.events) ? raw.events : null) ??
        nested?.events ??
        []
      setApiActivityEvents(events)
    } catch {
      setApiActivityEvents([])
    } finally {
      setActivityLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (tab === 'activity' && id) void loadApiActivity()
  }, [tab, id, loadApiActivity])

  const loadEarnings = useCallback(async () => {
    if (!id) return
    setEarningsLoading(true)
    setEarningsHint(null)
    setEarningsPayments([])
    try {
      const primary = await PaymentsService.getPayments({
        page: 1,
        limit: 80,
        professional_id: id,
      })
      if (primary.success && primary.data?.payments?.length) {
        setEarningsPayments(primary.data.payments)
        setEarningsHint('Loaded from payments API (professional filter).')
        return
      }
      const ids = bookings.map(bookingRowId).filter(Boolean).slice(0, 24)
      if (ids.length === 0) {
        setEarningsHint('No bookings in the current list to resolve payment lines. Open Bookings or widen filters.')
        return
      }
      const batches: Payment[] = []
      const chunk = 5
      for (let i = 0; i < ids.length; i += chunk) {
        const slice = ids.slice(i, i + chunk)
        const part = await Promise.all(
          slice.map(async (bid) => {
            try {
              const r = await PaymentsService.getPaymentsByBooking(bid)
              if (!r.success || r.data == null) return []
              const raw = r.data as unknown
              const list = Array.isArray(raw) ? raw : (raw as { payments?: Payment[] })?.payments ?? []
              return Array.isArray(list) ? list : []
            } catch {
              return []
            }
          }),
        )
        part.forEach((arr) => batches.push(...arr))
      }
      const dedup = new Map<string, Payment>()
      batches.forEach((p) => {
        const key = p.id || p.bookingId + (p.transactionId || '')
        if (key) dedup.set(key, p)
      })
      setEarningsPayments(Array.from(dedup.values()))
      setEarningsHint(
        primary.success
          ? 'Payments API had no professional filter match; showing payment lines for visible bookings (merged, de-duplicated).'
          : 'Showing payment lines loaded per booking (fallback).',
      )
    } catch (e) {
      setEarningsHint(e instanceof Error ? e.message : 'Could not load payments.')
    } finally {
      setEarningsLoading(false)
    }
  }, [id, bookings])

  useEffect(() => {
    if (tab === 'earnings' && id) void loadEarnings()
  }, [tab, id, loadEarnings])

  const loadReviews = useCallback(async () => {
    if (!id) return
    setReviewsLoading(true)
    try {
      const { reviews: raw } = await ReviewsService.getBookingReviews({
        professionalId: id,
        page: 1,
        limit: 200,
      })
      const proKeys = new Set([id, professional?._id, professional?.id].filter(Boolean) as string[])
      const filtered = raw.filter((r) => r.professionalId && proKeys.has(String(r.professionalId)))
      setReviews(filtered.length > 0 ? filtered : raw)
    } catch {
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [id, professional?._id, professional?.id])

  useEffect(() => {
    if (tab === 'reviews' && id) void loadReviews()
  }, [tab, id, loadReviews])

  useEffect(() => {
    setBookingPage(1)
  }, [bookingStatusFilter, dateFrom, dateTo])

  const bookingStats = useMemo(() => {
    const counts: Record<string, number> = {}
    let completedRevenue = 0
    for (const b of bookings) {
      const st = (b.status || (b as { status?: string }).status || 'unknown') as string
      counts[st] = (counts[st] || 0) + 1
      if (st === 'completed') {
        completedRevenue += Number(b.totalAmount ?? (b as { total_amount?: number }).total_amount ?? 0)
      }
    }
    return { counts, completedRevenue }
  }, [bookings])

  const mergedActivity = useMemo(() => {
    const fromApi = apiActivityEvents.map((e) => ({
      id: `api-${e.id}`,
      occurredAt: e.occurredAt,
      source: 'platform' as const,
      title: e.title,
      description: e.description,
      bookingId: e.bookingId,
    }))
    const fromBookings = buildActivityTimelineFromBookings(bookings, 60).map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      source: 'booking' as const,
      title: e.title,
      description: e.description,
      bookingId: e.bookingId,
    }))
    const merged = [...fromApi, ...fromBookings].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    const seen = new Set<string>()
    const out: typeof merged = []
    for (const row of merged) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      out.push(row)
      if (out.length >= 100) break
    }
    return out
  }, [apiActivityEvents, bookings])

  const reviewsSummary = useMemo(() => {
    if (!reviews.length) return null
    const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0)
    return { average: sum / reviews.length, count: reviews.length }
  }, [reviews])

  const earningsTotals = useMemo(() => {
    let completed = 0
    for (const p of earningsPayments) {
      if (p.status === 'completed') {
        completed += Number(p.amount) || 0
      }
    }
    return { completed, count: earningsPayments.length }
  }, [earningsPayments])

  const performReinstate = async () => {
    if (!id || !professional) return
    setModBusy(true)
    try {
      await ProfessionalsService.reinstateProfessional(id)
      if (professional.userId) {
        try {
          await usersService.toggleUserStatus(professional.userId, true)
        } catch {
          /* user toggle optional */
        }
      }
      setReinstateOpen(false)
      setSnackbar({ open: true, message: 'Professional reinstated.', severity: 'success' })
      await loadProfessional()
    } catch (e) {
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : 'Reinstate failed',
        severity: 'error',
      })
    } finally {
      setModBusy(false)
    }
  }

  const handleSuspendConfirm = async () => {
    if (!id || !suspendReason.trim()) {
      setSnackbar({ open: true, message: 'Reason is required.', severity: 'error' })
      return
    }
    setModBusy(true)
    try {
      await ProfessionalsService.suspendProfessional(id, {
        reason: suspendReason.trim(),
        until: suspendUntil.trim() || undefined,
      })
      if (professional?.userId) {
        try {
          await usersService.toggleUserStatus(professional.userId, false)
        } catch {
          /* optional */
        }
      }
      setSuspendOpen(false)
      setSuspendReason('')
      setSuspendUntil('')
      setSnackbar({ open: true, message: 'Professional suspended.', severity: 'success' })
      await loadProfessional()
    } catch (e) {
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : 'Suspend failed',
        severity: 'error',
      })
    } finally {
      setModBusy(false)
    }
  }

  const handleBlockConfirm = async () => {
    if (!id || !blockReason.trim()) {
      setSnackbar({ open: true, message: 'Reason is required.', severity: 'error' })
      return
    }
    setModBusy(true)
    try {
      await ProfessionalsService.blockProfessional(id, { reason: blockReason.trim() })
      if (professional?.userId) {
        try {
          await usersService.toggleUserStatus(professional.userId, false)
        } catch {
          /* optional */
        }
      }
      setBlockOpen(false)
      setBlockReason('')
      setSnackbar({ open: true, message: 'Professional blocked.', severity: 'success' })
      await loadProfessional()
    } catch (e) {
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : 'Block failed',
        severity: 'error',
      })
    } finally {
      setModBusy(false)
    }
  }

  if (!id) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Invalid route.</Alert>
      </Box>
    )
  }

  if (loadingPro && !professional) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
      </Box>
    )
  }

  if (proError || !professional) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/professionals')} sx={{ mb: 2 }}>
          Back to professionals
        </Button>
        <Alert severity="error">{proError || 'Professional not found'}</Alert>
      </Box>
    )
  }

  const accountStatus = professionalDisplayAccountStatus(professional)

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title={`${professional.firstName} ${professional.lastName}`}
        subtitle={`Command center · ${professional.professionalId}`}
        action={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/professionals')}>
              List
            </Button>
            <Button
              variant="contained"
              component={RouterLink}
              to={`/professionals/edit/${professional._id}`}
            >
              Edit profile
            </Button>
          </Box>
        }
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
        <Chip
          size="small"
          label={`Account: ${accountStatus}`}
          color={accountStatus === 'active' ? 'success' : 'warning'}
        />
        <Chip size="small" label={`Verification: ${professional.verificationStatus}`} />
        <Chip size="small" label={`Availability: ${professional.availability}`} />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as TabKey)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Overview" value="overview" />
        <Tab label="Bookings" value="bookings" />
        <Tab label="Activity" value="activity" />
        <Tab label="Earnings" value="earnings" />
        <Tab label="Reviews" value="reviews" />
        <Tab label="Documents" value="documents" />
        <Tab label="Coverage" value="coverage" />
        <Tab label="Moderation" value="moderation" />
      </Tabs>

      {tab === 'overview' && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Performance (profile)
              </Typography>
              <Typography variant="h4">{Number(professional.rating || 0).toFixed(1)} ★</Typography>
              <Typography variant="body2" color="text.secondary">
                {professional.totalReviews ?? 0} reviews · {professional.completedJobs ?? 0} completed ·{' '}
                {professional.cancelledJobs ?? 0} cancelled (lifetime counters)
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Bookings (this fetch)
              </Typography>
              {bookingsLoading ? (
                <LinearProgress sx={{ mt: 1 }} />
              ) : (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {bookings.length} loaded · total reported {bookingTotal}
                  {bookingsLoadMeta ? ` · source: ${bookingsLoadMeta.strategy}` : ''}. Cancelled / reasons appear in
                  Bookings or Activity.
                </Typography>
              )}
              {bookingsLoadMeta?.warning ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {bookingsLoadMeta.warning}
                </Alert>
              ) : null}
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Quick links
              </Typography>
              <Button sx={{ mt: 1, mr: 1 }} size="small" onClick={() => setTab('bookings')}>
                Bookings
              </Button>
              <Button sx={{ mt: 1, mr: 1 }} size="small" onClick={() => setTab('activity')}>
                Activity
              </Button>
              <Button sx={{ mt: 1, mr: 1 }} size="small" onClick={() => setTab('moderation')}>
                Moderation
              </Button>
              <Button
                size="small"
                component={RouterLink}
                to={`/bookings?professionalId=${encodeURIComponent(id)}`}
                endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              >
                All bookings (filter)
              </Button>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body2">
                Trades: {(professional.categories || []).map((c) => getProfessionalCategoryLabel(c)).join(', ') || '—'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Email {professional.email} · {professional.phoneNumber}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {tab === 'bookings' && (
        <Box>
          {bookingsLoadMeta?.warning ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {bookingsLoadMeta.warning}
            </Alert>
          ) : null}
          {bookingsError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {bookingsError}
            </Alert>
          )}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
              alignItems: 'flex-end',
            }}
          >
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="hub-booking-status">Status</InputLabel>
              <Select
                labelId="hub-booking-status"
                label="Status"
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="in_progress">In progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="From (ISO date)"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="2026-01-01"
            />
            <TextField
              size="small"
              label="To (ISO date)"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="2026-12-31"
            />
            <Button size="small" variant="outlined" onClick={() => void loadBookings()}>
              Refresh
            </Button>
          </Box>
          {bookingsLoading ? (
            <LinearProgress />
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Showing {bookings.length} of {bookingTotal} (page {bookingPage}) · resolution:{' '}
                {bookingsLoadMeta?.strategy ?? '—'}
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ textAlign: 'left', borderBottom: 1, borderColor: 'divider' }}>
                      {['Booking', 'Status', 'Scheduled', 'Amount', 'Cancellation / notes', ''].map((h) => (
                        <Box component="th" key={h || 'a'} sx={{ py: 1, pr: 2, fontWeight: 600 }}>
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {bookings.map((b) => {
                      const bid = bookingRowId(b)
                      const st = b.status || (b as { status?: string }).status
                      const amt = Number(b.totalAmount ?? (b as { total_amount?: number }).total_amount ?? 0)
                      return (
                        <Box component="tr" key={bid} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                            {b.bookingNumber || bid}
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                            <Chip size="small" label={st} />
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                            {b.scheduledDate ? formatDate(b.scheduledDate) : '—'}
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                            {formatCurrency(amt)}
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top', maxWidth: 280 }}>
                            {cancellationText(b)}
                            {b.notes ? (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {b.notes}
                              </Typography>
                            ) : null}
                          </Box>
                          <Box component="td" sx={{ py: 1, verticalAlign: 'top' }}>
                            {bid ? (
                              <Button size="small" component={RouterLink} to={`/bookings/${bid}`}>
                                Details
                              </Button>
                            ) : null}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  size="small"
                  disabled={bookingPage <= 1}
                  onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  disabled={bookingPage * bookingLimit >= bookingTotal}
                  onClick={() => setBookingPage((p) => p + 1)}
                >
                  Next
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {tab === 'activity' && (
        <Box>
          {activityLoading ? <LinearProgress sx={{ mb: 2 }} /> : null}
          <Alert severity="info" sx={{ mb: 2 }}>
            Timeline merges optional <code>GET /professionals/:id/activity</code> events with booking-derived milestones
            (created, scheduled, completed, cancellations). For full audit history, implement the activity API on the
            server.
          </Alert>
          {mergedActivity.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No activity rows yet. Load bookings or add backend activity events.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {mergedActivity.map((row) => (
                <Card key={row.id} variant="outlined">
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="subtitle2">{row.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(row.occurredAt)} · {row.source}
                      </Typography>
                    </Box>
                    {row.description ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {row.description}
                      </Typography>
                    ) : null}
                    {row.bookingId ? (
                      <Button size="small" sx={{ mt: 1 }} component={RouterLink} to={`/bookings/${row.bookingId}`}>
                        Booking details
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {tab === 'earnings' && (
        <Box>
          {earningsLoading ? <LinearProgress sx={{ mb: 2 }} /> : null}
          <Alert severity="info" sx={{ mb: 2 }}>
            Combines <strong>payments list</strong> (when <code>professional_id</code> filter exists) with{' '}
            <strong>per-booking payment lines</strong> for visible assignments. Net payouts and platform fees may still
            require ledger APIs.
          </Alert>
          {earningsHint ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {earningsHint}
            </Typography>
          ) : null}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Completed payments (loaded)
                </Typography>
                <Typography variant="h4">{formatCurrency(earningsTotals.completed)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {earningsTotals.count} payment rows
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Completed job value (bookings list)
                </Typography>
                <Typography variant="h4">{formatCurrency(bookingStats.completedRevenue)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  From booking totals · status counts {JSON.stringify(bookingStats.counts)}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Button size="small" variant="outlined" onClick={() => void loadEarnings()} disabled={earningsLoading}>
                  Refresh payments
                </Button>
              </CardContent>
            </Card>
          </Box>
          {earningsPayments.length > 0 ? (
            <Box sx={{ overflowX: 'auto', mt: 2 }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <Box component="thead">
                  <Box component="tr" sx={{ borderBottom: 1, borderColor: 'divider', textAlign: 'left' }}>
                    {['When', 'Status', 'Amount', 'Method', 'Booking', 'Service'].map((h) => (
                      <Box component="th" key={h} sx={{ py: 1, pr: 2, fontWeight: 600 }}>
                        {h}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {earningsPayments.map((p) => (
                    <Box component="tr" key={p.id || `${p.bookingId}-${p.transactionId}`} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                        {p.completedAt ? formatDate(p.completedAt) : formatDate(p.createdAt)}
                      </Box>
                      <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                        <Chip size="small" label={p.status} />
                      </Box>
                      <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                        {formatCurrency(Number(p.amount) || 0)}
                      </Box>
                      <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                        {p.paymentMethod || '—'}
                      </Box>
                      <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                        {p.bookingId ? (
                          <Button size="small" component={RouterLink} to={`/bookings/${p.bookingId}`}>
                            {p.bookingId}
                          </Button>
                        ) : (
                          '—'
                        )}
                      </Box>
                      <Box component="td" sx={{ py: 1, verticalAlign: 'top' }}>
                        {p.serviceName || p.service || '—'}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : !earningsLoading ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No payment rows loaded. Ensure bookings are visible, or implement GET /payments?professional_id=…
            </Alert>
          ) : null}
        </Box>
      )}

      {tab === 'reviews' && (
        <Box>
          {reviewsLoading ? <LinearProgress /> : null}
          {reviewsSummary ? (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle1">
                  Average {reviewsSummary.average.toFixed(2)} ★ across {reviewsSummary.count} loaded reviews
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Increase backend limit or add GET /reviews?professionalId= for complete history.
                </Typography>
              </CardContent>
            </Card>
          ) : null}
          {!reviewsLoading && reviews.length === 0 ? (
            <Alert severity="info">No reviews matched this professional (try widening API support for professionalId).</Alert>
          ) : null}
          {!reviewsLoading &&
            reviews.map((r) => (
              <Card key={r._id} variant="outlined" sx={{ mb: 1 }}>
                <CardContent>
                  <Typography variant="subtitle1">
                    {r.rating} ★ · {formatDate(r.createdAt)}
                  </Typography>
                  <Typography variant="body2">{r.comment || '—'}</Typography>
                  {r.bookingId ? (
                    <Button size="small" sx={{ mt: 1 }} component={RouterLink} to={`/bookings/${r.bookingId}`}>
                      Open booking
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
        </Box>
      )}

      {tab === 'documents' && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            From profile certifications. Upload flows remain on the professional portal unless you add admin doc APIs.
          </Typography>
          {(professional.certifications || []).length === 0 ? (
            <Alert severity="info">No certifications on file.</Alert>
          ) : (
            (professional.certifications || []).map((c, i) => {
              const days = daysUntilExpiry(c.expiryDate)
              const expired = days != null && days < 0
              const soon = days != null && days >= 0 && days <= 30
              const v = c.verificationStatus
              return (
                <Card key={`${c.name}-${i}`} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">{c.name}</Typography>
                      {v ? (
                        <Chip
                          size="small"
                          label={`Review: ${v}`}
                          color={v === 'approved' ? 'success' : v === 'rejected' ? 'error' : 'warning'}
                        />
                      ) : (
                        <Chip size="small" label="Review: not set" variant="outlined" />
                      )}
                      {expired ? <Chip size="small" label="Expired" color="error" /> : null}
                      {!expired && soon ? (
                        <Chip size="small" label={`Expires in ${days}d`} color="warning" />
                      ) : null}
                    </Box>
                    <Typography variant="body2">Issued by {c.issuedBy}</Typography>
                    {c.adminNotes ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Admin: {c.adminNotes}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {c.issuedDate ? `Issued ${c.issuedDate}` : ''}{' '}
                      {c.expiryDate ? `· Expires ${c.expiryDate}` : ''}
                    </Typography>
                    {c.certificateUrl ? (
                      <Button size="small" href={c.certificateUrl} target="_blank" rel="noreferrer">
                        Open file
                      </Button>
                    ) : (
                      <Chip size="small" label="No file URL" variant="outlined" sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </Box>
      )}

      {tab === 'coverage' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Base address
              </Typography>
              <Typography variant="body2">
                {professional.address?.street ? `${professional.address.street}, ` : ''}
                {professional.address?.area}, {professional.address?.city}, {professional.address?.state}{' '}
                {professional.address?.pincode}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Service areas
              </Typography>
              {(professional.serviceAreas || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None listed
                </Typography>
              ) : (
                (professional.serviceAreas || []).map((a, idx) => (
                  <Box key={`${a.city}-${idx}`} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">{a.city}</Typography>
                    {a.areas?.length ? (
                      <Typography variant="body2">Areas: {a.areas.join(', ')}</Typography>
                    ) : null}
                    {a.pincodes?.length ? (
                      <Typography variant="body2">Pincodes: {a.pincodes.join(', ')}</Typography>
                    ) : null}
                    {a.radius != null ? (
                      <Typography variant="body2">Radius: {a.radius} km</Typography>
                    ) : null}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {tab === 'moderation' && (
        <Box>
          {!canModerate ? (
            <Alert severity="warning">You do not have permission to moderate professionals.</Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Suspend and block prefer dedicated POST endpoints; if the server returns 404, the app falls back to
                deactivating the professional record. When <code>userId</code> is present, login is toggled via users
                API.
              </Alert>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Current: <strong>{accountStatus}</strong>
                {professional.moderationReason ? ` — ${professional.moderationReason}` : ''}
              </Typography>
              {professional.suspendedUntil ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Suspended until: {formatDate(professional.suspendedUntil)}
                </Typography>
              ) : null}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button variant="outlined" color="warning" onClick={() => setSuspendOpen(true)} disabled={modBusy}>
                  Suspend
                </Button>
                <Button variant="outlined" color="error" onClick={() => setBlockOpen(true)} disabled={modBusy}>
                  Block
                </Button>
                <Button variant="contained" color="success" onClick={() => setReinstateOpen(true)} disabled={modBusy}>
                  Reinstate
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      <Dialog open={suspendOpen} onClose={() => !modBusy && setSuspendOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Suspend professional</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason (required)"
            fullWidth
            multiline
            minRows={2}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Until (optional, ISO date)"
            fullWidth
            value={suspendUntil}
            onChange={(e) => setSuspendUntil(e.target.value)}
            placeholder="2026-12-31"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendOpen(false)} disabled={modBusy}>
            Cancel
          </Button>
          <Button onClick={() => void handleSuspendConfirm()} variant="contained" color="warning" disabled={modBusy}>
            Confirm suspend
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reinstateOpen} onClose={() => !modBusy && setReinstateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reinstate professional?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This restores marketplace access (and login when linked). Confirm this account should be active again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReinstateOpen(false)} disabled={modBusy}>
            Cancel
          </Button>
          <Button onClick={() => void performReinstate()} variant="contained" color="success" disabled={modBusy}>
            Confirm reinstate
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={blockOpen} onClose={() => !modBusy && setBlockOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Block professional</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason (required)"
            fullWidth
            multiline
            minRows={3}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockOpen(false)} disabled={modBusy}>
            Cancel
          </Button>
          <Button onClick={() => void handleBlockConfirm()} variant="contained" color="error" disabled={modBusy}>
            Confirm block
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
