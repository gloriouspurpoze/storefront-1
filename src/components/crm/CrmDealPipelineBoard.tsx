import React, { useState } from 'react'
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
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import type { CrmDeal, CrmDealStage } from '../../types/crm.types'

const dealDragId = (id: string) => `deal-${id}`
const columnDropId = (stage: CrmDealStage) => `column-${stage}`

type Props = {
  stages: CrmDealStage[]
  stageLabels: Record<CrmDealStage, string>
  deals: CrmDeal[]
  canManage: boolean
  formatMoney: (amount: number, currency: string) => string
  onEdit: (deal: CrmDeal) => void
  onViewDeal?: (deal: CrmDeal) => void
  onMoveDeal: (dealId: string, newStage: CrmDealStage) => Promise<void>
}

function DealCard({
  deal,
  canDrag,
  onEdit,
  onViewDeal,
  formatMoney,
}: {
  deal: CrmDeal
  canDrag: boolean
  onEdit: (d: CrmDeal) => void
  onViewDeal?: (d: CrmDeal) => void
  formatMoney: (amount: number, currency: string) => string
}) {
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
        'rounded-md border border-border p-1.5 transition-shadow',
        canDrag && 'cursor-grab active:cursor-grabbing',
        isDragging && 'shadow-md'
      )}
    >
      <span className="block text-sm font-semibold leading-snug">{deal.name}</span>
      <span className="mb-0 block text-xs text-muted-foreground">
        {formatMoney(deal.amount, deal.currency)} · {deal.probability}%
      </span>
      <div className="mt-1 flex flex-row flex-wrap gap-0.5">
        {onViewDeal ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onViewDeal(deal)}
          >
            Details
          </Button>
        ) : null}
        {canDrag ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEdit(deal)}
          >
            Edit
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function StageColumn({
  stage,
  label,
  count,
  children,
}: {
  stage: CrmDealStage
  label: string
  count: number
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(stage) })
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`${label} stage column`}
      className={cn(
        'min-w-[260px] max-w-[320px] flex-none rounded-md border border-border p-1 transition-colors',
        isOver ? 'bg-accent outline outline-2 outline-primary outline-offset-2' : 'bg-muted/50'
      )}
    >
      <h3 className="flex items-baseline px-1 py-1 text-sm font-bold leading-none">
        <span className="truncate">{label}</span>
        <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center px-1.5 text-xs">
          {count}
        </Badge>
      </h3>
      <div className="flex min-h-[120px] flex-col gap-1">{children}</div>
    </div>
  )
}

export function CrmDealPipelineBoard({
  stages,
  stageLabels,
  deals,
  canManage,
  formatMoney,
  onEdit,
  onViewDeal,
  onMoveDeal,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [a11yMessage, setA11yMessage] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

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
      className="flex min-w-0 items-start gap-2 overflow-x-auto pb-1"
    >
      {stages.map((stage) => {
        const inStage = deals.filter((d) => d.stage === stage)
        return (
          <StageColumn key={stage} stage={stage} label={stageLabels[stage]} count={inStage.length}>
            {inStage.map((d) => (
              <DealCard
                key={d.id}
                deal={d}
                canDrag={canManage}
                onEdit={onEdit}
                onViewDeal={onViewDeal}
                formatMoney={formatMoney}
              />
            ))}
          </StageColumn>
        )
      })}
    </div>
  )

  return (
    <div className="relative">
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
              <div className="w-[260px] cursor-grabbing rounded-md border border-border p-1.5 shadow-md">
                <p className="text-sm font-semibold leading-snug">{activeDeal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(activeDeal.amount, activeDeal.currency)} · {activeDeal.probability}%
                </p>
              </div>
            ) : null}
          </DragOverlay>
        ) : null}
      </DndContext>
    </div>
  )
}
