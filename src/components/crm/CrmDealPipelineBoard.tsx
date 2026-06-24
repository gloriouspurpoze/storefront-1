import React, { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Bell,
  CalendarClock,
  Check,
  Clock,
  MapPin,
  MoreHorizontal,
  Phone,
  Wrench,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import type { CrmDeal, CrmDealStage } from '../../types/crm.types'
import { DEAL_STAGE_THEME } from '../../lib/crmNiche'
import { getProfessionalCategoryLabel } from '../../constants/professionalCategories'
import {
  FOLLOW_UP_STATUS_LABEL,
  FOLLOW_UP_STATUS_STYLES,
  formatFollowUpWhen,
  type DealFollowUpSummary,
} from '../../lib/crmDealFollowUp'
import { daysInStage, formatDaysInStage } from '../../lib/crmDealPipelineMetrics'
import type { PipelineStageStats } from '../../lib/crmDealPipelineMetrics'

const dealDragId = (id: string) => `deal-${id}`
const columnDropId = (stage: CrmDealStage) => `column-${stage}`

type Props = {
  stages: CrmDealStage[]
  stageLabels: Record<CrmDealStage, string>
  deals: CrmDeal[]
  stageStats: PipelineStageStats[]
  followUpByDealId: Map<string, DealFollowUpSummary>
  canManage: boolean
  formatMoney: (amount: number, currency: string) => string
  currency: string
  onEdit: (deal: CrmDeal) => void
  onViewDeal?: (deal: CrmDeal) => void
  onMoveDeal: (dealId: string, newStage: CrmDealStage) => Promise<void>
  onScheduleFollowUp?: (deal: CrmDeal) => void
  onMarkFollowUpDone?: (activityId: string) => void
}

function probabilityTone(p: number): string {
  if (p >= 70) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
  if (p >= 40) return 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
  if (p >= 15) return 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
  return 'bg-muted text-muted-foreground'
}

function DealCard({
  deal,
  stage,
  followUp,
  canDrag,
  onEdit,
  onViewDeal,
  onScheduleFollowUp,
  onMarkFollowUpDone,
  formatMoney,
}: {
  deal: CrmDeal
  stage: CrmDealStage
  followUp: DealFollowUpSummary
  canDrag: boolean
  onEdit: (d: CrmDeal) => void
  onViewDeal?: (d: CrmDeal) => void
  onScheduleFollowUp?: (d: CrmDeal) => void
  onMarkFollowUpDone?: (activityId: string) => void
  formatMoney: (amount: number, currency: string) => string
}) {
  const theme = DEAL_STAGE_THEME[stage]
  const fuStyles = FOLLOW_UP_STATUS_STYLES[followUp.status]
  const staleDays = daysInStage(deal)
  const isStale = staleDays >= 7 && stage !== 'paid' && stage !== 'lost'

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dealDragId(deal.id),
    disabled: !canDrag,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    touchAction: canDrag ? ('none' as const) : undefined,
  }
  const a11yLabel = `${deal.name}, ${formatMoney(deal.amount, deal.currency)}, ${deal.probability} percent probability`

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      aria-label={canDrag ? a11yLabel : undefined}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all',
        'hover:border-border hover:shadow-md',
        canDrag && 'cursor-grab active:cursor-grabbing',
        isDragging && 'shadow-lg ring-2',
        isDragging && theme.cardRing
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', theme.headerBar)} aria-hidden />

      <div
        className="cursor-pointer pl-3 pr-2.5 pt-2.5"
        onClick={() => onViewDeal?.(deal)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onViewDeal?.(deal)
          }
        }}
        role={onViewDeal ? 'button' : undefined}
        tabIndex={onViewDeal ? 0 : undefined}
      >
        <div className="mb-2 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{deal.name}</p>
            <p className="mt-1 text-base font-bold tabular-nums tracking-tight">
              {formatMoney(deal.amount, deal.currency)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums', probabilityTone(deal.probability))}>
              {deal.probability}%
            </span>
            {isStale ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:text-orange-300">
                <Clock className="h-2.5 w-2.5" />
                {formatDaysInStage(staleDays)}
              </span>
            ) : staleDays > 0 ? (
              <span className="text-[10px] tabular-nums text-muted-foreground">{formatDaysInStage(staleDays)}</span>
            ) : null}
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-1">
          {deal.serviceCategory ? (
            <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px] font-normal">
              <Wrench className="h-2.5 w-2.5" />
              {getProfessionalCategoryLabel(deal.serviceCategory)}
            </Badge>
          ) : null}
          {deal.locality ? (
            <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px] font-normal">
              <MapPin className="h-2.5 w-2.5" />
              {deal.locality}
            </Badge>
          ) : null}
        </div>

        {deal.phone ? (
          <a
            href={`tel:${deal.phone}`}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3 w-3" />
            {deal.phone}
          </a>
        ) : null}
      </div>

      <div className={cn('mx-2.5 mb-2 rounded-lg border px-2 py-1.5 text-[11px] ml-3', fuStyles.strip)}>
        <div className="flex items-center gap-1.5">
          <Bell className="h-3 w-3 shrink-0 opacity-80" />
          <div className="min-w-0 flex-1">
            {followUp.nextActivity ? (
              <>
                <p className="truncate font-medium">{followUp.nextActivity.subject}</p>
                <p className="truncate opacity-90">
                  {followUp.nextActivity.dueAt
                    ? formatFollowUpWhen(followUp.nextActivity.dueAt)
                    : FOLLOW_UP_STATUS_LABEL[followUp.status]}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">{FOLLOW_UP_STATUS_LABEL.none}</p>
            )}
          </div>
          {followUp.nextActivity && onMarkFollowUpDone ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 opacity-70 hover:opacity-100"
              title="Mark done"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onMarkFollowUpDone(followUp.nextActivity!.id)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-2 py-1">
        {canDrag && onScheduleFollowUp ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs text-primary"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onScheduleFollowUp(deal)}
          >
            <CalendarClock className="h-3 w-3" />
            Follow-up
          </Button>
        ) : (
          <span />
        )}
        {canDrag ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onViewDeal ? (
                <DropdownMenuItem onClick={() => onViewDeal(deal)}>View details</DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => onEdit(deal)}>Edit deal</DropdownMenuItem>
              {onScheduleFollowUp ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onScheduleFollowUp(deal)}>Schedule follow-up</DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}

