import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ExternalLink, Loader2, Scale } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { SupportTicketsService } from '../../services/api/supportTickets.service'
import { DisputeCasesService, type DisputeCaseRow } from '../../services/api/disputeCases.service'
import { usePermissions } from '../../hooks/usePermissions'

export function TrustDisputesHubPage() {
  const { checkAnyPermission } = usePermissions()
  const canRefund = checkAnyPermission(['refund_payments'])
  const canDisputes = checkAnyPermission(['view_bookings', 'manage_bookings', 'edit_bookings'])
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [refundLoading, setRefundLoading] = useState(false)
  const [disputePreview, setDisputePreview] = useState<DisputeCaseRow[]>([])
  const [disputeLoading, setDisputeLoading] = useState(false)

  useEffect(() => {
    if (!canRefund) return
    let cancelled = false
    ;(async () => {
      setRefundLoading(true)
      try {
        const res = await SupportTicketsService.listRefundQueue({ limit: 100, status: 'pending' })
        const data = res.success && res.data && typeof res.data === 'object' ? res.data : null
        const tickets =
          data && 'tickets' in data ? (data as { tickets: unknown[] }).tickets : []
        if (!cancelled) setPendingCount(Array.isArray(tickets) ? tickets.length : 0)
      } catch {
        if (!cancelled) setPendingCount(null)
      } finally {
        if (!cancelled) setRefundLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canRefund])

  useEffect(() => {
    if (!canDisputes) return
    let cancelled = false
    ;(async () => {
      setDisputeLoading(true)
      try {
        const res = await DisputeCasesService.list({ limit: 8, page: 1 })
        if (!cancelled && res.success && res.data?.cases) setDisputePreview(res.data.cases)
        else if (!cancelled) setDisputePreview([])
      } catch {
        if (!cancelled) setDisputePreview([])
      } finally {
        if (!cancelled) setDisputeLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canDisputes])

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Trust & disputes</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Central lane for money-back governance and booking-level investigations. Pair refund tickets
          with booking detail (earning dispute controls live on the booking ledger).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Refund queue</CardTitle>
            </div>
            <CardDescription>Approve or reject customer refund requests with notes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            {canRefund ? (
              <>
                {refundLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Badge variant={pendingCount && pendingCount > 0 ? 'destructive' : 'secondary'}>
                    {pendingCount ?? '—'} pending
                  </Badge>
                )}
                <Button size="sm" asChild>
                  <Link to="/support/refund-requests">
                    Open refund requests <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Your role does not include refund actions.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booking & earning disputes</CardTitle>
            <CardDescription>
              Use booking detail → admin earning tools to place payouts on hold while you investigate.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/bookings">Bookings</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/payments">Payments</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/support">Help & support</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/reports">Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {canDisputes && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Dispute cases</CardTitle>
                <CardDescription>
                  Structured ledger with SLA, parties, evidence links, and audit trail — not a replacement
                  for refunds, but the system of record for investigations.
                </CardDescription>
              </div>
            </div>
            <Button size="sm" asChild>
              <Link to="/operations/dispute-cases">
                Open dispute desk <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {disputeLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading cases…
              </div>
            ) : disputePreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dispute cases yet — create one from the desk.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputePreview.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium">{r.disputeCaseNumber}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.status.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.slaDueAt ? new Date(r.slaDueAt).toLocaleString() : '—'}
                        {r.slaBreachedComputed && !['resolved', 'closed'].includes(r.status) && (
                          <Badge variant="destructive" className="ml-2">
                            overdue
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Operating principles</CardTitle>
          <CardDescription>Lightweight SLA defaults — tune in process docs.</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>Refund decisions logged with admin note + linked booking ID.</li>
            <li>Earning disputes freeze payout until cleared — prevents double liability.</li>
            <li>Repeat offender pros/customers: route through moderation + workforce dashboard.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
