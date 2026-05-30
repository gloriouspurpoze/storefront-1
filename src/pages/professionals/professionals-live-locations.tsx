/**
 * Admin view: last reported GPS + online/busy/offline for each professional (polling).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Loader2, MapPin, Radio, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { ProfessionalsService } from '../../services/api/professionals.service'
import type { ProfessionalLiveLocationRow } from '../../types/professional.types'
import {
  professionalPresenceStore,
  useProfessionalPresenceVersion,
} from '../../state/professionalPresence'
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

const POLL_MS = 30_000

function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function ProfessionalsLiveLocations() {
  const [rows, setRows] = useState<ProfessionalLiveLocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  // Bumps every time a presence heartbeat arrives — `mergedRows` recomputes.
  const presenceVersion = useProfessionalPresenceVersion()

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await ProfessionalsService.getLiveLocationsForAdmin()
      if (res && typeof res === 'object' && 'success' in res && res.success === false) {
        throw new Error((res as { message?: string }).message || 'Request failed')
      }
      const data = (res as { data?: ProfessionalLiveLocationRow[] })?.data
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load live locations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!autoRefresh) return
    const t = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(t)
  }, [autoRefresh, load])

  /**
   * Merge live `professional:presence` heartbeats into the poll dataset.
   * Live wins when it's fresher than the poll's `lastLocationAt` (or when
   * the poll has no timestamp at all).
   */
  const mergedRows = useMemo(() => {
    // `presenceVersion` is the dep that re-runs this when a heartbeat
    // arrives between polls; keep the eslint-exhaustive-deps rule honest.
    void presenceVersion
    return rows.map((r) => {
      const id = r.professionalId ?? r.id
      const live = professionalPresenceStore.get(id ?? null)
      if (!live) return { ...r, _isLive: false as const }
      const liveSeenMs = live.lastSeen ? new Date(live.lastSeen).getTime() : 0
      const pollSeenMs = r.lastLocationAt ? new Date(r.lastLocationAt).getTime() : 0
      const liveFresher = liveSeenMs > pollSeenMs
      return {
        ...r,
        availability: liveFresher ? live.status : r.availability,
        latitude: liveFresher && live.location ? live.location.latitude : r.latitude,
        longitude: liveFresher && live.location ? live.location.longitude : r.longitude,
        lastLocationAt: liveFresher ? live.lastSeen : r.lastLocationAt,
        _isLive: true as const,
      }
    })
  }, [rows, presenceVersion])

  return (
    <div>
      <PageHeader
        title="Live locations"
        subtitle="Real-time presence + last GPS sample from the provider app. Heartbeats stream over the live-ops socket; the 30s poll is a fallback for missed sockets."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" asChild>
              <Link to="/professionals">Back to professionals</Link>
            </Button>
            <Button
              type="button"
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh((v) => !v)}
            >
              Auto-refresh {autoRefresh ? 'on' : 'off'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      <Card className="mt-4">
        <CardContent className="pt-6">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last GPS</TableHead>
                    <TableHead className="text-right">Map</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && mergedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading…
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : mergedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No professionals returned.
                      </TableCell>
                    </TableRow>
                  ) : (
                    mergedRows.map((r) => {
                      const hasCoords =
                        r.latitude != null &&
                        r.longitude != null &&
                        Number.isFinite(r.latitude) &&
                        Number.isFinite(r.longitude)
                      const variant: 'success' | 'warning' | 'secondary' =
                        r.availability === 'available'
                          ? 'success'
                          : r.availability === 'busy'
                            ? 'warning'
                            : 'secondary'
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {r.professionalId ?? r.id}
                          </TableCell>
                          <TableCell>{r.phone || '—'}</TableCell>
                          <TableCell>
                            <div className="inline-flex items-center gap-1.5">
                              <Badge variant={variant}>{r.availability}</Badge>
                              {r._isLive ? (
                                <Radio
                                  className="h-3 w-3 animate-pulse text-storm-deep"
                                  aria-label="Live heartbeat received"
                                />
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {formatTime(r.lastLocationAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {hasCoords ? (
                              <a
                                href={mapsUrl(r.latitude as number, r.longitude as number)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <MapPin className="h-4 w-4" />
                                Open
                                <ExternalLink className="h-3 w-3 opacity-70" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">No fix</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
