import React, { useMemo } from 'react'
import {
  AlarmClock,
  CalendarClock,
  Handshake,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import type { CrmDeal, CrmDealStage } from '../../types/crm.types'
import { DEAL_STAGE_THEME } from '../../lib/crmNiche'
import { computePipelineOverviewStats, type PipelineOverviewStats } from '../../lib/crmDealPipelineMetrics'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'

type Props = {
  deals: CrmDeal[]
  stages: CrmDealStage[]
  stageLabels: Record<CrmDealStage, string>
  formatMoney: (amount: number, currency: string) => string
  currency: string
  overdueFollowUps: number
  noFollowUpCount: number
  activeStage?: string
  onStageClick?: (stage: CrmDealStage) => void
  onFollowUpFilter?: (filter: 'overdue' | 'none') => void
}

function KpiTile({
  icon,
  label,
  value,
  hint,
  tone = 'default',
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'warning' | 'success'
  onClick?: () => void
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-1 flex-col rounded-xl border bg-card p-3 text-left shadow-sm transition-colors sm:p-4',
        onClick && 'cursor-pointer hover:border-primary/40 hover:bg-accent/30',
        tone === 'warning' && 'border-destructive/25 bg-destructive/[0.03]',
        tone === 'success' && 'border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20'
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="truncate text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="truncate text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</p> : null}
    </Wrapper>
  )
}

function PipelineFunnel({
  stats,
  stageLabels,
  activeStage,
  onStageClick,
  formatMoney,
  currency,
}: {
  stats: PipelineOverviewStats
  stageLabels: Record<CrmDealStage, string>
  activeStage?: string
  onStageClick?: (stage: CrmDealStage) => void
  formatMoney: (amount: number, currency: string) => string
  currency: string
}) {
  const totalDeals = stats.byStage.reduce((a, s) => a + s.count, 0)
  const maxValue = Math.max(...stats.byStage.map((s) => s.totalValue), 1)

  if (totalDeals === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        Pipeline funnel appears when you add deals to stages.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pipeline by stage</p>
        <p className="text-xs text-muted-foreground">{totalDeals} deals · click a stage to filter</p>
      </div>

      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted/60">
        {stats.byStage.map((s) => {
          if (s.count === 0) return null
          const width = (s.count / totalDeals) * 100
          const theme = DEAL_STAGE_THEME[s.stage]
          return (
            <button
              key={s.stage}
              type="button"
              title={`${stageLabels[s.stage]}: ${s.count}`}
              onClick={() => onStageClick?.(s.stage)}
              style={{ width: `${Math.max(width, 4)}%` }}
              className={cn(
                'h-full min-w-[4px] transition-opacity hover:opacity-80',
                theme.funnelFill,
                activeStage === s.stage && 'ring-2 ring-primary ring-offset-1'
              )}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {stats.byStage.map((s) => {
          const theme = DEAL_STAGE_THEME[s.stage]
          const isActive = activeStage === s.stage
          const valuePct = maxValue > 0 ? (s.totalValue / maxValue) * 100 : 0
          return (
            <button
              key={s.stage}
              type="button"
              onClick={() => onStageClick?.(s.stage)}
              className={cn(
                'group rounded-lg border bg-card p-2.5 text-left transition-all hover:shadow-sm',
                isActive ? 'border-primary ring-2 ring-primary/20' : 'border-border/80 hover:border-primary/30'
              )}
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', theme.headerDot)} />
                <span className="truncate text-xs font-semibold">{stageLabels[s.stage]}</span>
                <span className="ml-auto text-xs font-bold tabular-nums text-muted-foreground">{s.count}</span>
              </div>
              <p className="truncate text-sm font-bold tabular-nums">{formatMoney(s.totalValue, currency)}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/50">
                <div className={cn('h-full rounded-full transition-all', theme.funnelFill)} style={{ width: `${valuePct}%` }} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CrmDealPipelineOverview({
  deals,
  stages,
  stageLabels,
  formatMoney,
  currency,
  overdueFollowUps,
  noFollowUpCount,
  activeStage,
  onStageClick,
  onFollowUpFilter,
}: Props) {
  const stats = useMemo(
    () => computePipelineOverviewStats(deals, stages, overdueFollowUps, noFollowUpCount),
    [deals, stages, overdueFollowUps, noFollowUpCount]
  )

  return (
    <Card className="mb-4 overflow-hidden border-border/80 shadow-sm">
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <KpiTile
            icon={<TrendingUp className="h-4 w-4 shrink-0 text-primary" />}
            label="Open pipeline"
            value={formatMoney(stats.pipelineValue, currency)}
            hint={`${stats.openDeals} active deals`}
          />
          <KpiTile
            icon={<Target className="h-4 w-4 shrink-0 text-sky-600" />}
            label="Forecast"
            value={formatMoney(stats.weightedPipeline, currency)}
            hint="Probability-weighted"
          />
          <KpiTile
            icon={<Handshake className="h-4 w-4 shrink-0 text-violet-600" />}
            label="Avg deal"
            value={formatMoney(stats.avgDealSize, currency)}
            hint="Per open deal"
          />
          <KpiTile
            icon={<Trophy className="h-4 w-4 shrink-0 text-emerald-600" />}
            label="Won (month)"
            value={String(stats.paidThisMonth)}
            hint="Paid this month"
            tone="success"
          />
          <KpiTile
            icon={<AlarmClock className="h-4 w-4 shrink-0 text-destructive" />}
            label="Overdue"
            value={String(stats.overdueFollowUps)}
            hint={stats.overdueFollowUps ? 'Follow-ups past due' : 'All caught up'}
            tone={stats.overdueFollowUps > 0 ? 'warning' : 'default'}
            onClick={stats.overdueFollowUps > 0 && onFollowUpFilter ? () => onFollowUpFilter('overdue') : undefined}
          />
          <KpiTile
            icon={<CalendarClock className="h-4 w-4 shrink-0 text-amber-600" />}
            label="No follow-up"
            value={String(stats.noFollowUpCount)}
            hint="Deals without reminders"
            onClick={stats.noFollowUpCount > 0 && onFollowUpFilter ? () => onFollowUpFilter('none') : undefined}
          />
        </div>

        <PipelineFunnel
          stats={stats}
          stageLabels={stageLabels}
          activeStage={activeStage}
          onStageClick={onStageClick}
          formatMoney={formatMoney}
          currency={currency}
        />
      </CardContent>
    </Card>
  )
}
