import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, RefreshCw, Star } from 'lucide-react'
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
import { ProfessionalsService } from '../../services/api/professionals.service'
import type { Professional } from '../../types/professional.types'

function tierFor(pro: Professional): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  const r = pro.rating ?? 0
  const verified = pro.isVerified || pro.verificationStatus === 'verified'
  const jobs = pro.completedJobs ?? 0
  if (verified && r >= 4.5 && jobs >= 10) return { label: 'Gold', variant: 'default' }
  if (verified && r >= 4.0 && jobs >= 3) return { label: 'Silver', variant: 'secondary' }
  return { label: 'Standard', variant: 'outline' }
}

export function SupplyQualityPage() {
  const [rows, setRows] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await ProfessionalsService.getProfessionals({
        page: 1,
        limit: 50,
        sortBy: 'rating',
        sortOrder: 'desc',
      })
      if (res.success && res.data?.professionals) {
        setRows(res.data.professionals)
      } else {
        setRows([])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load professionals')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Supply quality</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Marketplaces live or die on supply quality. This view surfaces rating, verification, and job
            volume — use it before rolling automated tiering or incentives.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top-rated professionals (sample)</CardTitle>
          <CardDescription>Heuristic tiers — replace with scored model when analytics pipeline lands.</CardDescription>
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
                  <TableHead>Rating</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((pro) => {
                  const tier = tierFor(pro)
                  const hubId = pro._id || pro.id
                  return (
                    <TableRow key={hubId}>
                      <TableCell className="font-medium">
                        {pro.firstName} {pro.lastName}
                        <div className="text-xs text-muted-foreground">{pro.address?.city ?? ''}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tier.variant}>{tier.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Star className="h-3.5 w-3.5 text-bloom-coral" />
                          {(pro.rating ?? 0).toFixed(1)}
                          <span className="text-muted-foreground">({pro.totalReviews ?? 0})</span>
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">{pro.completedJobs ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={pro.isVerified ? 'secondary' : 'outline'}>
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
