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
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
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
    <Paper
      ref={setNodeRef}
      variant="outlined"
      style={style}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      aria-label={canDrag ? a11yLabel : undefined}
      sx={{
        p: 1.5,
        cursor: canDrag ? 'grab' : 'default',
        '&:active': canDrag ? { cursor: 'grabbing' } : undefined,
        transition: 'box-shadow 0.15s ease',
        boxShadow: isDragging ? 4 : undefined,
      }}
    >
      <Typography variant="body2" fontWeight={600} component="span" display="block">
        {deal.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" component="span" display="block">
        {formatMoney(deal.amount, deal.currency)} · {deal.probability}%
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
        {onViewDeal ? (
          <Button size="small" onPointerDown={(e) => e.stopPropagation()} onClick={() => onViewDeal(deal)}>
            Details
          </Button>
        ) : null}
        {canDrag ? (
          <Button size="small" onPointerDown={(e) => e.stopPropagation()} onClick={() => onEdit(deal)}>
            Edit
          </Button>
        ) : null}
      </Stack>
    </Paper>
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
    <Paper
      ref={setNodeRef}
      variant="outlined"
      role="group"
      aria-label={`${label} stage column`}
      sx={{
        minWidth: 260,
        maxWidth: 320,
        flex: '0 0 auto',
        bgcolor: isOver ? 'action.selected' : 'action.hover',
        p: 1,
        outline: isOver ? '2px solid' : 'none',
        outlineColor: 'primary.main',
        outlineOffset: 2,
        transition: 'background-color 0.15s ease',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ px: 1, py: 1 }} component="h3">
        {label}
        <Chip size="small" label={count} sx={{ ml: 1 }} />
      </Typography>
      <Stack spacing={1} sx={{ minHeight: 120 }}>
        {children}
      </Stack>
    </Paper>
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
    <Box
      role="region"
      aria-label="Deal pipeline board. Drag deals between stages to update."
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        pb: 1,
        alignItems: 'flex-start',
      }}
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
    </Box>
  )

  return (
    <Box sx={{ position: 'relative' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Box
          component="div"
          aria-live="polite"
          aria-atomic="true"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {a11yMessage}
        </Box>
        {body}
      {canManage ? (
        <DragOverlay dropAnimation={null}>
          {activeDeal ? (
            <Paper variant="outlined" sx={{ p: 1.5, width: 260, boxShadow: 6, cursor: 'grabbing' }}>
              <Typography variant="body2" fontWeight={600}>
                {activeDeal.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatMoney(activeDeal.amount, activeDeal.currency)} · {activeDeal.probability}%
              </Typography>
            </Paper>
          ) : null}
        </DragOverlay>
      ) : null}
      </DndContext>
    </Box>
  )
}
