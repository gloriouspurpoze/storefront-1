import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  ExternalLink,
  Inbox,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  User,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Separator } from '../../components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { useToast } from '../../components/ui'
import { usePermissions } from '../../hooks/usePermissions'
import {
  SupportTicketsService,
  SupportTicketDetail,
  SupportTicketInternalNote,
  SupportTicketMessage,
  SupportTicketRow,
  SupportTicketsPagination,
  SupportStats,
} from '../../services/api/supportTickets.service'
import { usersService } from '../../services/api/users.service'
import { cn } from '../../lib/utils'
import { formatMoney } from '../../lib/financeFormat'

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed', 'cancelled'] as const
const CATEGORIES = ['', 'technical', 'billing', 'account', 'service', 'other'] as const
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'] as const
const USER_TYPES = ['', 'customer', 'provider', 'professional'] as const

function label(v: string): string {
  return v ? v.replace(/_/g, ' ') : 'Any'
}

function userLine(t: SupportTicketRow): string {
  const u = t.userId
  if (!u) return '—'
  const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
  return name ? `${name} · ${u.email ?? ''}` : u.email ?? '—'
}

function assignedUserSelectValue(detail: SupportTicketDetail): string {
  const a = detail.assignedTo
  if (!a) return '__none__'
  if (typeof a === 'string') return a
  if (a._id) return String(a._id)
  return '__none__'
}

function senderLabel(m: SupportTicketMessage): string {
  if (m.senderType === 'system') return 'System'
  if (m.senderType === 'admin') return 'Agent'
  const s = m.senderId
  if (s && typeof s === 'object') {
    const n = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()
    return n || s.email || 'User'
  }
  return 'User'
}

function internalAuthorLabel(n: SupportTicketInternalNote): string {
  const s = n.authorId
  if (s && typeof s === 'object') {
    const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()
    return name || s.email || 'Agent'
  }
  return 'Agent'
}

function slaSummary(detail: SupportTicketDetail): string | null {
  if (!detail.slaDueAt) return null
  const due = new Date(detail.slaDueAt)
  const terminal = detail.status === 'closed' || detail.status === 'cancelled' || detail.status === 'resolved'
  const late = !terminal && Date.now() > due.getTime()
  const fr = detail.firstResponseAt ? ` · First reply ${new Date(detail.firstResponseAt).toLocaleString()}` : ''
  return `${late ? 'Overdue · ' : ''}SLA due ${due.toLocaleString()}${fr}`
}

function statusBadgeVariant(s: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'open') return 'default'
  if (s === 'in_progress') return 'secondary'
  if (s === 'resolved') return 'outline'
  if (s === 'closed' || s === 'cancelled') return 'outline'
  return 'secondary'
}

function countByStatus(stats: SupportStats | null, status: string): number {
  if (!stats?.byStatus) return 0
  const row = stats.byStatus.find((x) => x._id === status)
  return row?.count ?? 0
}

