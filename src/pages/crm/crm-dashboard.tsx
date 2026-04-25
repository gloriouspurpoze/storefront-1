import React, { useEffect, useMemo, useState } from 'react'
import {
  AlarmClock,
  Handshake,
  Landmark,
  Loader2,
  TrendingUp,
  Trophy,
  UserSearch,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import type { CrmActivity, CrmDealStage, CrmMetrics } from '../../types/crm.types'
import { formatMoneyAmount, APP_CURRENCY } from '../../lib/utils'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

const STAGE_LABELS: Record<CrmDealStage, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

const EMPTY_METRICS: CrmMetrics = {
  pipelineValue: 0,
  weightedPipeline: 0,
  openDeals: 0,
  wonThisMonth: 0,
  activeLeads: 0,
  overdueTasks: 0,
  dealsByStage: {
    lead: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  },
}

export function CrmDashboard() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const [tick, setTick] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<CrmMetrics>(EMPTY_METRICS)
  const [recent, setRecent] = useState<CrmActivity[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    Promise.all([crmService.getMetrics(), crmService.listActivities()])
      .then(([m, acts]) => {
        if (cancelled) return
        setMetrics(m)
        setRecent(
          [...acts]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 6)
        )
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not load CRM overview. Check your connection and try again.')
          setMetrics(EMPTY_METRICS)
          setRecent([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const chartData = useMemo(() => {
    return (Object.keys(metrics.dealsByStage) as CrmDealStage[]).map((k) => ({
      name: STAGE_LABELS[k],
      deals: metrics.dealsByStage[k],
    }))
  }, [metrics])

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="CRM"
        subtitle="Pipeline, accounts, and activities — use local demo data or connect fixer-backend (REACT_APP_CRM_USE_API)."
        action={
          canManage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await crmService.resetDemoData()
                setTick((x) => x + 1)
              }}
            >
              Reset demo data
            </Button>
          ) : undefined
        }
      />
      <CrmSubnav />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{loadError}</span>
          <Button type="button" variant="outline" size="sm" className="shrink-0 border-destructive/50" onClick={() => setTick((x) => x + 1)}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
                  <span className="text-sm">Open pipeline</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{formatMoneyAmount(metrics.pipelineValue, APP_CURRENCY)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <Landmark className="h-4 w-4" aria-hidden />
                  <span className="text-sm">Weighted pipeline</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{formatMoneyAmount(metrics.weightedPipeline, APP_CURRENCY)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <Handshake className="h-4 w-4" aria-hidden />
                  <span className="text-sm">Open deals</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{metrics.openDeals}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-4 w-4 text-emerald-600" aria-hidden />
                  <span className="text-sm">Won (this month)</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{metrics.wonThisMonth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <UserSearch className="h-4 w-4" aria-hidden />
                  <span className="text-sm">Active funnel contacts</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{metrics.activeLeads}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <AlarmClock className="h-4 w-4 text-amber-600" aria-hidden />
                  <span className="text-sm">Overdue tasks</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{metrics.overdueTasks}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardContent className="pt-6">
                <h2 className="mb-4 text-lg font-semibold">Deals by stage</h2>
                <div className="h-80 w-full min-h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.4} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="deals" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-5">
              <CardContent className="pt-6">
                <h2 className="mb-2 text-lg font-semibold">Recent activity</h2>
                <ul className="space-y-3 text-sm">
                  {recent.map((a) => (
                    <li key={a.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <p className="font-medium leading-snug">{a.subject}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-xs font-normal">
                          {a.type}
                        </Badge>
                        <Badge
                          variant={a.status === 'done' ? 'success' : a.status === 'open' ? 'default' : 'secondary'}
                          className="text-xs font-normal capitalize"
                        >
                          {a.status}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
