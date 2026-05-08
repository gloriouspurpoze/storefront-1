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
  Search,
  Filter,
  Eye,
  DollarSign,
  Clock,
  User,
  ClipboardList,
  MoreVertical,
  CheckCircle2,
  XCircle,
  CalendarClock,
  CircleAlert,
  Gavel,
  Loader2,
} from 'lucide-react'
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
  return 'Released to customer'
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

const statDotClass: Record<string, string> = {
  primary: 'bg-primary',
  warning: 'bg-yellow-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
  default: 'bg-muted-foreground',
}

export function Quotes() {
  const { checkPermission } = usePermissions()
  const canReview = checkPermission('approve_quotes')

  const [listTab, setListTab] = useState<'all' | 'review'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      if (listTab === 'review') {
        const res = await QuotesService.getAdminReviewQueue({ page: 1, limit: 100 })
        const payload = res.data as { quotes?: Quote[]; pagination?: { total?: number } }
        setQuotes(Array.isArray(payload?.quotes) ? payload.quotes : [])
        setTotalCount(payload?.pagination?.total ?? (payload?.quotes?.length ?? 0))
      } else {
        const res = await QuotesService.getQuotes({ page: 1, limit: 100 })
        const payload = res.data as { quotes?: Quote[]; pagination?: { total?: number } }
        setQuotes(Array.isArray(payload?.quotes) ? payload.quotes : [])
        setTotalCount(payload?.pagination?.total ?? (payload?.quotes?.length ?? 0))
      }
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load quotes')
      setQuotes([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [listTab])

  useEffect(() => {
    void load()
  }, [load])

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const text = quoteText(quote).toLowerCase()
      const matchesSearch =
        !searchTerm ||
        text.includes(searchTerm.toLowerCase()) ||
        String(quote.amount).includes(searchTerm) ||
        (quote.id && quote.id.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = selectedStatus === 'all' || quote.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [quotes, searchTerm, selectedStatus])

  const quoteStats = useMemo(() => {
    return {
      pending: quotes.filter((q) => q.status === 'pending').length,
      accepted: quotes.filter((q) => q.status === 'accepted').length,
      rejected: quotes.filter((q) => q.status === 'rejected').length,
      expired: quotes.filter((q) => q.status === 'expired').length,
      pendingReview: quotes.filter((q) => q.admin_review_status === 'pending_review').length,
    }
  }, [quotes])

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
    } catch {
      /* toasts from api base */
    } finally {
      setReviewSubmitting(false)
    }
  }

  const StatCard = ({
    title,
    value,
    color = 'primary',
  }: {
    title: string
    value: number
    color?: keyof typeof statDotClass | 'info'
  }) => (
    <Card>
      <CardContent>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              color === 'info' ? 'bg-sky-500' : statDotClass[color] ?? statDotClass.primary,
            )}
          />
          <div>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const QuoteCard = ({ quote }: { quote: Quote }) => {
    const StatusIcon = statusIcons[quote.status]
    const statusVariant = statusBadgeVariant[quote.status]
    const pro = quote.professional
    const proName = pro
      ? [pro.firstName, pro.lastName].filter(Boolean).join(' ') || pro.email || 'Professional'
      : null

    return (
      <Card>
        <CardContent>
          <div className="mb-4 flex justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">Quote #{quote.id.slice(-8).toUpperCase()}</h3>
                <Badge variant={statusVariant} className="gap-1 capitalize">
                  <StatusIcon className="h-3 w-3" />
                  {quote.status}
                </Badge>
                {quote.admin_review_status && (
                  <Badge
                    variant={quote.admin_review_status === 'pending_review' ? 'default' : 'outline'}
                    className="max-w-full text-left font-normal"
                  >
                    {reviewLabel(quote.admin_review_status)}
                  </Badge>
                )}
              </div>
              <p className="mb-2 text-sm text-muted-foreground">{quoteText(quote) || '—'}</p>
              {proName && <p className="block text-xs text-muted-foreground">Pro: {proName}</p>}
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => openDetail(quote)}>
                <Eye className="mr-1 h-4 w-4" />
                View
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openDetail(quote)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium tabular-nums">{formatCurrency(quote.amount)}</p>
                <p className="text-xs text-muted-foreground">Amount</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-medium"
                  title={String(quote.service_request_id ?? quote.serviceRequestId ?? '—')}
                >
                  {quote.booking_id ? `Booking` : 'Request'}{' '}
                  #{(quote.service_request_id ?? quote.booking_id ?? quote.serviceRequestId ?? '—').toString().slice(-8)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {quote.booking_id ? 'Booking / add-on' : 'Service request'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{quote.provider?.businessName ?? '—'}</p>
                <p className="text-xs text-muted-foreground">Company</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {validUntilRaw(quote) ? formatDate(validUntilRaw(quote) as string) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Valid until</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-sm font-medium">
                {quote.customer
                  ? [quote.customer.firstName, quote.customer.lastName].filter(Boolean).join(' ') ||
                    quote.customer.email ||
                    '—'
                  : '—'}
              </p>
            </div>
            <Badge variant="outline">
              {createdRaw(quote) ? formatDate(createdRaw(quote) as string) : '—'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">
            Review professional quotations (photos + notes), approve or reject before the customer can accept.
          </p>
        </div>
        <HStack spacing={2} className="shrink-0">
          <Button
            type="button"
            variant={listTab === 'all' ? 'default' : 'outline'}
            onClick={() => setListTab('all')}
          >
            All quotes
          </Button>
          <Button
            type="button"
            variant={listTab === 'review' ? 'default' : 'outline'}
            className={listTab === 'review' ? 'bg-amber-600 hover:bg-amber-600/90' : ''}
            onClick={() => setListTab('review')}
          >
            <Gavel className="mr-2 h-4 w-4" />
            Review queue
          </Button>
        </HStack>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={listTab === 'review' ? 'col-span-2 sm:col-span-1' : ''}>
          <StatCard title="Pending (customer)" value={quoteStats.pending} color="warning" />
        </div>
        <div className={listTab === 'review' ? 'col-span-2 sm:col-span-1' : ''}>
          <StatCard title="Accepted" value={quoteStats.accepted} color="success" />
        </div>
        <div className={listTab === 'review' ? 'col-span-2 sm:col-span-1' : ''}>
          <StatCard title="Rejected" value={quoteStats.rejected} color="error" />
        </div>
        {listTab === 'all' ? (
          <div>
            <StatCard title="Expired" value={quoteStats.expired} color="default" />
          </div>
        ) : (
          <div className="col-span-2 lg:col-span-1">
            <Card className="border-dashed">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">
                  Queue total (server): <strong>{totalCount}</strong> · In this page sample awaiting review:{' '}
                  <strong>{quoteStats.pendingReview}</strong>
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search quotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Job status</label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full"
                onClick={() => void load()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loadError && <p className="mb-4 text-sm text-destructive">{loadError}</p>}

      {loading && !quotes.length ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading quotes…
        </div>
      ) : filteredQuotes.length > 0 ? (
        <VStack spacing={4}>
          {filteredQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </VStack>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <DollarSign className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">No quotes found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || selectedStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : listTab === 'review'
                  ? 'Nothing is waiting for platform review.'
                  : 'Quotes will appear when providers or professionals submit them.'}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={detailOpen}
        onOpenChange={(o) => {
          if (!reviewSubmitting) setDetailOpen(o)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              Quote detail
              {detailQuote?.admin_review_status === 'pending_review' && (
                <Badge variant="warning" className="font-normal">
                  Needs your decision
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailQuote && (
            <VStack spacing={4} className="py-2">
              <p className="text-sm text-muted-foreground">ID: {detailQuote.id}</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(detailQuote.amount)}</p>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scope / description</p>
                <p className="mt-1 whitespace-pre-wrap">{detailQuote.description || '—'}</p>
              </div>
              {detailQuote.notes ? (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Additional notes</p>
                  <p className="mt-1 text-sm">{detailQuote.notes}</p>
                </div>
              ) : null}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workflow</p>
                <Badge variant="outline" className="mt-1">
                  {reviewLabel(detailQuote.admin_review_status)}
                </Badge>
              </div>
              {detailQuote.professional && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Professional</p>
                  <p className="text-sm">
                    {[detailQuote.professional.firstName, detailQuote.professional.lastName]
                      .filter(Boolean)
                      .join(' ') || detailQuote.professional.email}
                  </p>
                  {detailQuote.professional.categories?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {detailQuote.professional.categories.map((c) => (
                        <Badge key={c} variant="secondary" className="font-normal">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
              {(detailQuote.attachment_urls?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Photos & attachments</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(detailQuote.attachment_urls ?? []).map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-md border border-border"
                      >
                        <img src={url} alt="" className="h-[120px] w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {canReview && detailQuote.admin_review_status === 'pending_review' && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Internal note (optional)</label>
                  <Textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Reason for rejection or approval context (visible in audit)"
                    rows={3}
                  />
                </div>
              )}
              {detailQuote.admin_review_note && (
                <p className="text-sm text-muted-foreground">
                  Last review note: {detailQuote.admin_review_note}
                </p>
              )}
            </VStack>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
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
                  Approve
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
