import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
  Separator,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  HStack,
  VStack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '../../components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import {
  Search,
  Eye,
  DollarSign,
  User,
  ClipboardList,
  MoreVertical,
  CheckCircle2,
  XCircle,
  CalendarClock,
  CircleAlert,
  Gavel,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Building2,
  ExternalLink,
  FileText,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn, formatCurrency, formatDate, getInitials } from '../../lib/utils'
import { QuotesService } from '../../services/api/quotes.service'
import type { Quote, QuoteAdminReviewStatus } from '../../types'
import { usePermissions } from '../../hooks/usePermissions'

const statusBadgeVariant = {
  pending: 'warning' as const,
  accepted: 'success' as const,
  rejected: 'destructive' as const,
  expired: 'secondary' as const,
}

const statusIcons = {
  pending: CircleAlert,
  accepted: CheckCircle2,
  rejected: XCircle,
  expired: CalendarClock,
} as const

const reviewLabel = (s: QuoteAdminReviewStatus | undefined) => {
  if (s === 'pending_review') return 'Awaiting platform review'
  if (s === 'rejected') return 'Platform rejected'
  if (s === 'approved') return 'Platform approved'
  return 'With customer'
}

function quoteText(q: Quote) {
  return (q.description || q.notes || '').trim()
}

function validUntilRaw(q: Quote) {
  return q.valid_until ?? q.validUntil
}

function createdRaw(q: Quote) {
  return q.created_at ?? q.createdAt
}

function updatedRaw(q: Quote) {
  return q.updated_at ?? q.updatedAt
}

function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function safeAmount(q: Quote): number {
  const n = Number(q.amount)
  return Number.isFinite(n) ? n : 0
}

function bookingLinkId(q: Quote): string | null {
  const id = q.booking_id
  if (id && String(id).trim()) return String(id)
  return null
}

function serviceRequestLinkId(q: Quote): string | null {
  const id = q.service_request_id ?? q.serviceRequestId
  if (id && String(id).trim()) return String(id)
  return null
}

function professionalName(q: Quote): string | null {
  const pro = q.professional
  if (!pro) return null
  const n = [pro.firstName, pro.lastName].filter(Boolean).join(' ').trim()
  return n || pro.email || null
}

function customerName(q: Quote): string {
  const c = q.customer
  if (!c) return '—'
  const n = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
  return n || c.email || c.phone || '—'
}

function shortId(id: string | undefined | null, len = 8): string {
  if (!id) return '—'
  const s = String(id).replace(/\s/g, '')
  if (s.length <= len) return s.toUpperCase()
  return s.slice(-len).toUpperCase()
}

type SortKey = 'created' | 'amount' | 'validUntil' | 'status'

function parsePayload(
  res: {
    data: unknown
    meta?: { pagination?: { page?: number; limit?: number; total?: number; totalPages?: number } }
  },
  fallbackLimit: number,
) {
  const root = res.data as Record<string, unknown> | null
  const quotesRaw = root?.quotes
  const list = Array.isArray(quotesRaw) ? (quotesRaw as Quote[]) : []
  const pag =
    (root?.pagination as { total?: number; totalPages?: number; page?: number; limit?: number } | undefined) ??
    res.meta?.pagination
  const total = typeof pag?.total === 'number' ? pag.total : list.length
  const limit =
    typeof pag?.limit === 'number' && pag.limit > 0 ? pag.limit : fallbackLimit > 0 ? fallbackLimit : 25
  const totalPages =
    typeof pag?.totalPages === 'number' && pag.totalPages > 0
      ? pag.totalPages
      : Math.max(1, Math.ceil(total / limit))
  return { quotes: list, total, totalPages }
}