function StageColumn({
  stage,
  label,
  stats,
  formatMoney,
  currency,
  children,
}: {
  stage: CrmDealStage
  label: string
  stats: PipelineStageStats
  formatMoney: (amount: number, currency: string) => string
  currency: string
  children: React.ReactNode
}) {
  const theme = DEAL_STAGE_THEME[stage]
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(stage) })

  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`${label} stage column`}
      className={cn(
        'flex min-w-[288px] max-w-[300px] flex-none flex-col overflow-hidden rounded-xl border shadow-sm transition-all',
        theme.columnBg,
        theme.columnBorder,
        isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <div className={cn('h-1 w-full shrink-0', theme.headerBar)} aria-hidden />

      <div className="border-b border-border/40 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className={cn('truncate text-sm font-bold', theme.headerText)}>{label}</h3>
          <Badge className={cn('ml-auto h-5 min-w-5 justify-center border-0 px-1.5 text-[11px] font-bold', theme.countBadge)}>
            {stats.count}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
          <span className="font-semibold tabular-nums text-foreground">{formatMoney(stats.totalValue, currency)}</span>
          {stats.count > 0 ? (
            <span className="text-muted-foreground">
              Forecast {formatMoney(stats.weightedValue, currency)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-[160px] flex-1 flex-col gap-2.5 p-2">{children}</div>
    </div>
  )
}

export function CrmDealPipelineBoard({
  stages,
  stageLabels,
  deals,
  stageStats,
  followUpByDealId,
  canManage,
  formatMoney,
  currency,
  onEdit,
  onViewDeal,
  onMoveDeal,
  onScheduleFollowUp,
  onMarkFollowUpDone,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [a11yMessage, setA11yMessage] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const statsByStage = useMemo(() => {
    const map = new Map<CrmDealStage, PipelineStageStats>()
    for (const s of stageStats) map.set(s.stage, s)
    return map
  }, [stageStats])

  const resolveDropStage = (overId: string | undefined): CrmDealStage | null => {
    if (!overId) return null
    if (overId.startsWith('column-')) {
      const s = overId.slice('column-'.length) as CrmDealStage
      return stages.includes(s) ? s : null
    }
    if (overId.startsWith('deal-')) {
      const id = overId.slice('deal-'.length)
      const d = deals.find((x) => x.id === id)
      return d?.stage ?? null
    }
    return null
  }

  const handleDragStart = (e: DragStartEvent) => {
    if (canManage) setActiveId(String(e.active.id))
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const dealId = String(active.id).replace(/^deal-/, '')
    const newStage = resolveDropStage(String(over.id))
    const deal = deals.find((d) => d.id === dealId)
    if (!canManage || !deal || !newStage || deal.stage === newStage) return
    try {
      await onMoveDeal(dealId, newStage)
      setA11yMessage(`Deal moved to ${stageLabels[newStage]}`)
    } catch {
      setA11yMessage('Could not move deal')
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeDeal = activeId?.startsWith('deal-')
    ? deals.find((d) => dealDragId(d.id) === activeId)
    : undefined

  const body = (
    <div
      role="region"
      aria-label="Deal pipeline board. Drag deals between stages to update."
      className="flex min-w-0 items-stretch gap-3 overflow-x-auto pb-1 pt-0.5"
    >
      {stages.map((stage) => {
        const inStage = deals.filter((d) => d.stage === stage)
        const colStats = statsByStage.get(stage) ?? {
          stage,
          count: 0,
          totalValue: 0,
          weightedValue: 0,
        }
        return (
          <StageColumn
            key={stage}
            stage={stage}
            label={stageLabels[stage]}
            stats={colStats}
            formatMoney={formatMoney}
            currency={currency}
          >
            {inStage.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-8 text-center">
                <p className="text-xs font-medium text-muted-foreground">No deals</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">Drag here to move</p>
              </div>
            ) : (
              inStage.map((d) => (
                <DealCard
                  key={d.id}
                  deal={d}
                  stage={stage}
                  followUp={followUpByDealId.get(d.id) ?? { status: 'none', nextActivity: null, openCount: 0, overdueCount: 0 }}
                  canDrag={canManage}
                  onEdit={onEdit}
                  onViewDeal={onViewDeal}
                  onScheduleFollowUp={onScheduleFollowUp}
                  onMarkFollowUpDone={onMarkFollowUpDone}
                  formatMoney={formatMoney}
                />
              ))
            )}
          </StageColumn>
        )
      })}
    </div>
  )

  return (
    <div className="relative rounded-xl border border-border/60 bg-muted/15 p-3 sm:p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          aria-live="polite"
          aria-atomic="true"
          className="absolute h-px w-px overflow-hidden border-0 p-0 [clip:rect(0,0,0,0)] whitespace-nowrap"
        >
          {a11yMessage}
        </div>
        {body}
        {canManage ? (
          <DragOverlay dropAnimation={null}>
            {activeDeal ? (
              <div className="w-[288px] cursor-grabbing overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                <div className={cn('h-1', DEAL_STAGE_THEME[activeDeal.stage].headerBar)} />
                <div className="p-3">
                  <p className="text-sm font-semibold leading-snug">{activeDeal.name}</p>
                  <p className="mt-1 text-base font-bold">{formatMoney(activeDeal.amount, activeDeal.currency)}</p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        ) : null}
      </DndContext>
    </div>
  )
}