export default function SupportTicketsQueuePage() {
  const { toast } = useToast()
  const { checkPermission } = usePermissions()
  const canAgent = checkPermission('send_messages')
  const canRefund = checkPermission('refund_payments')

  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('ticket')?.trim() || null

  const setSelectedId = useCallback(
    (id: string | null) => {
      if (id) setSearchParams({ ticket: id }, { replace: true })
      else setSearchParams({}, { replace: true })
    },
    [setSearchParams],
  )

  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<SupportTicketRow[]>([])
  const [pagination, setPagination] = useState<SupportTicketsPagination | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [stats, setStats] = useState<SupportStats | null>(null)

  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterUserType, setFilterUserType] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [refundOnly, setRefundOnly] = useState(false)

  const [detail, setDetail] = useState<SupportTicketDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [workflowSaving, setWorkflowSaving] = useState(false)
  const [closeSaving, setCloseSaving] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveAmount, setApproveAmount] = useState('')
  const [approveNote, setApproveNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [refundActing, setRefundActing] = useState(false)

  const [assignMembers, setAssignMembers] = useState<
    Array<{ id: string; firstName?: string; lastName?: string; email?: string }>
  >([])
  const [internalNoteText, setInternalNoteText] = useState('')
  const [internalNoteSaving, setInternalNoteSaving] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterCategory, filterPriority, filterUserType, debouncedSearch, refundOnly])

  const loadStats = useCallback(async () => {
    try {
      const res = await SupportTicketsService.getStats()
      if (res.success && res.data && typeof res.data === 'object') {
        setStats(res.data as SupportStats)
      }
    } catch {
      setStats(null)
    }
  }, [])

  const loadList = useCallback(
    async (p: number) => {
      try {
        setListLoading(true)
        setListError(null)
        const res = await SupportTicketsService.listTicketQueue({
          page: p,
          limit: 40,
          ...(filterStatus ? { status: filterStatus } : {}),
          ...(filterCategory ? { category: filterCategory } : {}),
          ...(filterPriority ? { priority: filterPriority } : {}),
          ...(filterUserType ? { userType: filterUserType } : {}),
          ...(debouncedSearch.length >= 2 ? { search: debouncedSearch } : {}),
          ...(refundOnly ? { hasRefund: true, refundStatus: 'pending' } : {}),
        })
        if (res.success && res.data && typeof res.data === 'object') {
          const d = res.data as { tickets?: SupportTicketRow[]; pagination?: SupportTicketsPagination }
          setRows(Array.isArray(d.tickets) ? d.tickets : [])
          setPagination(d.pagination ?? null)
          setPage(p)
        } else {
          setRows([])
          setPagination(null)
        }
      } catch (e: unknown) {
        setListError(e instanceof Error ? e.message : 'Failed to load tickets')
        setRows([])
      } finally {
        setListLoading(false)
      }
    },
    [filterStatus, filterCategory, filterPriority, filterUserType, debouncedSearch, refundOnly],
  )

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    if (!canAgent) return
    void usersService.getUsers({ scope: 'members', limit: 20, page: 1 }).then((res) => {
      setAssignMembers(res.users.map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email })))
    })
  }, [canAgent])

  useEffect(() => {
    void loadList(page)
  }, [loadList, page])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setSheetOpen(false)
      return
    }
    let cancelled = false
    void (async () => {
      setDetailLoading(true)
      try {
        const res = await SupportTicketsService.getTicket(selectedId)
        if (cancelled) return
        if (res.success && res.data) {
          setDetail(res.data as SupportTicketDetail)
        } else {
          setDetail(null)
          toast({ variant: 'destructive', title: 'Ticket not found' })
        }
      } catch (e) {
        if (!cancelled) {
          setDetail(null)
          toast({
            variant: 'destructive',
            title: 'Could not load ticket',
            description: e instanceof Error ? e.message : undefined,
          })
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId, toast])

  const openTicket = useCallback(
    (id: string) => {
      setSelectedId(id)
      setSheetOpen(true)
      setReplyText('')
    },
    [setSelectedId],
  )

  const refreshAll = useCallback(async () => {
    await loadStats()
    await loadList(page)
    if (selectedId) {
      try {
        const res = await SupportTicketsService.getTicket(selectedId)
        if (res.success && res.data) setDetail(res.data as SupportTicketDetail)
      } catch {
        /* ignore */
      }
    }
  }, [loadStats, loadList, page, selectedId])

  const sortedMessages = useMemo(() => {
    const m = detail?.messages
    if (!Array.isArray(m)) return []
    return [...m].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [detail?.messages])

  const refundPending =
    detail?.refundRequest?.status === 'pending' ||
    (detail?.refundRequest as { status?: string } | undefined)?.status === 'pending'

  const bookingIdForLink = useMemo(() => {
    const rr = detail?.refundRequest as { bookingId?: string | { _id?: string } } | undefined
    if (!rr?.bookingId) return null
    if (typeof rr.bookingId === 'object' && rr.bookingId._id) return String(rr.bookingId._id)
    if (typeof rr.bookingId === 'string') return rr.bookingId
    return null
  }, [detail?.refundRequest])

  const refetchDetail = async (id: string) => {
    const res = await SupportTicketsService.getTicket(id)
    if (res.success && res.data) setDetail(res.data as SupportTicketDetail)
  }

  const handleReply = async () => {
    if (!detail || !replyText.trim() || !canAgent) return
    setReplySending(true)
    try {
      const res = await SupportTicketsService.replyToTicket(detail._id, { message: replyText.trim() })
      if (res.success) {
        setReplyText('')
        await refetchDetail(detail._id)
        toast({ title: 'Reply sent' })
        void loadList(page)
        void loadStats()
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Reply failed',
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setReplySending(false)
    }
  }

  const handleAssignChange = async (userId: string) => {
    if (!detail || !canAgent) return
    setWorkflowSaving(true)
    try {
      const assignedTo = userId === '__none__' ? null : userId
      const res = await SupportTicketsService.updateTicket(detail._id, { assignedTo })
      if (res.success && res.data) {
        setDetail(res.data as SupportTicketDetail)
        void loadList(page)
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Assignment failed',
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setWorkflowSaving(false)
    }
  }

  const submitInternalNote = async () => {
    if (!detail || !canAgent || !internalNoteText.trim()) return
    setInternalNoteSaving(true)
    try {
      const res = await SupportTicketsService.appendInternalNote(detail._id, { message: internalNoteText.trim() })
      if (res.success && res.data) {
        setDetail(res.data as SupportTicketDetail)
        setInternalNoteText('')
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not save internal note',
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setInternalNoteSaving(false)
    }
  }

  const handleWorkflowPatch = async (patch: {
    status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }) => {
    if (!detail || !canAgent) return
    setWorkflowSaving(true)
    try {
      const res = await SupportTicketsService.updateTicket(detail._id, patch)
      if (res.success) {
        await refetchDetail(detail._id)
        void loadList(page)
        void loadStats()
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setWorkflowSaving(false)
    }
  }

  const handleClose = async () => {
    if (!detail || !canAgent) return
    setCloseSaving(true)
    try {
      const res = await SupportTicketsService.closeTicket(detail._id)
      if (res.success) {
        await refetchDetail(detail._id)
        void loadList(page)
        void loadStats()
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Close failed',
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setCloseSaving(false)
    }
  }

  const submitApprove = async () => {
    if (!detail || !canRefund) return
    setRefundActing(true)
    try {
      const amt = approveAmount.trim() ? Number(approveAmount) : undefined
      await SupportTicketsService.approveRefund(detail._id, {
        adminNote: approveNote.trim() || undefined,
        ...(amt != null && amt > 0 ? { amount: amt } : {}),
      })
      setApproveOpen(false)
      setApproveAmount('')
      setApproveNote('')
      await refreshAll()
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Approve failed',
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setRefundActing(false)
    }
  }

  const submitReject = async () => {
    if (!detail || !canRefund) return
    const reason = rejectReason.trim()
    if (!reason) {
      toast({ variant: 'destructive', title: 'Rejection reason required' })
      return
    }
    setRefundActing(true)
    try {
      await SupportTicketsService.rejectRefund(detail._id, {
        rejectionReason: reason,
        adminNote: rejectNote.trim() || undefined,
      })
      setRejectOpen(false)
      setRejectReason('')
      setRejectNote('')
      await refreshAll()
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Reject failed',
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setRefundActing(false)
    }
  }

  const detailPanel = (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      {!selectedId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
          <Inbox className="h-12 w-12 opacity-40" aria-hidden />
          <p className="text-sm">Select a ticket to view the thread, SLA hints, and refund tools.</p>
        </div>
      ) : detailLoading ? (
        <div className="flex flex-1 items-center justify-center p-12">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : !detail ? (
        <div className="p-6 text-sm text-destructive">Ticket could not be loaded.</div>
      ) : (
        <>
          <div className="space-y-3 overflow-y-auto px-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg font-semibold">{detail.ticketNumber}</span>
                  <Badge variant={statusBadgeVariant(detail.status)}>{detail.status.replace(/_/g, ' ')}</Badge>
                  <Badge variant="outline">{detail.category}</Badge>
                  {detail.priority ? <Badge variant="secondary">{detail.priority}</Badge> : null}
                  {detail.userType ? (
                    <Badge variant="outline" className="capitalize">
                      {detail.userType}
                    </Badge>
                  ) : null}
                </div>
                <h2 className="mt-2 text-lg font-semibold leading-snug">{detail.subject || '(no subject)'}</h2>
              </div>
              {bookingIdForLink ? (
                <Button variant="outline" size="sm" className="gap-1" asChild>
                  <Link to={`/bookings/${bookingIdForLink}`}>
                    Booking <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </div>

            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{detail.description}</p>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" aria-hidden />
                {userLine(detail)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Created {new Date(detail.createdAt).toLocaleString()}
              </span>
            </div>

            {(() => {
              const slaLine = slaSummary(detail)
              if (!slaLine) return null
              return (
                <div className="flex items-start gap-2 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-xs">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className={cn(slaLine.startsWith('Overdue') && 'font-medium text-destructive')}>{slaLine}</span>
                </div>
              )
            })()}

            {detail.refundRequest ? (
              <Card className="border-bloom-coral/40 bg-bloom-coral/5">
                <CardHeader className="py-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Banknote className="h-4 w-4 text-bloom-coral dark:text-bloom-coral" aria-hidden />
                    Refund request
                  </CardTitle>
                  <CardDescription>
                    Status:{' '}
                    <strong>{detail.refundRequest.status}</strong>
                    {detail.refundRequest.amountRequested != null ? (
                      <>
                        {' '}
                        · Requested {formatMoney(Number(detail.refundRequest.amountRequested))}
                      </>
                    ) : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pb-4">
                  {refundPending && canRefund ? (
                    <>
                      <Button type="button" size="sm" onClick={() => setApproveOpen(true)}>
                        Approve refund
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {refundPending && !canRefund ? (
                    <p className="text-xs text-muted-foreground">
                      Refund actions require <code className="rounded bg-muted px-1">refund_payments</code>.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {canAgent ? (
              <div className="space-y-3 rounded-lg border border-dashed border-primary/25 bg-primary/5 p-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Shield className="h-4 w-4" aria-hidden />
                    Internal notes
                  </h3>
                  <p className="text-xs text-muted-foreground">Staff-only — not shown to the ticket requester.</p>
                </div>
                <div className="max-h-40 space-y-2 overflow-y-auto text-sm">
                  {(detail.internalNotes ?? []).length === 0 ? (
                    <p className="text-muted-foreground">No internal notes yet.</p>
                  ) : (
                    (detail.internalNotes ?? []).map((n, i) => (
                      <div key={`${n.createdAt}-${i}`} className="rounded-md border bg-background px-2 py-1.5">
                        <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                          <span>{internalAuthorLabel(n)}</span>
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internal-note">Add internal note</Label>
                  <Textarea
                    id="internal-note"
                    rows={3}
                    placeholder="Handoff context, billing checks, fraud signals…"
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!internalNoteText.trim() || internalNoteSaving}
                    onClick={() => void submitInternalNote()}
                  >
                    {internalNoteSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    ) : null}
                    Save internal note
                  </Button>
                </div>
              </div>
            ) : null}

            <Separator />

            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4" aria-hidden />
                Conversation
              </h3>
              <div className="max-h-[min(420px,45vh)] space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-3">
                {sortedMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                ) : (
                  sortedMessages.map((m, i) => (
                    <div
                      key={`${m.createdAt}-${i}`}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm',
                        m.senderType === 'admin' && 'border-primary/30 bg-primary/5',
                        m.senderType === 'system' && 'border-muted bg-muted/40',
                        m.senderType === 'user' && 'border-border bg-background',
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{senderLabel(m)}</span>
                        <span>{new Date(m.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {canAgent ? (
              <div className="space-y-2">
                <Label htmlFor="ticket-reply">Agent reply</Label>
                <Textarea
                  id="ticket-reply"
                  placeholder="Public reply — visible in the customer/provider thread…"
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <Button
                  type="button"
                  disabled={!replyText.trim() || replySending}
                  onClick={() => void handleReply()}
                >
                  {replySending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  Send reply
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Replying requires <code className="rounded bg-muted px-1">send_messages</code>.
              </p>
            )}

            {canAgent ? (
              <>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={detail.status}
                      disabled={workflowSaving}
                      onValueChange={(v) =>
                        void handleWorkflowPatch({
                          status: v as 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['open', 'in_progress', 'resolved', 'closed', 'cancelled'] as const).map((s) => (
                          <SelectItem key={s} value={s}>
                            {label(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={detail.priority || 'medium'}
                      disabled={workflowSaving}
                      onValueChange={(v) =>
                        void handleWorkflowPatch({
                          priority: v as 'low' | 'medium' | 'high' | 'urgent',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assigned to</Label>
                    <Select
                      value={assignedUserSelectValue(detail)}
                      disabled={workflowSaving}
                      onValueChange={(v) => void handleAssignChange(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {assignMembers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || u.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={closeSaving || detail.status === 'closed'}
                    onClick={() => void handleClose()}
                  >
                    {closeSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
                    )}
                    Close ticket
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Support tickets"
        subtitle="Operations-grade queue: search and filter all channels, work the conversation, transition status, and clear refunds without leaving the thread. Synced with GET/PATCH/POST /api/feedback-support/support/tickets."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/support/refund-requests">Refund desk</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/support">Help hub</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void refreshAll()}>
              <RefreshCw className={cn('h-4 w-4', listLoading && 'animate-spin')} aria-hidden />
              Refresh
            </Button>
          </div>
        }
      />

      {!canAgent ? (
        <div className="flex gap-2 rounded-lg border border-bloom-coral/40 bg-bloom-coral/10 px-3 py-2 text-sm text-bloom-coral dark:text-bloom-deep">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Limited mode: you can browse tickets but not reply or change workflow without{' '}
            <code className="rounded bg-background/80 px-1">send_messages</code>.
          </span>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <CircleDot className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByStatus(stats, 'open')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In progress</CardTitle>
            <Clock className="h-4 w-4 text-bloom-coral" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByStatus(stats, 'in_progress')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <Shield className="h-4 w-4 text-storm-deep" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countByStatus(stats, 'resolved')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Server-side search on subject, description, and ticket number (min 2 characters).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-2 lg:col-span-2">
            <Label>Search</Label>
            <Input
              placeholder="Ticket #, subject, body…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filterStatus || 'any'} onValueChange={(v) => setFilterStatus(v === 'any' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {STATUSES.filter(Boolean).map((s) => (
                  <SelectItem key={s} value={s}>
                    {label(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={filterCategory || 'any'} onValueChange={(v) => setFilterCategory(v === 'any' ? '' : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {CATEGORIES.filter(Boolean).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={filterPriority || 'any'} onValueChange={(v) => setFilterPriority(v === 'any' ? '' : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {PRIORITIES.filter(Boolean).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Account type</Label>
            <Select value={filterUserType || 'any'} onValueChange={(v) => setFilterUserType(v === 'any' ? '' : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {USER_TYPES.filter(Boolean).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2 lg:col-span-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-input"
                checked={refundOnly}
                onChange={(e) => setRefundOnly(e.target.checked)}
              />
              Pending refunds only
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus('')
                setFilterCategory('')
                setFilterPriority('')
                setFilterUserType('')
                setSearchInput('')
                setRefundOnly(false)
              }}
            >
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {listError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {listError}
        </div>
      ) : null}

      <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-start">
        <Card className="overflow-hidden lg:max-h-[calc(100vh-12rem)]">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-base">Queue</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-14rem)] overflow-y-auto p-2">
            {listLoading && rows.length === 0 ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No tickets match.</p>
            ) : (
              <ul className="space-y-1">
                {rows.map((t) => (
                  <li key={t._id}>
                    <button
                      type="button"
                      onClick={() => openTicket(t._id)}
                      className={cn(
                        'flex w-full flex-col rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                        selectedId === t._id
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent hover:bg-accent/80',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold">{t.ticketNumber}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {t.status}
                        </Badge>
                        {t.refundRequest ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Refund
                          </Badge>
                        ) : null}
                      </div>
                      <span className="mt-1 line-clamp-2 font-medium leading-snug">{t.subject || '(no subject)'}</span>
                      <span className="mt-1 truncate text-xs text-muted-foreground">{userLine(t)}</span>
                      <span className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(t.createdAt).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[520px] lg:max-h-[calc(100vh-12rem)] lg:overflow-hidden">
          <CardContent className="flex h-full max-h-[calc(100vh-13rem)] flex-col overflow-hidden p-4 md:p-6">
            {detailPanel}
          </CardContent>
        </Card>
      </div>

      {/* Mobile / tablet: list + sheet */}
      <div className="lg:hidden">
        <Card>
          <CardContent className="p-2">
            {listLoading && rows.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : (
              <ul className="divide-y">
                {rows.map((t) => (
                  <li key={t._id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 px-3 py-3 text-left"
                      onClick={() => openTicket(t._id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{t.ticketNumber}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {t.status}
                          </Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium">{t.subject}</p>
                        <p className="text-xs text-muted-foreground">{userLine(t)}</p>
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg">
            <SheetHeader className="border-b pb-4 text-left">
              <SheetTitle>Ticket</SheetTitle>
              <SheetDescription>Conversation and actions</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">{detailPanel}</div>
          </SheetContent>
        </Sheet>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || listLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages || listLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve refund</DialogTitle>
            <DialogDescription>Optional cap amount; leave blank to use the requested total.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="Auto"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Admin note</Label>
              <Textarea rows={3} value={approveNote} onChange={(e) => setApproveNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={refundActing} onClick={() => void submitApprove()}>
              {refundActing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject refund</DialogTitle>
            <DialogDescription>Customer-visible reason is required.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Internal note</Label>
              <Textarea rows={2} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={refundActing} onClick={() => void submitReject()}>
              {refundActing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
