/**
 * Admin command center for a single professional: overview, bookings, earnings estimate,
 * reviews, documents, service coverage, and moderation (suspend / block / reinstate).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Avatar,
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
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab'
import {
  ArrowBack as BackIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { BookingsService } from '../../services/api/bookings.service'
import { PaymentsService } from '../../services/api/payments.service'
import { ReviewsService, type BookingReview } from '../../services/api/reviews.service'
import { usersService } from '../../services/api/users.service'
import type { Professional } from '../../types/professional.types'
import type { Booking, Payment } from '../../types'
import { buildActivityTimelineFromBookings } from '../../lib/professionalActivity'
import {
  BOOKING_STATUSES_FOR_TOTALS,
  PIPELINE_GROUPS,
  type PipelineGroup,
  bookingLifecycleLabel,
  sumStatusesForGroup,
} from '../../lib/professionalWorkPipeline'
import { usePermissions } from '../../hooks/usePermissions'
import {
  extractProfessionalFromGetResponse,
  normalizeProfessionalFromApi,
  professionalDisplayAccountStatus,
  professionalDocumentsUpdatePayload,
} from '../../lib/professionalAdmin'
import { professionalKycTypeLabel } from '../../constants/professionalKycDocuments'
import { formatCurrency, formatDate } from '../../lib/utils'
import { normalizeLedgerPaymentsList } from '../../lib/paymentLedgerNormalize'
import { getProfessionalCategoryLabel } from '../../constants/professionalCategories'
import {
  formatSlotList,
  normalizeWeeklyAvailability,
  PROFESSIONAL_WEEKDAY_KEYS,
  scheduleSummaryLines,
  weekdayShortLabel,
} from '../../lib/professionalSchedule'

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

/** Admin review list may populate `professionalId` as a document; match filters by Mongo _id. */
function reviewProfessionalMongoId(r: Pick<BookingReview, 'professionalId'>): string | null {
  const p = r.professionalId
  if (!p) return null
  if (typeof p === 'string') return p
  return p._id != null ? String(p._id) : null
}

function reviewBookingMongoId(r: Pick<BookingReview, 'bookingId'>): string | null {
  const b = r.bookingId
  if (!b) return null
  if (typeof b === 'string') return b
  return b._id != null ? String(b._id) : null
}

function customerDisplayName(b: Booking): string {
  const c = b.customer
  if (c?.firstName || c?.lastName) {
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
  }
  return (b.customerName && String(b.customerName).trim()) || '—'
}

function serviceDisplayName(b: Booking): string {
  if (b.serviceName?.trim()) return b.serviceName.trim()
  const s0 = b.services?.[0]
  return s0?.serviceName || s0?.serviceDetails?.name || '—'
}

