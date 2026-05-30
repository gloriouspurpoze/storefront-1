import React, { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Check, X, Wallet } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { SupportTicketsService, SupportTicketRow } from '../../services/api/supportTickets.service'
import { usePermissions } from '../../hooks/usePermissions'
import { cn } from '../../lib/utils'

export default function RefundRequestsPage() {
  const { checkPermission } = usePermissions()
  const canRefund = checkPermission('refund_payments')

  const [rows, setRows] = useState<SupportTicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [active, setActive] = useState<SupportTicketRow | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [approveAmount, setApproveAmount] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await SupportTicketsService.listRefundQueue({ limit: 100, status: 'pending' })
      if (res.success && res.data && typeof res.data === 'object' && 'tickets' in res.data) {
        setRows((res.data as { tickets: SupportTicketRow[] }).tickets || [])
      } else {
        setRows([])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openApprove = (t: SupportTicketRow) => {
    setActive(t)
    setAdminNote('')
    setApproveAmount(
      t.refundRequest?.amountRequested != null ? String(t.refundRequest.amountRequested) : '',
    )
    setApproveOpen(true)
  }

  const openReject = (t: SupportTicketRow) => {
    setActive(t)
    setAdminNote('')
    setRejectReason('')
    setRejectOpen(true)
  }

  const submitApprove = async () => {
    if (!active || !canRefund) return
    setSubmitting(true)
    try {
      const amt = approveAmount.trim() ? parseFloat(approveAmount.replace(/,/g, '')) : undefined
      await SupportTicketsService.approveRefund(active._id, {
        adminNote: adminNote.trim() || undefined,
        amount: Number.isFinite(amt) && (amt as number) > 0 ? amt : undefined,
      })
      setApproveOpen(false)
      setActive(null)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setSubmitting(false)
    }
  }

  const submitReject = async () => {
    if (!active || !canRefund) return
    if (!rejectReason.trim()) {
      setError('Rejection reason is required')
      return
    }
    setSubmitting(true)
    try {
      await SupportTicketsService.rejectRefund(active._id, {
        rejectionReason: rejectReason.trim(),
        adminNote: adminNote.trim() || undefined,
      })
      setRejectOpen(false)
      setActive(null)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reject failed')
    } finally {
      setSubmitting(false)
    }
  }

  const booking = active?.refundRequest?.bookingId as unknown as
    | { _id?: string; status?: string; totalAmount?: number; paymentStatus?: string }
    | undefined

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Refund requests"
        subtitle="Customer-initiated refund tickets. Approve to run gateway/ledger refund, or reject with a reason."
        icon={<Wallet className="h-9 w-9 text-primary" aria-hidden />}
        action={
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void load()}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {!canRefund && (
        <div className="rounded-md border border-bloom-coral/40 bg-bloom-rose px-3 py-2 text-sm text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/40 dark:text-bloom-deep">
          You do not have refund permission. Ask a super admin to grant <code>refund_payments</code>.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No pending refund requests.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((t) => {
              const u = t.userId as { firstName?: string; lastName?: string; email?: string } | undefined
              const rr = t.refundRequest
              const bid = rr?.bookingId
              const b = (t as unknown as { refundRequest?: { bookingId?: unknown } }).refundRequest
                ?.bookingId as
                | { _id?: string; status?: string; totalAmount?: number; paymentStatus?: string }
                | string
                | undefined
              const bookingIdStr = typeof b === 'object' && b && '_id' in b ? String(b._id) : String(bid || '')
              const bookingStatus = typeof b === 'object' && b ? b.status : undefined
              return (
                <li key={t._id} className="list-none p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{t.ticketNumber}</span>
                        <Badge variant="secondary">{t.category}</Badge>
                        {rr?.fallbackLedgerOnly && (
                          <Badge variant="outline" className="text-xs">
                            No payment row — ledger fallback
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{t.subject}</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Customer: {(u?.firstName || '') + ' ' + (u?.lastName || '')} · {u?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Booking: {bookingIdStr.slice(-8)}
                        {bookingStatus ? ` · ${bookingStatus}` : ''} · Requested ₹
                        {Number(rr?.amountRequested || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    {canRefund && (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="gap-1"
                          onClick={() => openApprove(t)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1 border-destructive/40 text-destructive"
                          onClick={() => openReject(t)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve refund</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Ticket <span className="font-mono">{active.ticketNumber}</span>
                {booking ? (
                  <>
                    <br />
                    Booking status: {booking.status} · Paid: {booking.paymentStatus}
                  </>
                ) : null}
              </p>
              <div>
                <Label htmlFor="amt">Amount (₹)</Label>
                <Input
                  id="amt"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  placeholder="Leave blank to use requested amount"
                />
              </div>
              <div>
                <Label htmlFor="anote">Internal note (optional)</Label>
                <Textarea id="anote" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setApproveOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitApprove()} disabled={submitting}>
              {submitting ? 'Processing…' : 'Confirm refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject refund request</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground font-mono">{active.ticketNumber}</p>
              <div>
                <Label htmlFor="rreason">Reason (shown in ticket thread)</Label>
                <Textarea
                  id="rreason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rnote">Internal note (optional)</Label>
                <Textarea id="rnote" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setRejectOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void submitReject()} disabled={submitting}>
              {submitting ? 'Saving…' : 'Reject request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
