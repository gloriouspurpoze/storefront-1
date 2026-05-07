/**
 * Admin workforce view: workload, pipeline, completion times, and ratings across professionals.
 * Booking metrics are built from parallel samples (max 100 rows per status — API cap).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material'
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
        ...FLEET_BOOKING_SAMPLE_STATUSES.map((status) =>
          BookingsService.getBookings({ page: 1, limit: 100, status }),
        ),
      ])

      if (statsRes && statsRes.data) {
        setStats(statsRes.data as ProfessionalStats)
      } else {
        setStats(null)
      }

      const proPayload = prosRes.data as { professionals?: Professional[]; pagination?: { total?: number } } | undefined
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

  const activeNow = useMemo(
    () => rows.reduce((s, r) => s + r.activeJobs, 0),
    [rows],
  )
  const pipelineAll = useMemo(
    () => rows.reduce((s, r) => s + r.pipelineJobs, 0),
    [rows],
  )

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title="Workforce operations"
        subtitle="Cross-professional workload, pipeline health, turnaround samples, and roster quality — without opening each hub."
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
            <Button variant="contained" component={RouterLink} to="/professionals" endIcon={<OpenInNewIcon sx={{ fontSize: 18 }} />}>
              Directory
            </Button>
            <Button variant="outlined" component={RouterLink} to="/bookings">
              All bookings
            </Button>
          </Stack>
        }
      />

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Booking analytics use up to <strong>100 rows per status</strong> (API maximum), merged uniquely. Global counts
        are a <strong>sample</strong>, not full history. For one professional, open their{' '}
        <strong>operations hub</strong> for deeper filters.
      </Alert>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          mb: 3,
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Roster (loaded)
            </Typography>
            <Typography variant="h4">{professionals.length}</Typography>
            <Typography variant="caption" color="text.secondary">
              of {proTotal} total professionals · first page
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Assigned jobs (sample)
            </Typography>
            <Typography variant="h4">{fleetAgg?.assignedInSample ?? '—'}</Typography>
            <Typography variant="caption" color="text.secondary">
              Unique bookings with a professional in merged sample
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Active on job (sample)
            </Typography>
            <Typography variant="h4">{activeNow}</Typography>
            <Typography variant="caption" color="text.secondary">
              Accepted + in progress · loaded roster only
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Pipeline queue (sample)
            </Typography>
            <Typography variant="h4">{pipelineAll}</Typography>
            <Typography variant="caption" color="text.secondary">
              Pending + confirmed + scheduled · loaded roster
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {stats ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            mb: 3,
          }}
        >
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Fleet rating (API)
              </Typography>
              <Typography variant="h5">{Number(stats.averageRating || 0).toFixed(2)} ★ avg</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {stats.verifiedProfessionals ?? '—'} verified · {stats.availableProfessionals ?? '—'} marked available
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Unassigned in sample
              </Typography>
              <Typography variant="h5">{fleetAgg?.unassignedInSample ?? '—'}</Typography>
              <Typography variant="caption" color="text.secondary">
                Bookings in sample with no professional id — assign from bookings list
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Avg turnaround (completed in sample)
              </Typography>
              <Typography variant="h5">{formatHours(fleetAgg?.globalAvgCompletionHours)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Created → completed, when both timestamps exist
              </Typography>
            </CardContent>
          </Card>
        </Box>
      ) : null}

      {fleetAgg?.byStatus && Object.keys(fleetAgg.byStatus).length > 0 ? (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Sample mix by status
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {Object.entries(fleetAgg.byStatus)
              .sort((a, b) => (b[1] || 0) - (a[1] || 0))
              .map(([st, n]) => (
                <Chip key={st} size="small" label={`${st}: ${n}`} variant="outlined" />
              ))}
          </Stack>
        </Paper>
      ) : null}

      <Typography variant="h6" sx={{ mb: 1 }}>
        Per professional
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sorted by active jobs, then pipeline. <strong>Workload</strong> counts assignments in the merged sample only.
        Profile <strong>completed</strong> / <strong>cancelled</strong> are lifetime counters from the API.
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" sx={{ minWidth: 960 }}>
          <TableHead>
            <TableRow>
              <TableCell>Professional</TableCell>
              <TableCell align="right">Rating</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Active</TableCell>
              <TableCell align="right">Pipeline</TableCell>
              <TableCell align="right">Sample load</TableCell>
              <TableCell align="right">Avg complete</TableCell>
              <TableCell align="right">Lifetime done</TableCell>
              <TableCell align="right">Lifetime cancelled</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((r) => {
              const p = r.professional
              const hubId = p._id || p.id
              return (
                <TableRow key={hubId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {p.firstName} {p.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {p.professionalId}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {Number(p.rating || 0).toFixed(1)} ★
                    <Typography variant="caption" display="block" color="text.secondary">
                      {p.totalReviews ?? 0} rev
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Chip size="small" label={fleetWorkloadLabel(r)} variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {p.availability} · {p.verificationStatus}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{r.activeJobs}</TableCell>
                  <TableCell align="right">{r.pipelineJobs}</TableCell>
                  <TableCell align="right">{r.workloadTotal}</TableCell>
                  <TableCell align="right">{formatHours(r.avgCompletionHours)}</TableCell>
                  <TableCell align="right">{p.completedJobs ?? 0}</TableCell>
                  <TableCell align="right">{p.cancelledJobs ?? 0}</TableCell>
                  <TableCell align="right">
                    {hubId ? (
                      <Button size="small" component={RouterLink} to={`/professionals/${hubId}`}>
                        Hub
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && sortedRows.length === 0 ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No professionals returned. Check permissions or API.
        </Alert>
      ) : null}
    </Box>
  )
}