export function Quotes() {
  const { toast } = useToast()
  const { checkPermission } = usePermissions()
  const canReview = checkPermission('approve_quotes')

  const [listTab, setListTab] = useState<'all' | 'review'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [quoteKindFilter, setQuoteKindFilter] = useState<'all' | 'catalog' | 'custom'>('all')
  const [adminReviewFilter, setAdminReviewFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected' | 'cleared'>(
    'all',
  )
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const pageSize = 25

  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      if (listTab === 'review') {
        const res = await QuotesService.getAdminReviewQueue({ page, limit: pageSize })
        const { quotes: list, total, totalPages: tp } = parsePayload(res, pageSize)
        setQuotes(list)
        setTotalCount(total)
        setTotalPages(tp)
      } else {
        const res = await QuotesService.getQuotes({
          page,
          limit: pageSize,
          ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
        })
        const { quotes: list, total, totalPages: tp } = parsePayload(res, pageSize)
        setQuotes(list)
        setTotalCount(total)
        setTotalPages(tp)
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : null
      setLoadError(msg || 'Failed to load quotes')
      setQuotes([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [listTab, page, pageSize, selectedStatus])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [listTab, selectedStatus])

  const filteredQuotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return quotes.filter((quote) => {
      const text = quoteText(quote).toLowerCase()
      const pro = professionalName(quote)?.toLowerCase() ?? ''
      const cust = customerName(quote).toLowerCase()
      const email = quote.customer?.email?.toLowerCase() ?? ''
      const bid = bookingLinkId(quote)?.toLowerCase() ?? ''
      const sr = serviceRequestLinkId(quote)?.toLowerCase() ?? ''
      const matchesSearch =
        !term ||
        text.includes(term) ||
        String(quote.amount).includes(term) ||
        quote.id.toLowerCase().includes(term) ||
        pro.includes(term) ||
        cust.includes(term) ||
        email.includes(term) ||
        bid.includes(term) ||
        sr.includes(term) ||
        (quote.provider?.businessName ?? '').toLowerCase().includes(term)

      const ar = quote.admin_review_status
      const matchesAdmin =
        adminReviewFilter === 'all' ||
        (adminReviewFilter === 'pending_review' && ar === 'pending_review') ||
        (adminReviewFilter === 'approved' && ar === 'approved') ||
        (adminReviewFilter === 'rejected' && ar === 'rejected') ||
        (adminReviewFilter === 'cleared' && ar == null)

      const kindOk =
        quoteKindFilter === 'all'
          ? true
          : quoteKindFilter === 'catalog'
            ? quote.quote_kind === 'catalog'
            : quote.quote_kind === 'custom'

      return matchesSearch && kindOk && matchesAdmin
    })
  }, [quotes, searchTerm, quoteKindFilter, adminReviewFilter])

  const sortedQuotes = useMemo(() => {
    const list = [...filteredQuotes]
    const dir = sortDir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      if (sortKey === 'amount') return (safeAmount(a) - safeAmount(b)) * dir
      if (sortKey === 'status') return String(a.status).localeCompare(String(b.status)) * dir
      if (sortKey === 'validUntil') {
        const ta = validUntilRaw(a) ? new Date(validUntilRaw(a) as string).getTime() : 0
        const tb = validUntilRaw(b) ? new Date(validUntilRaw(b) as string).getTime() : 0
        return (ta - tb) * dir
      }
      const ca = createdRaw(a) ? new Date(createdRaw(a) as string).getTime() : 0
      const cb = createdRaw(b) ? new Date(createdRaw(b) as string).getTime() : 0
      return (ca - cb) * dir
    })
    return list
  }, [filteredQuotes, sortKey, sortDir])

  const quoteStats = useMemo(() => {
    return {
      pending: quotes.filter((q) => q.status === 'pending').length,
      accepted: quotes.filter((q) => q.status === 'accepted').length,
      rejected: quotes.filter((q) => q.status === 'rejected').length,
      expired: quotes.filter((q) => q.status === 'expired').length,
      pendingReview: quotes.filter((q) => q.admin_review_status === 'pending_review').length,
      pageValue: quotes.reduce((s, q) => s + (q.status === 'pending' ? safeAmount(q) : 0), 0),
    }
  }, [quotes])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'amount' ? 'desc' : 'desc')
    }
  }

  const openDetail = (q: Quote) => {
    setDetailQuote(q)
    setReviewNote('')
    setDetailOpen(true)
  }

  const runAdminReview = async (action: 'approve' | 'reject') => {
    if (!detailQuote) return
    setReviewSubmitting(true)
    try {
      await QuotesService.adminReviewQuote(detailQuote.id, action, reviewNote)
      setDetailOpen(false)
      setDetailQuote(null)
      await load()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Review failed.'
      toast({ title: 'Could not update quote', description: msg, variant: 'destructive' })
    } finally {
      setReviewSubmitting(false)
    }
  }

  const StatTile = ({
    label,
    value,
    hint,
    accent,
  }: {
    label: string
    value: string | number
    hint?: string
    accent?: 'default' | 'warning' | 'success' | 'danger' | 'info'
  }) => {
    const bar =
      accent === 'warning'
        ? 'bg-amber-500'
        : accent === 'success'
          ? 'bg-emerald-500'
          : accent === 'danger'
            ? 'bg-red-500'
            : accent === 'info'
              ? 'bg-sky-500'
              : 'bg-primary'
    return (
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardContent className="p-4">
          <div className={cn('mb-3 h-1 w-10 rounded-full', bar)} />
          <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
        </CardContent>
      </Card>
    )
  }

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead className="whitespace-nowrap">
      <button
        type="button"
        className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary"
        onClick={() => toggleSort(k)}
      >
        {label}
        <ArrowUpDown className={cn('h-3.5 w-3.5', sortKey === k ? 'opacity-100' : 'opacity-40')} />
      </button>
    </TableHead>
  )

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
              <Badge variant="secondary" className="font-normal">
                Operations
              </Badge>
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Add-on and job quotes from professionals and providers. Catalog quotes usually reach the customer
              immediately; custom quotes may sit in the platform review queue until you approve or reject them.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={listTab} onValueChange={(v) => setListTab(v as 'all' | 'review')} className="w-full">
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2 p-1">
            <TabsTrigger value="all" className="gap-2 py-2.5">
              <FileText className="h-4 w-4" />
              All quotes
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-2 py-2.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Gavel className="h-4 w-4" />
              Review queue
              {quoteStats.pendingReview > 0 ? (
                <Badge variant="secondary" className="ml-1 rounded-sm px-1.5 py-0 text-[10px]">
                  {quoteStats.pendingReview}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile
            label="Pending (customer)"
            value={quoteStats.pending}
            hint="On this page"
            accent="warning"
          />
          <StatTile label="Accepted" value={quoteStats.accepted} hint="On this page" accent="success" />
          <StatTile label="Rejected" value={quoteStats.rejected} hint="On this page" accent="danger" />
          <StatTile label="Expired" value={quoteStats.expired} hint="On this page" accent="default" />
          <StatTile
            label="Pipeline (pending ₹)"
            value={formatCurrency(quoteStats.pageValue)}
            hint="Sum of pending amounts on this page"
            accent="info"
          />
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-4">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="ID, amount, customer, pro, company, booking…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {listTab === 'all' ? (
                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Customer status</label>
                  <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="lg:col-span-2 text-sm text-muted-foreground">
                  <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2">
                    Queue is filtered by the server for items awaiting platform review. Use search to narrow this
                    page.
                  </p>
                </div>
              )}
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Quote kind</label>
                <Select value={quoteKindFilter} onValueChange={(v) => setQuoteKindFilter(v as typeof quoteKindFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All kinds</SelectItem>
                    <SelectItem value="catalog">Catalog</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Platform review</label>
                <Select
                  value={adminReviewFilter}
                  onValueChange={(v) => setAdminReviewFilter(v as typeof adminReviewFilter)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending_review">Awaiting review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cleared">No gate (not set)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2 lg:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Page <span className="font-mono font-medium text-foreground">{page}</span> of{' '}
                  <span className="font-mono font-medium text-foreground">{totalPages}</span>
                  <span className="mx-1">·</span>
                  <span className="font-medium text-foreground">{totalCount}</span> total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loadError ? (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        ) : null}

        <Card className="overflow-hidden border-border/80 shadow-sm">
          <div className="border-b bg-muted/30 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>
                  Showing <strong className="text-foreground">{sortedQuotes.length}</strong> of{' '}
                  <strong className="text-foreground">{quotes.length}</strong> rows on this page (after local filters).
                </span>
              </div>
              <HStack spacing={2}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </HStack>
            </div>
          </div>
          {loading && !quotes.length ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading quotes…
            </div>
          ) : sortedQuotes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px] font-semibold">Quote</TableHead>
                  <SortHead label="Amount" k="amount" />
                  <TableHead className="font-semibold">Kind</TableHead>
                  <TableHead className="font-semibold">Review</TableHead>
                  <SortHead label="Status" k="status" />
                  <TableHead className="font-semibold">Professional</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Job link</TableHead>
                  <SortHead label="Valid until" k="validUntil" />
                  <SortHead label="Created" k="created" />
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedQuotes.map((quote) => {
                  const StatusIcon = statusIcons[quote.status]
                  const bid = bookingLinkId(quote)
                  const srid = serviceRequestLinkId(quote)
                  const pro = professionalName(quote)
                  const initials = getInitials(pro || quote.provider?.businessName || '?')
                  return (
                    <TableRow key={quote.id} className="group">
                      <TableCell className="align-top font-mono text-xs font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">{shortId(quote.id)}</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-sm font-mono text-xs">
                            {quote.id}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="align-top tabular-nums font-semibold">{formatCurrency(safeAmount(quote))}</TableCell>
                      <TableCell className="align-top">
                        {quote.quote_kind ? (
                          <Badge variant="secondary" className="capitalize">
                            {quote.quote_kind}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-xs">
                        <Badge
                          variant={quote.admin_review_status === 'pending_review' ? 'default' : 'outline'}
                          className="max-w-[160px] whitespace-normal text-left font-normal leading-snug"
                        >
                          {reviewLabel(quote.admin_review_status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant={statusBadgeVariant[quote.status]} className="mb-1 gap-1 capitalize">
                          <StatusIcon className="h-3 w-3" />
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px] align-top">
                        <div className="flex items-start gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium leading-tight">{pro ?? '—'}</p>
                            {quote.professional?.email ? (
                              <p className="truncate text-xs text-muted-foreground">{quote.professional.email}</p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] align-top">
                        <p className="truncate text-sm font-medium">{customerName(quote)}</p>
                        {quote.customer?.email ? (
                          <p className="truncate text-xs text-muted-foreground">{quote.customer.email}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[200px] align-top text-xs">
                        {bid ? (
                          <Link
                            to={`/bookings/${bid}`}
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            Booking {shortId(bid, 6)}
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </Link>
                        ) : srid ? (
                          <span className="text-muted-foreground" title={srid}>
                            Request {shortId(srid, 6)}
                          </span>
                        ) : (
                          '—'
                        )}
                        {quote.provider?.businessName ? (
                          <p className="mt-1 flex items-center gap-1 truncate text-muted-foreground">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {quote.provider.businessName}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-top text-xs text-muted-foreground">
                        {validUntilRaw(quote) ? formatDate(validUntilRaw(quote) as string) : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-top text-xs text-muted-foreground">
                        {createdRaw(quote) ? formatDate(createdRaw(quote) as string) : '—'}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(quote)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            {bid ? (
                              <DropdownMenuItem asChild>
                                <Link to={`/bookings/${bid}`} className="flex cursor-pointer items-center">
                                  <ClipboardList className="mr-2 h-4 w-4" />
                                  Open booking
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                            {quote.professional?.professionalId ? (
                              <DropdownMenuItem asChild>
                                <Link
                                  to={`/professionals/${quote.professional.professionalId}`}
                                  className="flex cursor-pointer items-center"
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  Professional profile
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <CardContent className="py-16 text-center">
              <DollarSign className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No quotes match</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {searchTerm || quoteKindFilter !== 'all' || adminReviewFilter !== 'all' || selectedStatus !== 'all'
                  ? 'Try clearing filters or search keywords.'
                  : listTab === 'review'
                    ? 'Nothing is waiting for platform review on this page.'
                    : 'Quotes will appear when professionals submit them from the provider app.'}
              </p>
            </CardContent>
          )}
        </Card>

        <Dialog
          open={detailOpen}
          onOpenChange={(o) => {
            if (!reviewSubmitting) setDetailOpen(o)
          }}
        >
          <DialogContent className="max-h-[92vh] max-w-3xl gap-0 overflow-hidden p-0">
            <div className="border-b bg-muted/40 px-6 py-4">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="flex flex-wrap items-center gap-2 text-xl">
                  Quote detail
                  {detailQuote?.admin_review_status === 'pending_review' && (
                    <Badge variant="warning" className="font-normal">
                      Needs your decision
                    </Badge>
                  )}
                </DialogTitle>
                {detailQuote ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {detailQuote.id}
                  </p>
                ) : null}
              </DialogHeader>
            </div>
            {detailQuote && (
              <div className="max-h-[calc(92vh-8rem)] overflow-y-auto px-6 py-5">
                <div className="grid gap-6 lg:grid-cols-5">
                  <div className="space-y-4 lg:col-span-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount</p>
                      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
                        {formatCurrency(safeAmount(detailQuote))}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusBadgeVariant[detailQuote.status]} className="gap-1 capitalize">
                        {React.createElement(statusIcons[detailQuote.status], { className: 'h-3.5 w-3.5' })}
                        {detailQuote.status}
                      </Badge>
                      {detailQuote.quote_kind ? (
                        <Badge variant="secondary" className="capitalize">
                          {detailQuote.quote_kind}
                        </Badge>
                      ) : null}
                      <Badge variant="outline" className="font-normal">
                        {reviewLabel(detailQuote.admin_review_status)}
                      </Badge>
                    </div>
                    <Separator />
                    <dl className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Created</dt>
                        <dd className="font-medium">{formatDateTime(createdRaw(detailQuote))}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Last updated</dt>
                        <dd className="font-medium">{formatDateTime(updatedRaw(detailQuote))}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Valid until</dt>
                        <dd className="font-medium">{formatDateTime(validUntilRaw(detailQuote))}</dd>
                      </div>
                      {detailQuote.estimated_duration != null ? (
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground">Est. duration</dt>
                          <dd className="font-medium">{detailQuote.estimated_duration} min</dd>
                        </div>
                      ) : null}
                      {detailQuote.admin_reviewed_at ? (
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground">Reviewed at</dt>
                          <dd className="font-medium">{formatDateTime(detailQuote.admin_reviewed_at)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                  <div className="space-y-4 lg:col-span-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Scope</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                        {detailQuote.description?.trim() || '—'}
                      </p>
                    </div>
                    {detailQuote.notes ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{detailQuote.notes}</p>
                      </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs font-medium text-muted-foreground">Customer</p>
                        <p className="mt-1 text-sm font-semibold">{customerName(detailQuote)}</p>
                        {detailQuote.customer?.email ? (
                          <p className="text-xs text-muted-foreground">{detailQuote.customer.email}</p>
                        ) : null}
                        {detailQuote.customer?.phone ? (
                          <p className="text-xs text-muted-foreground">{detailQuote.customer.phone}</p>
                        ) : null}
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs font-medium text-muted-foreground">Professional</p>
                        <p className="mt-1 text-sm font-semibold">{professionalName(detailQuote) ?? '—'}</p>
                        {detailQuote.professional?.professionalId ? (
                          <Link
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            to={`/professionals/${detailQuote.professional.professionalId}`}
                          >
                            Open profile <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    {bookingLinkId(detailQuote) ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/bookings/${bookingLinkId(detailQuote)}`}>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Open linked booking
                        </Link>
                      </Button>
                    ) : null}
                    {(detailQuote.attachment_urls?.length ?? 0) > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Photos & attachments
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {(detailQuote.attachment_urls ?? []).map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-md border border-border"
                            >
                              <img src={url} alt="" className="h-[120px] w-full object-cover" loading="lazy" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {canReview && detailQuote.admin_review_status === 'pending_review' && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Internal note (optional)</label>
                        <Textarea
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Reason for rejection or context for approval (audit trail)"
                          rows={3}
                        />
                      </div>
                    )}
                    {detailQuote.admin_review_note ? (
                      <p className="rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Last review note:</span> {detailQuote.admin_review_note}
                      </p>
                    ) : null}
                    {detailQuote.status === 'rejected' &&
                      (detailQuote.customer_rejection_reason || '').trim().length > 0 && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                          <p className="text-xs font-medium text-destructive">Customer decline reason</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{detailQuote.customer_rejection_reason}</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="border-t bg-muted/20 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setDetailOpen(false)} disabled={reviewSubmitting}>
                Close
              </Button>
              {canReview && detailQuote?.admin_review_status === 'pending_review' ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    disabled={reviewSubmitting}
                    onClick={() => runAdminReview('reject')}
                  >
                    Reject
                  </Button>
                  <Button type="button" disabled={reviewSubmitting} onClick={() => runAdminReview('approve')}>
                    {reviewSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Approve
                  </Button>
                </>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
