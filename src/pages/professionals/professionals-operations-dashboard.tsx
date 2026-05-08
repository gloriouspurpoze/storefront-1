/**
 * Admin workforce view: workload, pipeline, completion times, and ratings across professionals.
 * Booking metrics are built from parallel samples (max 100 rows per status — API cap).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { BookingsService } from '../../services/api/bookings.service'
import { ProfessionalsService } from '../../services/api/professionals.service'
import type { Booking, BookingsResponse } from '../../types'
import type { Professional, ProfessionalStats } from '../../types/professional.types'
import {
  FLEET_BOOKING_SAMPLE_STATUSES,
  aggregateFleetBookings,
  fleetWorkloadLabel,
  metricsPerProfessional,
  type ProfessionalFleetMetrics,
} from '../../lib/professionalsFleetAnalytics'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui'

function pullBookings(res: Awaited<ReturnType<typeof BookingsService.getBookings>>): Booking[] {
  if (res && typeof res === 'object' && 'success' in res && res.success === false) return []
  const d = (res as { data?: BookingsResponse })?.data
  return d?.bookings ?? []
}

function formatHours(h: number | null | undefined): string {
  if (h == null || Number.isNaN(h)) return '—'
  if (h < 24) return `${h.toFixed(1)} h`
  return `${(h / 24).toFixed(1)} d`
}

function InfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="mb-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-foreground"
    >
      {children}
    </div>
  )
}

function ErrorAlert({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="mb-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {children}
    </div>
  )
}

function WarnAlert({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="mt-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm">
      {children}
    </div>
  )
}

export function ProfessionalsOperationsDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ProfessionalStats | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [proTotal, setProTotal] = useState(0)
  const [fleetAgg, setFleetAgg] = useState<ReturnType<typeof aggregateFleetBookings> | null>(null)
  const [rows, setRows] = useState<ProfessionalFleetMetrics[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, prosRes, ...statusResults] = await Promise.all([
        ProfessionalsService.getProfessionalStats().catch(() => null),
        ProfessionalsService.getProfessionals({ page: 1, limit: 100 }),
        ...FLEET_BOOKING_SAMPLE_STATUSES.map((status) => BookingsService.getBookings({ page: 1, limit: 100, status })),
      ])

      if (statsRes && statsRes.data) {
        setStats(statsRes.data as ProfessionalStats)
      } else {
        setStats(null)
      }

      const proPayload = prosRes.data as
        | { professionals?: Professional[]; pagination?: { total?: number } }
        | undefined
      const list = proPayload?.professionals ?? []
      setProfessionals(list)
      setProTotal(proPayload?.pagination?.total ?? list.length)

      const lists = statusResults.map(pullBookings)
      const mergedLists = lists.flat()
      const merged = (() => {
        const map = new Map<string, Booking>()
        for (const b of mergedLists) {
          const id = String(b.id || (b as { _id?: string })._id || '')
          if (id) map.set(id, b)
        }
        return Array.from(map.values())
      })()

      const agg = aggregateFleetBookings(merged)
      setFleetAgg(agg)
      setRows(metricsPerProfessional(list, merged))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workforce dashboard')
      setFleetAgg(null)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (b.activeJobs !== a.activeJobs) return b.activeJobs - a.activeJobs
      if (b.pipelineJobs !== a.pipelineJobs) return b.pipelineJobs - a.pipelineJobs
      return (b.professional.rating || 0) - (a.professional.rating || 0)
    })
  }, [rows])

  const activeNow = useMemo(() => rows.reduce((s, r) => s + r.activeJobs, 0), [rows])
  const pipelineAll = useMemo(() => rows.reduce((s, r) => s + r.pipelineJobs, 0), [rows])

  return (
    <div className="pb-8">
      <PageHeader
        title="Workforce operations"
        subtitle="Cross-professional workload, pipeline health, turnaround samples, and roster quality — without opening each hub."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
            <Button asChild>
              <Link to="/professionals" className="inline-flex items-center gap-1">
                Directory
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/bookings">All bookings</Link>
            </Button>
          </div>
        }
      />

      <InfoAlert>
        Booking analytics use up to <strong>100 rows per status</strong> (API maximum), merged uniquely. Global counts
        are a <strong>sample</strong>, not full history. For one professional, open their <strong>operations hub</strong>{' '}
        for deeper filters.
      </InfoAlert>

      {loading && (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      {error ? <ErrorAlert>{error}</ErrorAlert> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Roster (loaded)</p>
            <p className="text-3xl font-semibold tracking-tight">{professionals.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              of {proTotal} total professionals · first page
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Assigned jobs (sample)</p>
            <p className="text-3xl font-semibold tracking-tight">{fleetAgg?.assignedInSample ?? '—'}</p>
            <p className="mt-1 text-xs text-muted-foreground">Unique bookings with a professional in merged sample</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active on job (sample)</p>
            <p className="text-3xl font-semibold tracking-tight">{activeNow}</p>
            <p className="mt-1 text-xs text-muted-foreground">Accepted + in progress · loaded roster only</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pipeline queue (sample)</p>
            <p className="text-3xl font-semibold tracking-tight">{pipelineAll}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pending + confirmed + scheduled · loaded roster</p>
          </CardContent>
        </Card>
      </div>

      {stats ? (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Fleet rating (API)</p>
              <p className="text-xl font-semibold">{Number(stats.averageRating || 0).toFixed(2)} ★ avg</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.verifiedProfessionals ?? '—'} verified · {stats.availableProfessionals ?? '—'} marked available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Unassigned in sample</p>
              <p className="text-xl font-semibold">{fleetAgg?.unassignedInSample ?? '—'}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Bookings in sample with no professional id — assign from bookings list
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Avg turnaround (completed in sample)</p>
              <p className="text-xl font-semibold">{formatHours(fleetAgg?.globalAvgCompletionHours)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Created → completed, when both timestamps exist</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {fleetAgg?.byStatus && Object.keys(fleetAgg.byStatus).length > 0 ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="mb-2 font-medium">Sample mix by status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(fleetAgg.byStatus)
                .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                .map(([st, n]) => (
                  <Badge key={st} variant="outline" className="font-normal">
                    {st}: {n}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <h2 className="mb-1 text-lg font-semibold">Per professional</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Sorted by active jobs, then pipeline. <strong>Workload</strong> counts assignments in the merged sample only.
        Profile <strong>completed</strong> / <strong>cancelled</strong> are lifetime counters from the API.
      </p>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Professional</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Active</TableHead>
              <TableHead className="text-right">Pipeline</TableHead>
              <TableHead className="text-right">Sample load</TableHead>
              <TableHead className="text-right">Avg complete</TableHead>
              <TableHead className="text-right">Lifetime done</TableHead>
              <TableHead className="text-right">Lifetime cancelled</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((r) => {
              const p = r.professional
              const hubId = p._id || p.id
              return (
                <TableRow key={String(hubId)}>
                  <TableCell>
                    <div className="font-medium">
                      {p.firstName} {p.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.professionalId}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(p.rating || 0).toFixed(1)} ★
                    <div className="text-xs text-muted-foreground">{p.totalReviews ?? 0} rev</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge variant="outline" className="w-fit font-normal">
                        {fleetWorkloadLabel(r)}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">
                        {p.availability} · {p.verificationStatus}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{r.activeJobs}</TableCell>
                  <TableCell className="text-right">{r.pipelineJobs}</TableCell>
                  <TableCell className="text-right">{r.workloadTotal}</TableCell>
                  <TableCell className="text-right">{formatHours(r.avgCompletionHours)}</TableCell>
                  <TableCell className="text-right">{p.completedJobs ?? 0}</TableCell>
                  <TableCell className="text-right">{p.cancelledJobs ?? 0}</TableCell>
                  <TableCell className="text-right">
                    {hubId ? (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/professionals/${hubId}`}>Hub</Link>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {!loading && sortedRows.length === 0 ? (
        <WarnAlert>No professionals returned. Check permissions or API.</WarnAlert>
      ) : null}
    </div>
  )
}
