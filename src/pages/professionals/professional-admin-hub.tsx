/**
 * Admin command center for a single professional: overview, bookings, earnings estimate,
 * reviews, documents, service coverage, and moderation (suspend / block / reinstate).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useToast,
} from '../../components/ui'
import { cn } from '../../lib/utils'
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
import { ProfessionalConductPanel } from '../../components/professionals/ProfessionalConductPanel'
import {
  formatSlotList,
  normalizeWeeklyAvailability,
  PROFESSIONAL_WEEKDAY_KEYS,
  scheduleSummaryLines,
  weekdayShortLabel,
} from '../../lib/professionalSchedule'

function pipelineStageBadgeVariant(
  color: PipelineGroup['color'],
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (color === 'success') return 'success'
  if (color === 'warning') return 'warning'
  if (color === 'error') return 'destructive'
  if (color === 'primary' || color === 'info' || color === 'secondary') return 'secondary'
  return 'outline'
}

function HubAlert({
  variant = 'info',
  className,
  children,
}: {
  variant?: 'info' | 'warning' | 'error'
  className?: string
  children: React.ReactNode
}) {
  const styles =
    variant === 'info'
      ? 'border-border bg-muted/50 text-foreground'
      : variant === 'warning'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-50'
        : 'border-destructive/40 bg-destructive/10 text-destructive'
  return (
    <div
      role={variant === 'info' ? 'status' : 'alert'}
      className={cn('rounded-lg border p-3 text-sm', styles, className)}
    >
      {children}
    </div>
  )
}

type TabKey =
  | 'overview'
  | 'bookings'
  | 'activity'
  | 'earnings'
  | 'reviews'
  | 'documents'
  | 'coverage'
  | 'conduct'
  | 'moderation'

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
  const canViewConduct = checkPermission('view_professional_conduct')

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

  const { toast } = useToast()

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
      toast({
        title: verified ? 'Document marked as verified.' : 'Document verification cleared.',
      })
      await loadProfessional()
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Could not update document.',
        variant: 'destructive',
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
      toast({ title: 'Professional reinstated.' })
      await loadProfessional()
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Reinstate failed',
        variant: 'destructive',
      })
    } finally {
      setModBusy(false)
    }
  }

  const handleSuspendConfirm = async () => {
    if (!id || !suspendReason.trim()) {
      toast({ title: 'Reason is required.', variant: 'destructive' })
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
      toast({ title: 'Professional suspended.' })
      await loadProfessional()
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Suspend failed',
        variant: 'destructive',
      })
    } finally {
      setModBusy(false)
    }
  }

  const handleBlockConfirm = async () => {
    if (!id || !blockReason.trim()) {
      toast({ title: 'Reason is required.', variant: 'destructive' })
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
      toast({ title: 'Professional blocked.' })
      await loadProfessional()
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Block failed',
        variant: 'destructive',
      })
    } finally {
      setModBusy(false)
    }
  }

  if (!id) {
    return (
      <div className="p-2">
        <HubAlert variant="error">Invalid route.</HubAlert>
      </div>
    )
  }

  if (loadingPro && !professional) {
    return (
      <div className="p-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      </div>
    )
  }

  if (proError || !professional) {
    return (
      <div className="p-2">
        <Button variant="outline" className="mb-2 gap-2" onClick={() => navigate('/professionals')}>
          <ArrowLeft className="h-4 w-4" />
          Back to professionals
        </Button>
        <HubAlert variant="error">{proError || 'Professional not found'}</HubAlert>
      </div>
    )
  }

  const accountStatus = professionalDisplayAccountStatus(professional)

  return (
    <TooltipProvider>
    <div className="pb-4">
      <PageHeader
        title={`${professional.firstName} ${professional.lastName}`}
        subtitle="Operations hub — assignment through completion, earnings, compliance, and moderation in one place."
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" asChild>
              <RouterLink to="/professionals" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                List
              </RouterLink>
            </Button>
            <Button variant="outline" asChild>
              <RouterLink to="/professionals/operations">Workforce dashboard</RouterLink>
            </Button>
            <Button asChild>
              <RouterLink to={`/professionals/edit/${professional._id}`}>Edit profile</RouterLink>
            </Button>
          </div>
        }
      />

      <Card className="mb-2 bg-muted/30">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                {professional.profileImage ? (
                  <AvatarImage src={professional.profileImage} alt="" />
                ) : null}
                <AvatarFallback className="text-lg">
                  {(professional.firstName?.[0] ?? '?').toUpperCase()}
                  {(professional.lastName?.[0] ?? '').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Pro ID · {professional.professionalId}</p>
                <p className="truncate text-sm" title={professional.email}>
                  {professional.email} · {professional.phoneNumber}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant={accountStatus === 'active' ? 'success' : 'warning'}>
                    Account: {accountStatus}
                  </Badge>
                  <Badge variant="outline">Verification: {professional.verificationStatus}</Badge>
                  <Badge variant="outline">Availability: {professional.availability}</Badge>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <p className="mb-1 block text-xs text-muted-foreground">Lifecycle snapshot</p>
              <div className="flex flex-row items-center gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                  {statusTotalsLoading ? '—' : pipelineGrandTotal ?? '—'}
                </span>
                <span className="text-sm text-muted-foreground">assignments (all statuses)</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void loadStatusTotals()}
                        disabled={statusTotalsLoading}
                      >
                        Refresh
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Refresh stage counts</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {statusTotalsError ? (
            <HubAlert variant="warning" className="mt-2">
              Could not load assignment counts. Refresh the page or open Bookings to verify workload.
            </HubAlert>
          ) : null}

          <p className="mb-2 mt-4 block text-xs text-muted-foreground">
            Counts come from bookings assigned to this professional (by status). Select a stage to jump to Bookings
            with a matching filter.
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PIPELINE_GROUPS.map((group) => {
              const count = sumStatusesForGroup(statusTotals, group.statuses)
              return (
                <Tooltip key={group.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handlePipelineStageClick(group)}
                      className="min-w-[140px] shrink-0 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:shadow-sm"
                    >
                      <span className="block text-xs text-muted-foreground">{group.shortLabel}</span>
                      <span className="text-xl font-semibold">{statusTotalsLoading ? '…' : count}</span>
                      <Badge variant={pipelineStageBadgeVariant(group.color)} className="mt-1">
                        {bookingLifecycleLabel(group.drilldownStatus)}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{group.description}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mb-2 w-full">
        <div className="overflow-x-auto border-b border-border">
          <TabsList className="inline-flex h-auto min-h-10 w-max min-w-full flex-wrap justify-start gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger value="overview" className="shrink-0">
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookings" className="shrink-0">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="activity" className="shrink-0">
              Activity
            </TabsTrigger>
            <TabsTrigger value="earnings" className="shrink-0">
              Earnings
            </TabsTrigger>
            <TabsTrigger value="reviews" className="shrink-0">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="documents" className="shrink-0">
              Documents
            </TabsTrigger>
            <TabsTrigger value="coverage" className="shrink-0">
              Coverage
            </TabsTrigger>
            {canViewConduct ? (
              <TabsTrigger value="conduct" className="shrink-0">
                Conduct
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="moderation" className="shrink-0">
              Moderation
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {tab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-muted-foreground">Quality &amp; throughput</h3>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{Number(professional.rating || 0).toFixed(1)} ★</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {professional.totalReviews ?? 0} reviews on profile · {professional.completedJobs ?? 0} completed jobs ·{' '}
                {professional.cancelledJobs ?? 0} cancelled (lifetime)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-muted-foreground">Live assignment load</h3>
              {bookingsLoading ? (
                <Loader2 className="mt-2 h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
              ) : (
                <p className="mt-2 text-sm">This page: {bookings.length} rows · Total assignments: {bookingTotal}</p>
              )}
              {statusTotals && !statusTotalsLoading ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {BOOKING_STATUSES_FOR_TOTALS.map((st) => (
                    <Badge
                      key={st}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => {
                        setTab('bookings')
                        setBookingStatusFilter(st)
                        setBookingPage(1)
                      }}
                    >
                      {bookingLifecycleLabel(st)}: {statusTotals[st] ?? 0}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 block text-xs text-muted-foreground">
                  {statusTotalsLoading ? 'Loading stage totals…' : 'Stage totals unavailable.'}
                </p>
              )}
              {bookingsLoadMeta?.warning ? (
                <HubAlert variant="warning" className="mt-2">
                  {bookingsLoadMeta.warning}
                </HubAlert>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-muted-foreground">Shortcuts</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => setTab('bookings')}>
                  Bookings
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab('activity')}>
                  Activity
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab('earnings')}>
                  Earnings
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab('documents')}>
                  Documents
                </Button>
                {canViewConduct ? (
                  <Button size="sm" variant="outline" onClick={() => setTab('conduct')}>
                    Conduct
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setTab('moderation')}>
                  Moderation
                </Button>
                <Button size="sm" asChild>
                  <RouterLink to={`/bookings?professionalId=${encodeURIComponent(id)}`} className="inline-flex items-center gap-1">
                    Global list
                    <ExternalLink className="h-3.5 w-3.5" />
                  </RouterLink>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-3">
            <CardContent className="pt-6">
              <h3 className="text-base font-semibold leading-none">Calendar &amp; working hours</h3>
              <p className="mb-4 mt-2 block text-xs text-muted-foreground">
                Synced from the professional app (weekly grid + live status). Use this when assigning leads or judging
                capacity.
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge
                  variant={
                    professional.availability === 'available'
                      ? 'success'
                      : professional.availability === 'busy'
                        ? 'warning'
                        : 'outline'
                  }
                >
                  Live status: {professional.availability}
                </Badge>
                <Badge variant="outline">Max bookings / day: {professional.maxBookingsPerDay ?? '—'}</Badge>
                {professional.workingHours?.start && professional.workingHours?.end ? (
                  <Badge variant="outline">
                    Legacy band: {professional.workingHours.start}–{professional.workingHours.end}
                  </Badge>
                ) : null}
              </div>
              {(() => {
                const weekly = normalizeWeeklyAvailability(professional.weeklyAvailability)
                const hasWeekly = PROFESSIONAL_WEEKDAY_KEYS.some((k) => weekly[k].length > 0)
                const legacyLines = scheduleSummaryLines(professional)
                return (
                  <>
                    {!hasWeekly && legacyLines.length > 0 ? (
                      <HubAlert className="mb-2">
                        Weekly grid not saved in the app yet — showing onboarding-style working days / hours only.
                      </HubAlert>
                    ) : null}
                    {!hasWeekly && legacyLines.length === 0 ? (
                      <HubAlert variant="warning" className="mb-2">
                        No calendar data on file. Ask the professional to set availability in the provider app, or edit
                        defaults in admin profile.
                      </HubAlert>
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                      {PROFESSIONAL_WEEKDAY_KEYS.map((k) => (
                        <div key={k} className="rounded-md border border-border p-3">
                          <p className="text-xs text-muted-foreground">{weekdayShortLabel(k)}</p>
                          <p className="mt-1 text-sm">{formatSlotList(weekly[k])}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
          <Card className="md:col-span-3">
            <CardContent className="pt-6">
              <h3 className="text-base font-semibold leading-none">Profile summary</h3>
              <p className="mt-2 text-sm">
                Trades: {(professional.categories || []).map((c) => getProfessionalCategoryLabel(c)).join(', ') || '—'}
              </p>
              {professional.serviceProviderId?.businessName ? (
                <p className="mt-2 text-sm text-muted-foreground">Provider: {professional.serviceProviderId.businessName}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'bookings' && (
        <div>
          {bookingsLoadMeta?.warning ? (
            <HubAlert variant="warning" className="mb-2">
              {bookingsLoadMeta.warning}
            </HubAlert>
          ) : null}
          {bookingsError && <HubAlert variant="warning" className="mb-2">{bookingsError}</HubAlert>}
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hub-booking-status">Status</Label>
              <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                <SelectTrigger id="hub-booking-status" className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hub-date-from">From (ISO date)</Label>
              <Input
                id="hub-date-from"
                className="w-[160px]"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hub-date-to">To (ISO date)</Label>
              <Input
                id="hub-date-to"
                className="w-[160px]"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <Button size="sm" variant="outline" type="button" onClick={() => void loadBookings()}>
              Refresh
            </Button>
          </div>
          {bookingsLoading ? (
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">
                Showing {bookings.length} of {bookingTotal} · Page {bookingPage}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
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
                        <th key={h || 'actions'} className="whitespace-nowrap py-2 pr-4 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => {
                      const bid = bookingRowId(b)
                      const st = (b.status || (b as { status?: string }).status || '—') as string
                      const amt = Number(b.totalAmount ?? (b as { total_amount?: number }).total_amount ?? 0)
                      const pay = b.paymentStatus
                      return (
                        <tr key={bid} className="border-b border-border">
                          <td className="align-top py-2 pr-4">
                            <p className="font-semibold">{b.bookingNumber || bid}</p>
                            <p className="text-xs text-muted-foreground">{b.scheduledTime ? `${b.scheduledTime}` : ''}</p>
                          </td>
                          <td className="min-w-[120px] align-top py-2 pr-4">
                            {customerDisplayName(b)}
                            {b.customerPhone ? <p className="text-xs text-muted-foreground">{b.customerPhone}</p> : null}
                          </td>
                          <td className="max-w-[200px] align-top py-2 pr-4 break-words">
                            {serviceDisplayName(b)}
                          </td>
                          <td className="align-top py-2 pr-4">
                            <Badge>{st}</Badge>
                            <p className="mt-1 text-xs text-muted-foreground">{bookingLifecycleLabel(st)}</p>
                          </td>
                          <td className="align-top py-2 pr-4">
                            {pay ? (
                              <Badge variant="outline">{pay}</Badge>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="whitespace-nowrap align-top py-2 pr-4">
                            {b.scheduledDate ? formatDate(b.scheduledDate) : '—'}
                          </td>
                          <td className="whitespace-nowrap align-top py-2 pr-4">{assignedAtDisplay(b)}</td>
                          <td className="align-top py-2 pr-4">{formatCurrency(amt)}</td>
                          <td className="max-w-[220px] align-top py-2 pr-4">
                            {cancellationText(b)}
                            {b.notes ? <p className="text-xs text-muted-foreground">{b.notes}</p> : null}
                          </td>
                          <td className="align-top py-2">
                            {bid ? (
                              <Button size="sm" variant="link" className="h-auto p-0" asChild>
                                <RouterLink to={`/bookings/${bid}`}>Details</RouterLink>
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bookingPage <= 1}
                  onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bookingPage * bookingLimit >= bookingTotal}
                  onClick={() => setBookingPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div>
          {activityLoading ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" aria-hidden /> : null}
          <p className="mb-4 text-sm text-muted-foreground">
            Timeline uses platform activity when the API returns it, plus milestones derived from loaded bookings (only
            events with real timestamps from the server).
          </p>
          {mergedActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity yet. Open Bookings to load assignments, or check back after new updates.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border p-3 sm:p-4">
              <div className="relative border-l border-border pl-4">
                {mergedActivity.map((row, idx) => (
                  <div key={row.id} className="relative pb-8 pl-2 last:pb-0">
                    <span
                      className={
                        'absolute -left-[9px] top-1.5 h-3 w-3 rounded-full border-2 border-background ring-1 ring-border ' +
                        (row.source === 'platform' ? 'bg-secondary' : 'bg-primary')
                      }
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                      <div className="shrink-0 text-xs text-muted-foreground sm:max-w-[160px] sm:text-sm">
                        <div>{formatDate(row.occurredAt)}</div>
                        <div className="opacity-85">{row.source === 'platform' ? 'Platform' : 'Booking'}</div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                        <p className="text-sm font-semibold leading-snug">{row.title}</p>
                        {row.description ? (
                          <p className="text-sm text-muted-foreground">{row.description}</p>
                        ) : null}
                        {row.bookingId ? (
                          <Button variant="link" className="h-auto p-0 text-sm" asChild>
                            <RouterLink to={`/bookings/${row.bookingId}`}>Open booking</RouterLink>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'earnings' && (
        <div>
          {earningsLoading ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" aria-hidden /> : null}
          <p className="mb-4 text-sm text-muted-foreground">
            Payment rows from finance records linked to this professional or to bookings listed below.
          </p>
          {earningsHint ? <p className="mb-4 text-sm text-muted-foreground">{earningsHint}</p> : null}
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Completed payments (loaded)</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(earningsTotals.completed)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{earningsTotals.count} payment rows</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Completed job value (bookings list)</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(bookingStats.completedRevenue)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sum of completed jobs on the current Bookings page only (not full history).
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center pt-6">
                <Button size="sm" variant="outline" onClick={() => void loadEarnings()} disabled={earningsLoading}>
                  Refresh payments
                </Button>
              </CardContent>
            </Card>
          </div>
          {earningsPayments.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    {['When', 'Status', 'Amount', 'Method', 'Booking', 'Service'].map((h) => (
                      <th key={h} className="py-2 pr-4 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {earningsPayments.map((p) => (
                    <tr key={p.id || `${p.bookingId}-${p.transactionId}`} className="border-b border-border">
                      <td className="align-top py-2 pr-4">
                        {p.completedAt ? formatDate(p.completedAt) : formatDate(p.createdAt)}
                      </td>
                      <td className="align-top py-2 pr-4">
                        <Badge>{p.status}</Badge>
                      </td>
                      <td className="align-top py-2 pr-4">{formatCurrency(Number(p.amount) || 0)}</td>
                      <td className="align-top py-2 pr-4">{p.paymentMethod || '—'}</td>
                      <td className="align-top py-2 pr-4">
                        {p.bookingId ? (
                          <Button size="sm" variant="link" className="h-auto p-0" asChild>
                            <RouterLink to={`/bookings/${p.bookingId}`}>{p.bookingId}</RouterLink>
                          </Button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="align-top py-2">{p.serviceName || p.service || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !earningsLoading ? (
            <HubAlert className="mt-2">No payment records found for this view.</HubAlert>
          ) : null}
        </div>
      )}

      {tab === 'reviews' && (
        <div>
          {reviewsLoading ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" aria-hidden /> : null}
          {reviewsSummary ? (
            <Card className="mb-4">
              <CardContent className="py-4">
                <p className="text-lg font-semibold leading-tight">
                  Average {reviewsSummary.average.toFixed(2)} ★ · {reviewsSummary.count}{' '}
                  {reviewsSummary.count === 1 ? 'review' : 'reviews'} from customers
                </p>
              </CardContent>
            </Card>
          ) : null}
          {!reviewsLoading && reviews.length === 0 ? (
            <HubAlert>No customer reviews for this professional yet.</HubAlert>
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
                <Card key={r._id} className="mb-3">
                  <CardContent>
                    <p className="text-lg font-semibold leading-tight">
                      {r.rating} ★ · {formatDate(r.createdAt)}
                    </p>
                    <p className="mt-1 text-sm">{r.comment || '—'}</p>
                    {serviceCaption ? (
                      <p className="mt-2 block text-xs text-muted-foreground">{serviceCaption}</p>
                    ) : null}
                    {bid ? (
                      <Button size="sm" variant="link" className="mt-2 h-auto p-0" asChild>
                        <RouterLink to={`/bookings/${bid}`}>Open booking</RouterLink>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      {tab === 'documents' && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Same record as the professional mobile app: <strong>KYC uploads</strong> (identity / compliance) and{' '}
            <strong>trade certifications</strong> (skills, optional file). Rows appear only after data exists on the
            server.
          </p>

          <h3 className="mb-2 text-lg font-semibold">Identity &amp; KYC</h3>
          {kycDocuments.length === 0 ? (
            <HubAlert className="mb-6">
              No KYC files yet. They are submitted from the professional app (Documents screen) and stored on this profile.
            </HubAlert>
          ) : (
            <div className="mb-6 space-y-3">
              {kycDocuments.map((doc, index) => (
                <Card key={doc._id ?? `${doc.type}-${index}`}>
                  <CardContent className="py-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-medium">{professionalKycTypeLabel(doc.type)}</span>
                      <Badge variant={doc.isVerified ? 'success' : 'outline'}>
                        {doc.isVerified ? 'Verified' : 'Pending review'}
                      </Badge>
                    </div>
                    {doc.documentNumber ? (
                      <p className="mb-2 text-sm text-muted-foreground">Reference: {doc.documentNumber}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.documentUrl} target="_blank" rel="noreferrer">
                          Open file
                        </a>
                      </Button>
                      {canModerate ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                            disabled={docSavingKey !== null || Boolean(doc.isVerified)}
                            onClick={() => void handleSetKycVerified(index, true)}
                          >
                            {docSavingKey === `kyc-${index}` ? 'Saving…' : 'Mark verified'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-600 text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950"
                            disabled={docSavingKey !== null || !doc.isVerified}
                            onClick={() => void handleSetKycVerified(index, false)}
                          >
                            Clear verification
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <h3 className="mb-2 text-lg font-semibold">Trade certifications</h3>
          {profileDocuments.length === 0 ? (
            <HubAlert>No trade certifications with a title or file on file.</HubAlert>
          ) : (
            profileDocuments.map((c, i) => {
              const days = daysUntilExpiry(c.expiryDate)
              const expired = days != null && days < 0
              const soon = days != null && days >= 0 && days <= 30
              const v = c.verificationStatus
              return (
                <Card key={`${c.certificateUrl ?? ''}-${c.name ?? ''}-${i}`} className="mb-3">
                  <CardContent>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">{c.name?.trim() || 'Uploaded document'}</span>
                      {v ? (
                        <Badge
                          variant={
                            v === 'approved' ? 'success' : v === 'rejected' ? 'destructive' : 'warning'
                          }
                        >
                          Review: {v}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Review: not set</Badge>
                      )}
                      {expired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : null}
                      {!expired && soon ? <Badge variant="warning">Expires in {days}d</Badge> : null}
                    </div>
                    {c.issuedBy?.trim() ? <p className="text-sm">Issued by {c.issuedBy}</p> : null}
                    {c.adminNotes ? (
                      <p className="mt-1 text-sm text-muted-foreground">Admin: {c.adminNotes}</p>
                    ) : null}
                    <p className="mt-1 block text-xs text-muted-foreground">
                      {c.issuedDate ? `Issued ${c.issuedDate}` : ''}{' '}
                      {c.expiryDate ? `· Expires ${c.expiryDate}` : ''}
                    </p>
                    {c.certificateUrl ? (
                      <Button size="sm" variant="outline" className="mt-2" asChild>
                        <a href={c.certificateUrl} target="_blank" rel="noreferrer">
                          Open file
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="mt-2">
                        No file URL
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {tab === 'coverage' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-base font-semibold leading-none">Base address</h3>
              <p className="mt-3 text-sm">
                {professional.address?.street ? `${professional.address.street}, ` : ''}
                {professional.address?.area}, {professional.address?.city}, {professional.address?.state}{' '}
                {professional.address?.pincode}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-base font-semibold leading-none">Service areas</h3>
              {(professional.serviceAreas || []).length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">None listed</p>
              ) : (
                (professional.serviceAreas || []).map((a, idx) => (
                  <div key={`${a.city}-${idx}`} className="mb-3 mt-3 first:mt-0">
                    <p className="font-medium">{a.city}</p>
                    {a.areas?.length ? <p className="text-sm">Areas: {a.areas.join(', ')}</p> : null}
                    {a.pincodes?.length ? <p className="text-sm">Pincodes: {a.pincodes.join(', ')}</p> : null}
                    {a.radius != null ? <p className="text-sm">Radius: {a.radius} km</p> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'conduct' && id && canViewConduct ? (
        <ProfessionalConductPanel professionalIdFixed={id} />
      ) : null}

      {tab === 'moderation' && (
        <div>
          {!canModerate ? (
            <HubAlert variant="warning">You do not have permission to moderate professionals.</HubAlert>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Suspend temporarily, block permanently, or reinstate access. Linked login may be disabled when a user
                account is connected.
              </p>
              <p className="mb-2 text-sm">
                Current: <strong>{accountStatus}</strong>
                {professional.moderationReason ? ` — ${professional.moderationReason}` : ''}
              </p>
              {professional.suspendedUntil ? (
                <p className="mb-4 text-sm text-muted-foreground">
                  Suspended until: {formatDate(professional.suspendedUntil)}
                </p>
              ) : null}
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="border-amber-600 text-amber-800"
                  onClick={() => setSuspendOpen(true)}
                  disabled={modBusy}
                >
                  Suspend
                </Button>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setBlockOpen(true)} disabled={modBusy}>
                  Block
                </Button>
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => setReinstateOpen(true)}
                  disabled={modBusy}
                >
                  Reinstate
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <Dialog
        open={suspendOpen}
        onOpenChange={(open) => {
          if (!open && !modBusy) setSuspendOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend professional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="suspend-reason">Reason (required)</Label>
              <Textarea
                id="suspend-reason"
                autoFocus
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suspend-until">Until (optional, ISO date)</Label>
              <Input
                id="suspend-until"
                value={suspendUntil}
                onChange={(e) => setSuspendUntil(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSuspendOpen(false)} disabled={modBusy}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => void handleSuspendConfirm()}
              disabled={modBusy}
            >
              Confirm suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reinstateOpen}
        onOpenChange={(open) => {
          if (!open && !modBusy) setReinstateOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reinstate professional?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This restores marketplace access (and login when linked). Confirm this account should be active again.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReinstateOpen(false)} disabled={modBusy}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => void performReinstate()}
              disabled={modBusy}
            >
              Confirm reinstate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={blockOpen}
        onOpenChange={(open) => {
          if (!open && !modBusy) setBlockOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Block professional</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="block-reason">Reason (required)</Label>
            <Textarea
              id="block-reason"
              autoFocus
              rows={4}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBlockOpen(false)} disabled={modBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleBlockConfirm()} disabled={modBusy}>
              Confirm block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  )
}
