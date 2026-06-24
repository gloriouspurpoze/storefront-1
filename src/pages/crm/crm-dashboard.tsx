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
  Cell,
} from 'recharts'
import { CHART_TOKENS, CHART_CATEGORICAL } from '../../lib/chartPalette'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import type { CrmActivity, CrmDeal, CrmDealStage, CrmMetrics } from '../../types/crm.types'
import { ACTIVITY_TYPE_LABELS, DEAL_PIPELINE_STAGES, DEAL_STAGE_LABELS, coerceCrmMetrics, migrateDealStage, normalizeDealsByStage } from '../../lib/crmNiche'
import { formatMoneyAmount, APP_CURRENCY } from '../../lib/utils'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { CrmWhatsAppStaffPlaybook } from '../../components/crm/CrmWhatsAppStaffPlaybook'

const EMPTY_METRICS: CrmMetrics = {
  pipelineValue: 0,
  weightedPipeline: 0,
  openDeals: 0,
  paidThisMonth: 0,
  activeLeads: 0,
  overdueTasks: 0,
  dealsByStage: DEAL_PIPELINE_STAGES.reduce(
    (acc, s) => {
      acc[s] = 0
      return acc
    },
    {} as Record<CrmDealStage, number>
  ),
}

/** Backend may still return legacy stage keys with zero counts — rebuild from deal rows when needed. */
function enrichMetricsFromDeals(metrics: CrmMetrics, deals: CrmDeal[]): CrmMetrics {
  const chartTotal = Object.values(metrics.dealsByStage).reduce((a, b) => a + b, 0)
  if (chartTotal > 0 || deals.length === 0) return metrics

  const raw: Record<string, number> = {}
  for (const d of deals) {
    const stage = migrateDealStage(d.stage)
    raw[stage] = (raw[stage] ?? 0) + 1
  }
  return { ...metrics, dealsByStage: normalizeDealsByStage(raw) }
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
    Promise.all([crmService.getMetrics(), crmService.listActivities(), crmService.listDeals()])
      .then(([m, acts, deals]) => {
        if (cancelled) return
        const metrics = enrichMetricsFromDeals(coerceCrmMetrics(m), deals)
        setMetrics(metrics)
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
    return DEAL_PIPELINE_STAGES.map((k, i) => ({
      stage: k,
      name: DEAL_STAGE_LABELS[k],
      deals: metrics.dealsByStage[k] ?? 0,
      fill: CHART_CATEGORICAL[i % CHART_CATEGORICAL.length],
    }))
  }, [metrics])

  const chartDealTotal = useMemo(() => chartData.reduce((a, d) => a + d.deals, 0), [chartData])

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="CRM"
        subtitle="ProFixer.in job pipeline — MongoDB via /api/crm. Use WhatsApp lead source + activities; link platform IDs when jobs exist."
      />
      <CrmSubnav />
      {/* <div className="mb-6">
        <CrmWhatsAppStaffPlaybook />
      </div> */}

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
                  <Trophy className="h-4 w-4 text-storm-deep" aria-hidden />
                  <span className="text-sm">Paid (this month)</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{metrics.paidThisMonth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <UserSearch className="h-4 w-4" aria-hidden />
                  <span className="text-sm">Active leads (funnel)</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{metrics.activeLeads}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <AlarmClock className="h-4 w-4 text-bloom-coral" aria-hidden />
                  <span className="text-sm">Overdue tasks</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{metrics.overdueTasks}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardContent className="pt-6">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">Deals by stage</h2>
                    <p className="text-xs text-muted-foreground">
                      Revenue pipeline deals — not the same as active leads ({metrics.activeLeads} contacts in funnel).
                    </p>
                  </div>
                  {chartDealTotal > 0 ? (
                    <p className="text-sm font-medium tabular-nums text-muted-foreground">{chartDealTotal} deals total</p>
                  ) : null}
                </div>
                <div className="relative h-80 w-full min-h-[240px]">
                  {chartDealTotal === 0 ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 text-center">
                      <p className="text-sm font-medium">No deals in pipeline yet</p>
                      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        Create deals under CRM → Deals. Leads ({metrics.activeLeads}) are contacts — they appear here only after you add a deal.
                      </p>
                    </div>
                  ) : null}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} opacity={0.6} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART_TOKENS.axis }} interval={0} angle={-20} textAnchor="end" height={56} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: CHART_TOKENS.axis }} />
                      <Tooltip
                        contentStyle={{ background: CHART_TOKENS.surface, borderColor: CHART_TOKENS.grid, color: CHART_TOKENS.ink }}
                        formatter={(value: number) => [value, 'Deals']}
                      />
                      <Bar dataKey="deals" radius={[4, 4, 0, 0]} maxBarSize={48}>
                        {chartData.map((entry) => (
                          <Cell key={entry.stage} fill={entry.fill} />
                        ))}
                      </Bar>
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
                          {ACTIVITY_TYPE_LABELS[a.type]}
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