function assignedAtDisplay(b: Booking): string {
  const raw = b.assignedAt ?? b.assigned_at
  if (!raw || !String(raw).trim()) return '—'
  return formatDate(String(raw))
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
  const [docSavingKey, setDocSavingKey] = useState<string | null>(null)

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

  /** Per-status totals (lightweight page=1 requests) for pipeline KPIs */
  const [statusTotals, setStatusTotals] = useState<Partial<Record<string, number>> | null>(null)
  const [statusTotalsLoading, setStatusTotalsLoading] = useState(false)
  const [statusTotalsError, setStatusTotalsError] = useState(false)

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

  const loadStatusTotals = useCallback(async () => {
    if (!id || !professional) return
    setStatusTotalsLoading(true)
    setStatusTotalsError(false)
    try {
      const entries = await Promise.all(
        BOOKING_STATUSES_FOR_TOTALS.map(async (status) => {
          const { api } = await BookingsService.getBookingsForProfessionalAdmin(id, professional.professionalId, {
            page: 1,
            limit: 1,
            status,
          })
          const payload = (api.data || {}) as { pagination?: { total?: number } }
          const total = payload.pagination?.total ?? 0
          return [status, total] as const
        }),
      )
      setStatusTotals(Object.fromEntries(entries))
    } catch {
      setStatusTotals(null)
      setStatusTotalsError(true)
    } finally {
      setStatusTotalsLoading(false)
    }
  }, [id, professional])

  useEffect(() => {
    if (professional) void loadStatusTotals()
  }, [professional, loadStatusTotals])

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
        setEarningsPayments(normalizeLedgerPaymentsList(primary.data.payments))
        setEarningsHint(null)
        return
      }
      const ids = bookings.map(bookingRowId).filter(Boolean).slice(0, 24)
      if (ids.length === 0) {
        setEarningsHint('Open the Bookings tab or adjust filters to load assigned jobs; payments are matched from those rows.')
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
              return normalizeLedgerPaymentsList(r.data as unknown)
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
          ? 'Payments shown per booking on the current list (merged).'
          : 'Payments loaded per booking on the current list.',
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
    if (!id || !professional) return
    setReviewsLoading(true)
    try {
      const proKeys = new Set([id, professional._id, professional.id].filter(Boolean) as string[])
      const pageSize = 100
      const collected: BookingReview[] = []
      const seen = new Set<string>()
      let page = 1
      let totalPages = 1
      while (page <= totalPages && page <= 50) {
        const { reviews: raw, pagination } = await ReviewsService.getBookingReviews({
          professionalId: id,
          page,
          limit: pageSize,
        })
        const tp = pagination?.totalPages
        if (typeof tp === 'number' && tp >= 1) totalPages = tp
        for (const r of raw) {
          const pid = reviewProfessionalMongoId(r)
          if (pid == null || !proKeys.has(pid)) continue
          if (seen.has(r._id)) continue
          seen.add(r._id)
          collected.push(r)
        }
        if (raw.length === 0 || raw.length < pageSize) break
        page += 1
      }
      collected.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setReviews(collected)
    } catch {
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [id, professional])

  useEffect(() => {
    if (tab === 'reviews' && id && professional) void loadReviews()
  }, [tab, id, professional, loadReviews])

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
    const merged = [...fromApi, ...fromBookings]
      .filter((row) => row.occurredAt && !Number.isNaN(new Date(row.occurredAt).getTime()))
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
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

  /** Certifications with real content only (name or uploaded file) — hide empty rows from profile payload */
  const profileDocuments = useMemo(() => {
    if (!professional) return []
    return (professional.certifications || []).filter((c) => {
      const name = c.name?.trim()
      const url = c.certificateUrl?.trim()
      return Boolean(name || url)
    })
  }, [professional])

  const earningsTotals = useMemo(() => {
    let completed = 0
    for (const p of earningsPayments) {
      if (p.status === 'completed') {
        completed += Number(p.amount) || 0
      }
    }
    return { completed, count: earningsPayments.length }
  }, [earningsPayments])

  const pipelineGrandTotal = useMemo(() => {
    if (!statusTotals) return null
    return BOOKING_STATUSES_FOR_TOTALS.reduce((s, st) => s + (Number(statusTotals[st]) || 0), 0)
  }, [statusTotals])

  const handlePipelineStageClick = (group: PipelineGroup) => {
    setTab('bookings')
    setBookingStatusFilter(group.drilldownStatus)
    setBookingPage(1)
  }

  const kycDocuments = professional?.documents ?? []

  const handleSetKycVerified = async (index: number, verified: boolean) => {
    if (!id || !professional?.documents?.length || !canModerate) return
    const key = `kyc-${index}`
    setDocSavingKey(key)
    try {
      const next = professional.documents.map((d, i) => (i === index ? { ...d, isVerified: verified } : d))
      await ProfessionalsService.updateProfessional(id, {
        documents: professionalDocumentsUpdatePayload(next),
      })
      setSnackbar({
        open: true,
        message: verified ? 'Document marked as verified.' : 'Document verification cleared.',
        severity: 'success',
      })
      await loadProfessional()
    } catch (e) {
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : 'Could not update document.',
        severity: 'error',
      })
    } finally {
      setDocSavingKey(null)
    }
  }

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
        subtitle="Operations hub — assignment through completion, earnings, compliance, and moderation in one place."
        action={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/professionals')}>
              List
            </Button>
            <Button variant="outlined" component={RouterLink} to="/professionals/operations">
              Workforce dashboard
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

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : theme.palette.grey[50],
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              src={professional.profileImage}
              alt=""
              sx={{ width: 64, height: 64, fontSize: '1.25rem' }}
            >
              {(professional.firstName?.[0] ?? '?').toUpperCase()}
              {(professional.lastName?.[0] ?? '').toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Pro ID · {professional.professionalId}
              </Typography>
              <Typography variant="body2" noWrap title={professional.email}>
                {professional.email} · {professional.phoneNumber}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.75 }}>
                <Chip
                  size="small"
                  label={`Account: ${accountStatus}`}
                  color={accountStatus === 'active' ? 'success' : 'warning'}
                />
                <Chip size="small" label={`Verification: ${professional.verificationStatus}`} />
                <Chip size="small" label={`Availability: ${professional.availability}`} />
              </Stack>
            </Box>
          </Stack>
          <Box sx={{ flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Lifecycle snapshot
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" component="span">
                {statusTotalsLoading ? '—' : pipelineGrandTotal ?? '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                assignments (all statuses)
              </Typography>
              <Tooltip title="Refresh stage counts">
                <Button size="small" variant="outlined" onClick={() => void loadStatusTotals()} disabled={statusTotalsLoading}>
                  Refresh
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        </Stack>

        {statusTotalsError ? (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            Could not load assignment counts. Refresh the page or open Bookings to verify workload.
          </Alert>
        ) : null}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 1 }}>
          Counts come from bookings assigned to this professional (by status). Select a stage to jump to Bookings with
          a matching filter.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { height: 6 },
          }}
        >
          {PIPELINE_GROUPS.map((group) => {
            const count = sumStatusesForGroup(statusTotals, group.statuses)
            return (
              <Tooltip key={group.id} title={group.description}>
                <Paper
                  variant="outlined"
                  onClick={() => handlePipelineStageClick(group)}
                  sx={{
                    minWidth: 140,
                    p: 1.25,
                    cursor: 'pointer',
                    borderRadius: 2,
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 1,
                    },
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    {group.shortLabel}
                  </Typography>
                  <Typography variant="h6">{statusTotalsLoading ? '…' : count}</Typography>
                  <Chip size="small" label={bookingLifecycleLabel(group.drilldownStatus)} sx={{ mt: 0.5 }} color={group.color} variant="outlined" />
                </Paper>
              </Tooltip>
            )
          })}
        </Box>
      </Paper>

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
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Quality &amp; throughput
              </Typography>
              <Typography variant="h4">{Number(professional.rating || 0).toFixed(1)} ★</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {professional.totalReviews ?? 0} reviews on profile · {professional.completedJobs ?? 0} completed jobs ·{' '}
                {professional.cancelledJobs ?? 0} cancelled (lifetime)
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Live assignment load
              </Typography>
              {bookingsLoading ? (
                <LinearProgress sx={{ mt: 1 }} />
              ) : (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  This page: {bookings.length} rows · Total assignments: {bookingTotal}
                </Typography>
              )}
              {statusTotals && !statusTotalsLoading ? (
                <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {BOOKING_STATUSES_FOR_TOTALS.map((st) => (
                    <Chip
                      key={st}
                      size="small"
                      variant="outlined"
                      label={`${bookingLifecycleLabel(st)}: ${statusTotals[st] ?? 0}`}
                      onClick={() => {
                        setTab('bookings')
                        setBookingStatusFilter(st)
                        setBookingPage(1)
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  {statusTotalsLoading ? 'Loading stage totals…' : 'Stage totals unavailable.'}
                </Typography>
              )}
              {bookingsLoadMeta?.warning ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {bookingsLoadMeta.warning}
                </Alert>
              ) : null}
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Shortcuts
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                <Button size="small" variant="outlined" onClick={() => setTab('bookings')}>
                  Bookings
                </Button>
                <Button size="small" variant="outlined" onClick={() => setTab('activity')}>
                  Activity
                </Button>
                <Button size="small" variant="outlined" onClick={() => setTab('earnings')}>
                  Earnings
                </Button>
                <Button size="small" variant="outlined" onClick={() => setTab('documents')}>
                  Documents
                </Button>
                <Button size="small" variant="outlined" onClick={() => setTab('moderation')}>
                  Moderation
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  component={RouterLink}
                  to={`/bookings?professionalId=${encodeURIComponent(id)}`}
                  endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                >
                  Global list
                </Button>
              </Stack>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ gridColumn: { xs: '1', md: '1 / -1' }, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Calendar &amp; working hours
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                Synced from the professional app (weekly grid + live status). Use this when assigning leads or judging
                capacity.
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                <Chip
                  size="small"
                  variant="outlined"
                  color={
                    professional.availability === 'available'
                      ? 'success'
                      : professional.availability === 'busy'
                        ? 'warning'
                        : 'default'
                  }
                  label={`Live status: ${professional.availability}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Max bookings / day: ${professional.maxBookingsPerDay ?? '—'}`}
                />
                {professional.workingHours?.start && professional.workingHours?.end ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Legacy band: ${professional.workingHours.start}–${professional.workingHours.end}`}
                  />
                ) : null}
              </Stack>
              {(() => {
                const weekly = normalizeWeeklyAvailability(professional.weeklyAvailability)
                const hasWeekly = PROFESSIONAL_WEEKDAY_KEYS.some((k) => weekly[k].length > 0)
                const legacyLines = scheduleSummaryLines(professional)
                return (
                  <>
                    {!hasWeekly && legacyLines.length > 0 ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Weekly grid not saved in the app yet — showing onboarding-style working days / hours only.
                      </Alert>
                    ) : null}
                    {!hasWeekly && legacyLines.length === 0 ? (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        No calendar data on file. Ask the professional to set availability in the provider app, or edit
                        defaults in admin profile.
                      </Alert>
                    ) : null}
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                      }}
                    >
                      {PROFESSIONAL_WEEKDAY_KEYS.map((k) => (
                        <Paper key={k} variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {weekdayShortLabel(k)}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {formatSlotList(weekly[k])}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </>
                )
              })()}
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ gridColumn: { xs: '1', md: '1 / -1' }, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Profile summary
              </Typography>
              <Typography variant="body2">
                Trades: {(professional.categories || []).map((c) => getProfessionalCategoryLabel(c)).join(', ') || '—'}
              </Typography>
              {professional.serviceProviderId?.businessName ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Provider: {professional.serviceProviderId.businessName}
                </Typography>
              ) : null}
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
              placeholder="YYYY-MM-DD"
            />
            <TextField
              size="small"
              label="To (ISO date)"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="YYYY-MM-DD"
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
                Showing {bookings.length} of {bookingTotal} · Page {bookingPage}
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ textAlign: 'left', borderBottom: 1, borderColor: 'divider' }}>
                      {[
                        'Booking',
                        'Customer',
                        'Service',
                        'Status',
                        'Payment',
                        'Scheduled',
                        'Assigned',
                        'Amount',
                        'Notes',
                        '',
                      ].map((h) => (
                        <Box component="th" key={h || 'actions'} sx={{ py: 1, pr: 2, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {bookings.map((b) => {
                      const bid = bookingRowId(b)
                      const st = (b.status || (b as { status?: string }).status || '—') as string
                      const amt = Number(b.totalAmount ?? (b as { total_amount?: number }).total_amount ?? 0)
                      const pay = b.paymentStatus
                      return (
                        <Box component="tr" key={bid} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                            <Typography variant="body2" fontWeight={600}>
                              {b.bookingNumber || bid}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {b.scheduledTime ? `${b.scheduledTime}` : ''}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top', minWidth: 120 }}>
                            {customerDisplayName(b)}
                            {b.customerPhone ? (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {b.customerPhone}
                              </Typography>
                            ) : null}
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top', maxWidth: 200 }}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {serviceDisplayName(b)}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                            <Chip size="small" label={st} />
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25 }}>
                              {bookingLifecycleLabel(st)}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                            {pay ? <Chip size="small" variant="outlined" label={pay} /> : '—'}
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {b.scheduledDate ? formatDate(b.scheduledDate) : '—'}
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {assignedAtDisplay(b)}
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top' }}>
                            {formatCurrency(amt)}
                          </Box>
                          <Box component="td" sx={{ py: 1, pr: 2, verticalAlign: 'top', maxWidth: 220 }}>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Timeline uses platform activity when the API returns it, plus milestones derived from loaded bookings (only
            events with real timestamps from the server).
          </Typography>
          {mergedActivity.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No activity yet. Open Bookings to load assignments, or check back after new updates.
            </Typography>
          ) : (
            <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2, overflow: 'hidden' }}>
              <Timeline position="right">
                {mergedActivity.map((row, idx) => (
                  <TimelineItem key={row.id}>
                    <TimelineOppositeContent
                      color="text.secondary"
                      sx={{ flex: 0.22, maxWidth: 160, py: 2, fontSize: '0.8rem' }}
                    >
                      {formatDate(row.occurredAt)}
                      <Typography variant="caption" display="block" sx={{ opacity: 0.85 }}>
                        {row.source === 'platform' ? 'Platform' : 'Booking'}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot
                        color={row.source === 'platform' ? 'secondary' : 'primary'}
                        variant="outlined"
                      />
                      {idx < mergedActivity.length - 1 ? <TimelineConnector /> : null}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: 2 }}>
                      <Typography variant="subtitle2">{row.title}</Typography>
                      {row.description ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {row.description}
                        </Typography>
                      ) : null}
                      {row.bookingId ? (
                        <Button size="small" sx={{ mt: 1 }} component={RouterLink} to={`/bookings/${row.bookingId}`}>
                          Open booking
                        </Button>
                      ) : null}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Paper>
          )}
        </Box>
      )}

      {tab === 'earnings' && (
        <Box>
          {earningsLoading ? <LinearProgress sx={{ mb: 2 }} /> : null}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Payment rows from finance records linked to this professional or to bookings listed below.
          </Typography>
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
                  Sum of completed jobs on the current Bookings page only (not full history).
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
              No payment records found for this view.
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
                  Average {reviewsSummary.average.toFixed(2)} ★ · {reviewsSummary.count}{' '}
                  {reviewsSummary.count === 1 ? 'review' : 'reviews'} from customers
                </Typography>
              </CardContent>
            </Card>
          ) : null}
          {!reviewsLoading && reviews.length === 0 ? (
            <Alert severity="info">No customer reviews for this professional yet.</Alert>
          ) : null}
          {!reviewsLoading &&
            reviews.map((r) => {
              const bookingEmbed =
                r.bookingId && typeof r.bookingId === 'object' ? r.bookingId : null
              const line0 =
                bookingEmbed && 'services' in bookingEmbed
                  ? bookingEmbed.services?.[0]
                  : undefined
              const serviceCaption = r.serviceName
                ? [r.serviceName, r.variantName].filter(Boolean).join(' · ')
                : [line0?.serviceName, line0?.variantName].filter(Boolean).join(' · ')
              const bid = reviewBookingMongoId(r)
              return (
                <Card key={r._id} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1">
                      {r.rating} ★ · {formatDate(r.createdAt)}
                    </Typography>
                    <Typography variant="body2">{r.comment || '—'}</Typography>
                    {serviceCaption ? (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {serviceCaption}
                      </Typography>
                    ) : null}
                    {bid ? (
                      <Button size="small" sx={{ mt: 1 }} component={RouterLink} to={`/bookings/${bid}`}>
                        Open booking
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
        </Box>
      )}

      {tab === 'documents' && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Same record as the professional mobile app: <strong>KYC uploads</strong> (identity / compliance) and{' '}
            <strong>trade certifications</strong> (skills, optional file). Rows appear only after data exists on the
            server.
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Identity &amp; KYC
          </Typography>
          {kycDocuments.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No KYC files yet. They are submitted from the professional app (Documents screen) and stored on this
              profile.
            </Alert>
          ) : (
            <Stack spacing={1} sx={{ mb: 3 }}>
              {kycDocuments.map((doc, index) => (
                <Card key={doc._id ?? `${doc.type}-${index}`} variant="outlined">
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2">{professionalKycTypeLabel(doc.type)}</Typography>
                      <Chip
                        size="small"
                        label={doc.isVerified ? 'Verified' : 'Pending review'}
                        color={doc.isVerified ? 'success' : 'warning'}
                        variant={doc.isVerified ? 'filled' : 'outlined'}
                      />
                    </Box>
                    {doc.documentNumber ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Reference: {doc.documentNumber}
                      </Typography>
                    ) : null}
                    <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                      <Button size="small" href={doc.documentUrl} target="_blank" rel="noreferrer">
                        Open file
                      </Button>
                      {canModerate ? (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            disabled={docSavingKey !== null || Boolean(doc.isVerified)}
                            onClick={() => void handleSetKycVerified(index, true)}
                          >
                            {docSavingKey === `kyc-${index}` ? 'Saving…' : 'Mark verified'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            disabled={docSavingKey !== null || !doc.isVerified}
                            onClick={() => void handleSetKycVerified(index, false)}
                          >
                            Clear verification
                          </Button>
                        </>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Trade certifications
          </Typography>
          {profileDocuments.length === 0 ? (
            <Alert severity="info">No trade certifications with a title or file on file.</Alert>
          ) : (
            profileDocuments.map((c, i) => {
              const days = daysUntilExpiry(c.expiryDate)
              const expired = days != null && days < 0
              const soon = days != null && days >= 0 && days <= 30
              const v = c.verificationStatus
              return (
                <Card key={`${c.certificateUrl ?? ''}-${c.name ?? ''}-${i}`} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">{c.name?.trim() || 'Uploaded document'}</Typography>
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
                    {c.issuedBy?.trim() ? (
                      <Typography variant="body2">Issued by {c.issuedBy}</Typography>
                    ) : null}
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Suspend temporarily, block permanently, or reinstate access. Linked login may be disabled when a user
                account is connected.
              </Typography>
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
            placeholder="YYYY-MM-DD"
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
