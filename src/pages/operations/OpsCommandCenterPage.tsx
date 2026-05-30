import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
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
import { BookingsService } from '../../services/api/bookings.service'
import type { Booking } from '../../types'
import { formatCurrency } from '../../lib/utils'
import { bookingRowId, safeCustomerLabel, unwrapBookingsPayload } from './industryOpsLib'

type QueueKey = 'pending' | 'confirmed' | 'scheduled' | 'accepted' | 'in_progress'

const QUEUES: { key: QueueKey; label: string; hint: string }[] = [
  { key: 'pending', label: 'Pending', hint: 'Needs acceptance or assignment' },
  { key: 'confirmed', label: 'Confirmed', hint: 'Committed slot' },
  { key: 'scheduled', label: 'Scheduled', hint: 'Calendar placement' },
  { key: 'accepted', label: 'Accepted', hint: 'Pro acknowledged' },
  { key: 'in_progress', label: 'In progress', hint: 'Work underway' },
]

function paymentAttention(b: Booking): boolean {
  const ps = b.paymentStatus
  if (!ps) return false
  return ps === 'pending' || ps === 'failed'
}

export function OpsCommandCenterPage() {
  const [queues, setQueues] = useState<Record<QueueKey, Booking[]>>({
    pending: [],
    confirmed: [],
    scheduled: [],
    accepted: [],
    in_progress: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(
        QUEUES.map((q) =>
          BookingsService.getBookings({ status: q.key, limit: 12, page: 1 }).then((res) => ({
            key: q.key,
            ...unwrapBookingsPayload(res as Parameters<typeof unwrapBookingsPayload>[0]),
          })),
        ),
      )
      const next: Record<QueueKey, Booking[]> = {
        pending: [],
        confirmed: [],
        scheduled: [],
        accepted: [],
        in_progress: [],
      }
      for (const r of results) {
        next[r.key] = r.bookings
      }
      setQueues(next)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load queues')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const flagged = [...queues.pending, ...queues.confirmed, ...queues.in_progress].filter(paymentAttention)

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Ops command center</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Exception-first triage for service jobs. Deep-link into booking detail for assignment,
            payouts, and earning disputes.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Reload queues
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {flagged.length > 0 && (
        <Card className="border-bloom-coral/40 bg-bloom-coral/5">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <AlertTriangle className="h-5 w-5 text-bloom-coral" />
            <div>
              <CardTitle className="text-base">Payment attention</CardTitle>
              <CardDescription>
                Bookings with pending or failed payment flags (sample from loaded queues).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {flagged.slice(0, 8).map((b) => (
              <Button key={bookingRowId(b)} variant="secondary" size="sm" asChild>
                <Link to={`/bookings/${bookingRowId(b)}`}>
                  {b.bookingNumber || bookingRowId(b).slice(-6)} · {formatCurrency(b.totalAmount)}
                  <Badge variant="outline" className="ml-2">
                    {b.paymentStatus}
                  </Badge>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-10">
        {QUEUES.map((q) => (
          <Card key={q.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {q.label}
                <Badge variant="secondary">{queues[q.key].length ? `${queues[q.key].length}+` : '0'}</Badge>
              </CardTitle>
              <CardDescription>{q.hint}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : queues[q.key].length === 0 ? (
                <p className="text-sm text-muted-foreground">No rows in this queue right now.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queues[q.key].map((b) => {
                      const id = bookingRowId(b)
                      return (
                        <TableRow key={id}>
                          <TableCell className="font-medium">
                            {b.bookingNumber || id.slice(-8)}
                            {paymentAttention(b) && (
                              <Badge variant="destructive" className="ml-2">
                                pay
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{safeCustomerLabel(b)}</TableCell>
                          <TableCell>{b.serviceName || b.services?.[0]?.serviceName || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {b.scheduledDate} {b.scheduledTime}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(b.totalAmount)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/bookings/${id}`}>Open</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
