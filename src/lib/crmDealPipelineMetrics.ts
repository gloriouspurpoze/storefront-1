import type { CrmDeal, CrmDealStage } from '../types/crm.types'

export const CLOSED_DEAL_STAGES: CrmDealStage[] = ['paid', 'lost']

export interface PipelineStageStats {
  stage: CrmDealStage
  count: number
  totalValue: number
  weightedValue: number
}

export interface PipelineOverviewStats {
  openDeals: number
  pipelineValue: number
  weightedPipeline: number
  avgDealSize: number
  paidThisMonth: number
  overdueFollowUps: number
  noFollowUpCount: number
  byStage: PipelineStageStats[]
}

export function isOpenDealStage(stage: CrmDealStage): boolean {
  return !CLOSED_DEAL_STAGES.includes(stage)
}

export function computePipelineOverviewStats(
  deals: CrmDeal[],
  stages: CrmDealStage[],
  overdueFollowUps = 0,
  noFollowUpCount = 0
): PipelineOverviewStats {
  const openDeals = deals.filter((d) => isOpenDealStage(d.stage))
  const pipelineValue = openDeals.reduce((a, d) => a + d.amount, 0)
  const weightedPipeline = openDeals.reduce((a, d) => a + d.amount * (d.probability / 100), 0)

  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const paidThisMonth = deals.filter(
    (d) => d.stage === 'paid' && new Date(d.updatedAt) >= start
  ).length

  const byStage: PipelineStageStats[] = stages.map((stage) => {
    const inStage = deals.filter((d) => d.stage === stage)
    return {
      stage,
      count: inStage.length,
      totalValue: inStage.reduce((a, d) => a + d.amount, 0),
      weightedValue: inStage.reduce((a, d) => a + d.amount * (d.probability / 100), 0),
    }
  })

  return {
    openDeals: openDeals.length,
    pipelineValue,
    weightedPipeline,
    avgDealSize: openDeals.length ? pipelineValue / openDeals.length : 0,
    paidThisMonth,
    overdueFollowUps,
    noFollowUpCount,
    byStage,
  }
}

export function daysInStage(deal: CrmDeal): number {
  const ms = Date.now() - new Date(deal.updatedAt).getTime()
  return Math.max(0, Math.floor(ms / 86400000))
}

export function formatDaysInStage(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}
