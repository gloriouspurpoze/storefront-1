import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, RefreshCw, Settings2, Star } from 'lucide-react'
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
import { PartnerLoyaltyService } from '../../services/api/partner-loyalty.service'
import type { PartnerLoyaltyRosterRow } from '../../types/partner-loyalty.types'
import { PartnerLoyaltyBadge } from '../../components/professionals/PartnerLoyaltyBadge'
import { tierBadgeVariant } from '../../lib/partnerLoyaltyScore'
import { usePermissions } from '../../hooks/usePermissions'

export function SupplyQualityPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_operating_terms')
  const [rows, setRows] = useState<PartnerLoyaltyRosterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await PartnerLoyaltyService.listRoster({
        page: 1,
        limit: 50,
        sortBy: 'score',
      })
      setRows(res.data?.rows ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load partner roster')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const recalculateAll = async () => {
    setRecalculating(true)
    try {
      await PartnerLoyaltyService.recalculateAll(300)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Recalculate failed')
    } finally {
      setRecalculating(false)
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Supply quality</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Partner loyalty tiers (Bronze → Elite) from live rating, job volume, and cancel rate. Higher tiers
            get lower commission and priority in job assignment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/operations/commercial/loyalty">
              <Settings2 className="mr-2 h-4 w-4" />
              Tier config
            </Link>
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void recalculateAll()}
              disabled={recalculating || loading}
            >
              {recalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Recalculate tiers
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partner loyalty roster</CardTitle>
          <CardDescription>Sorted by composite loyalty score — rating, jobs, cancel rate, verification.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No professionals returned.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pro</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Cancel %</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((pro) => {
                  const hubId = pro.professionalId
                  return (
                    <TableRow key={hubId}>
                      <TableCell className="font-medium">
                        {pro.firstName} {pro.lastName}
                        <div className="text-xs text-muted-foreground">{pro.city ?? ''}</div>
                      </TableCell>
                      <TableCell>
                        <PartnerLoyaltyBadge tier={pro.tier} label={pro.label} />
                      </TableCell>
                      <TableCell className="tabular-nums">{pro.score.toFixed(0)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Star className="h-3.5 w-3.5 text-bloom-coral" />
                          {pro.rating.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">{pro.completedJobs}</TableCell>
                      <TableCell className="tabular-nums">{pro.cancelRatePercent.toFixed(1)}%</TableCell>
                      <TableCell className="tabular-nums">{pro.commissionPercent}%</TableCell>
                      <TableCell>
                        <Badge variant={pro.isVerified ? tierBadgeVariant('silver') : 'outline'}>
                          {pro.verificationStatus ?? (pro.isVerified ? 'verified' : 'pending')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/professionals/${hubId}`}>Hub</Link>
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

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/professionals/operations">Workforce dashboard</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/provider-applications">Provider applications</Link>
        </Button>
      </div>
    </div>
  )
}
