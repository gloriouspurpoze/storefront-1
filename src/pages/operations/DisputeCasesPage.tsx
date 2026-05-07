import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Plus, RefreshCw, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  DisputeCasesService,
  type DisputeCaseRow,
  type DisputeCaseStatus,
} from '../../services/api/disputeCases.service'
import { usePermissions } from '../../hooks/usePermissions'

const STATUSES: DisputeCaseStatus[] = [
  'open',
  'investigating',
  'awaiting_customer',
  'awaiting_pro',
  'resolved',
  'closed',
  'escalated',
]

function bookingLinkId(bookingId: unknown): string | null {
  if (!bookingId) return null
  if (typeof bookingId === 'string') return bookingId
  if (typeof bookingId === 'object' && bookingId !== null && '_id' in bookingId) {
    return String((bookingId as { _id: unknown })._id)
  }
  return null
}

export function DisputeCasesPage() {
  const { checkAnyPermission } = usePermissions()
  const canMutate = checkAnyPermission(['manage_bookings', 'edit_bookings', 'refund_payments'])

  const [rows, setRows] = useState<DisputeCaseRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [cTitle, setCTitle] = useState('')
  const [cDesc, setCDesc] = useState('')
  const [cBooking, setCBooking] = useState('')
  const [cPriority, setCPriority] = useState('normal')
  const [submitting, setSubmitting] = useState(false)

  const [detail, setDetail] = useState<DisputeCaseRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [dStatus, setDStatus] = useState<DisputeCaseStatus>('open')
  const [auditAction, setAuditAction] = useState('')
  const [auditNote, setAuditNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await DisputeCasesService.list({
        page,
        limit,
        status: statusFilter === 'all' ? undefined : (statusFilter as DisputeCaseStatus),
      })
      if (res.success && res.data) {
        setRows(res.data.cases ?? [])
        const p = res.data.pagination
        setTotalPages(p?.totalPages ?? 1)
        setTotal(p?.total ?? 0)
      } else {
        setRows([])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dispute cases')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (row: DisputeCaseRow) => {
    try {
      const res = await DisputeCasesService.getById(row._id)
      if (res.success && res.data) {
        setDetail(res.data as DisputeCaseRow)
        setDStatus((res.data as DisputeCaseRow).status)
        setAuditAction('')
        setAuditNote('')
        setDetailOpen(true)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to open case')
    }
  }

  const submitCreate = async () => {
    if (!canMutate) return
    if (!cTitle.trim() || !cDesc.trim()) return
    setSubmitting(true)
    try {
      await DisputeCasesService.create({
        title: cTitle.trim(),
        description: cDesc.trim(),
        bookingId: cBooking.trim() || undefined,
        priority: cPriority,
      })
      setCreateOpen(false)
      setCTitle('')
      setCDesc('')
      setCBooking('')
      setCPriority('normal')
      await load()
    } catch {
      /* toast */
    } finally {
      setSubmitting(false)
    }
  }

  const saveDetailStatus = async () => {
    if (!detail || !canMutate) return
    setSubmitting(true)
    try {
      await DisputeCasesService.patch(detail._id, { status: dStatus })
      await load()
      const refreshed = await DisputeCasesService.getById(detail._id)
      if (refreshed.success && refreshed.data) setDetail(refreshed.data as DisputeCaseRow)
    } finally {
      setSubmitting(false)
    }
  }

  const submitAudit = async () => {
    if (!detail || !canMutate || !auditAction.trim()) return
    setSubmitting(true)
    try {
      await DisputeCasesService.appendAudit(detail._id, {
        action: auditAction.trim(),
        note: auditNote.trim() || undefined,
      })
      setAuditAction('')
      setAuditNote('')
      await load()
      const refreshed = await DisputeCasesService.getById(detail._id)
      if (refreshed.success && refreshed.data) setDetail(refreshed.data as DisputeCaseRow)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dispute cases</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Structured trust operations: SLA clock, parties, evidence URLs, and immutable-style audit
            trail. Pair with refunds and booking earning holds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          {canMutate && (
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New case
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Queue</CardTitle>
            <CardDescription>{total} case(s) · default SLA 72h from creation</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground whitespace-nowrap">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dispute cases yet.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const bid = bookingLinkId(r.bookingId)
                    const breached = r.slaBreachedComputed || Boolean(r.slaBreachedAt)
                    return (
                      <TableRow key={r._id}>
                        <TableCell>
                          <div className="font-medium">{r.disputeCaseNumber}</div>
                          <div className="max-w-[280px] truncate text-xs text-muted-foreground">{r.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.status.replace(/_/g, ' ')}</Badge>
                          <span className="ml-2 text-xs text-muted-foreground">{r.priority}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs tabular-nums">
                            {r.slaDueAt ? new Date(r.slaDueAt).toLocaleString() : '—'}
                          </span>
                          {breached && !['resolved', 'closed'].includes(r.status) && (
                            <Badge variant="destructive" className="ml-2">
                              SLA
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {bid ? (
                            <Button variant="link" className="h-auto p-0" asChild>
                              <Link to={`/bookings/${bid}`}>Open booking</Link>
                            </Button>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => void openDetail(r)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New dispute case</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="dc-title">Title</Label>
              <Input id="dc-title" value={cTitle} onChange={(e) => setCTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="dc-desc">Description</Label>
              <Textarea id="dc-desc" rows={4} value={cDesc} onChange={(e) => setCDesc(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="dc-book">Booking ID (optional)</Label>
              <Input
                id="dc-book"
                placeholder="Mongo ObjectId"
                value={cBooking}
                onChange={(e) => setCBooking(e.target.value)}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={cPriority} onValueChange={setCPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">low</SelectItem>
                  <SelectItem value="normal">normal</SelectItem>
                  <SelectItem value="high">high</SelectItem>
                  <SelectItem value="urgent">urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void submitCreate()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.disputeCaseNumber}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{detail.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{detail.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {bookingLinkId(detail.bookingId) && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/bookings/${bookingLinkId(detail.bookingId)!}`}>
                      Booking <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
              {detail.evidenceUrls?.length ? (
                <div>
                  <Label className="text-muted-foreground">Evidence</Label>
                  <ul className="mt-1 list-disc pl-5 text-sm">
                    {detail.evidenceUrls.map((u) => (
                      <li key={u}>
                        <a href={u} className="text-primary underline" target="_blank" rel="noreferrer">
                          {u}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {canMutate && (
                <div className="flex flex-wrap items-end gap-2 border-t pt-4">
                  <div className="min-w-[180px]">
                    <Label>Status</Label>
                    <Select value={dStatus} onValueChange={(v) => setDStatus(v as DisputeCaseStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" onClick={() => void saveDetailStatus()} disabled={submitting}>
                    Save status
                  </Button>
                </div>
              )}

              {canMutate && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-muted-foreground">Add audit entry</Label>
                  <Input
                    placeholder="Action (e.g. called_customer)"
                    value={auditAction}
                    onChange={(e) => setAuditAction(e.target.value)}
                  />
                  <Textarea
                    placeholder="Note (optional)"
                    rows={2}
                    value={auditNote}
                    onChange={(e) => setAuditNote(e.target.value)}
                  />
                  <Button type="button" variant="secondary" onClick={() => void submitAudit()} disabled={submitting}>
                    Log audit
                  </Button>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Audit trail</Label>
                <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto text-sm">
                  {[...(detail.auditLog ?? [])]
                    .slice()
                    .reverse()
                    .map((a, i) => (
                      <li key={`${a.at}-${i}`} className="rounded-md border bg-muted/40 px-3 py-2">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span className="font-medium">{a.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {a.at ? new Date(a.at).toLocaleString() : ''}
                          </span>
                        </div>
                        {a.note && <p className="mt-1 text-muted-foreground">{a.note}</p>}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
