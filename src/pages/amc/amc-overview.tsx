import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, CalendarClock, ClipboardList, AlertTriangle, ArrowRight } from 'lucide-react'
import { AmcService } from '../../services/api/amc.service'
import type { AmcContract, AmcSummary } from '../../types/amc.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

const STATUS_ORDER = ['active', 'draft', 'suspended', 'expired', 'cancelled', 'renewed'] as const

function daysUntil(iso: string): number {
  const end = new Date(iso).getTime()
  return Math.ceil((end - Date.now()) / 86400000)
}

export function AmcOverviewPage() {
  const [summary, setSummary] = useState<AmcSummary | null>(null)
  const [contracts, setContracts] = useState<AmcContract[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const [s, list] = await Promise.all([
          AmcService.getSummary(),
          AmcService.listContracts({ status: 'active', limit: 80, page: 1 }),
        ])
        if (cancelled) return
        setSummary(s.data)
        setContracts(list.data.contracts)
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load AMC overview')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const expiringRows = useMemo(() => {
    return contracts
      .filter((c) => c.status === 'active')
      .map((c) => ({ c, d: daysUntil(c.endDate) }))
      .filter(({ d }) => d <= 30 && d >= -14)
      .sort((a, b) => a.d - b.d)
      .slice(0, 12)
  }, [contracts])

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading AMC snapshot…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ClipboardList className="h-4 w-4" />
                  Total contracts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{summary?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">All statuses in your tenant</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums text-storm-deep dark:text-storm-sea">
                  {summary?.byStatus?.active ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  Renewal window (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums text-bloom-coral dark:text-bloom-coral">
                  {summary?.expiringWithin30Days ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Backend count · active &amp; ending soon</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Draft / suspended
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">
                  {(summary?.byStatus?.draft ?? 0) + (summary?.byStatus?.suspended ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Status mix</CardTitle>
                <CardDescription>Operational pulse — prioritize renewals and suspended accounts.</CardDescription>
              </div>
              <Link
                to="/amc/contracts"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Open contracts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((st) => (
                <Badge key={st} variant="secondary" className="gap-1.5 capitalize">
                  {st.replace(/_/g, ' ')}
                  <span className="font-mono text-muted-foreground">{summary?.byStatus?.[st] ?? 0}</span>
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Renewal &amp; expiry radar</CardTitle>
              <CardDescription>
                Active contracts ending within 30 days or recently expired (≤14 days past end). Perfect for calling
                customers about RO / AC AMC renewals.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {expiringRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contracts in the renewal radar window.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Ends</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringRows.map(({ c, d }) => (
                      <TableRow key={c._id}>
                        <TableCell className="font-mono font-semibold">{c.contractNumber}</TableCell>
                        <TableCell>{c.customerName || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground text-sm">
                          {new Date(c.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium tabular-nums ${d < 0 ? 'text-destructive' : d <= 7 ? 'text-bloom-coral dark:text-bloom-coral' : ''}`}
                        >
                          {d < 0 ? `${d}` : `+${d}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            className="text-sm font-medium text-primary hover:underline"
                            to={`/amc/contracts/${c._id}`}
                          >
                            Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
