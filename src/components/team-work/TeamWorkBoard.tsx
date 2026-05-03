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
import { Bug, BookOpen, Flag, Layers, ListTodo } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import {
  assigneeSwatchClass,
  initialsFromLabel,
  PRIORITY_CHIP,
  STATUS_ACCENT,
  priorityLabel,
} from '../../lib/teamWorkVisuals'
import type { TeamWorkItem, TeamWorkStatus } from '../../types/teamWork.types'

const itemDragId = (id: string) => `tw-${id}`
const columnDropId = (status: TeamWorkStatus) => `col-${status}`

function IssueTypeIcon({ type }: { type: TeamWorkItem['issueType'] }) {
  const cls = 'h-3.5 w-3.5 shrink-0 text-muted-foreground'
  if (type === 'bug') return <Bug className={cls} aria-hidden />
  if (type === 'story') return <BookOpen className={cls} aria-hidden />
  if (type === 'epic') return <Flag className={cls} aria-hidden />
  return <ListTodo className={cls} aria-hidden />
}

function WorkCard({
  item,
  canDrag,
  assigneeLabel,
  assigneeId,
  onOpen,
}: {
  item: TeamWorkItem
  canDrag: boolean
  assigneeLabel?: string
  assigneeId?: string
  onOpen: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: itemDragId(item.id),
    disabled: !canDrag,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    touchAction: canDrag ? ('none' as const) : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      className={cn(
        'rounded-lg border border-y border-r border-border/80 border-l-[3px] bg-card p-2.5 shadow-sm transition-shadow hover:border-primary/25 hover:shadow-md',
        STATUS_ACCENT[item.status] ?? STATUS_ACCENT.backlog,
        canDrag && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div className="flex items-start gap-2">
        <IssueTypeIcon type={item.issueType} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground">{item.issueKey}</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide',
                PRIORITY_CHIP[item.priority] ?? PRIORITY_CHIP.medium,
              )}
              title={item.priority}
            >
              {priorityLabel(item.priority)}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-3 text-sm font-medium leading-snug text-foreground">{item.title}</p>
          {assigneeLabel && assigneeId ? (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-background',
                  assigneeSwatchClass(assigneeId),
                )}
                title={assigneeLabel}
              >
                {initialsFromLabel(assigneeLabel)}
              </span>
              <span className="truncate text-xs font-medium text-foreground/90">{assigneeLabel}</span>
            </div>
          ) : assigneeLabel ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{assigneeLabel}</p>
          ) : (
            <p className="mt-1.5 text-[11px] font-medium italic text-muted-foreground/80">Unassigned</p>
          )}
          {item.labels?.length ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.labels.slice(0, 4).map((lb) => (
                <Badge key={lb} variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                  {lb}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-1 border-t border-border/60 pt-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onOpen(item.id)}
        >
          Open
        </Button>
      </div>
    </div>
  )
}

function Column({
  status,
  label,
  items,
  canDrag,
  assigneeMap,
  onOpen,
}: {
  status: TeamWorkStatus
  label: string
  items: TeamWorkItem[]
  canDrag: boolean
  assigneeMap: Map<string, string>
  onOpen: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(status) })
  return (
    <div className="flex min-h-[420px] w-[280px] shrink-0 flex-col rounded-xl border border-border/70 bg-muted/20">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold">{label}</span>
          <Badge variant="outline" className="h-5 min-w-[1.5rem] justify-center px-1.5 text-[11px]">
            {items.length}
          </Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-2 overflow-y-auto p-2',
          isOver && canDrag && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
        )}
      >
        {items.map((it) => (
          <WorkCard
            key={it.id}
            item={it}
            canDrag={canDrag}
            assigneeId={it.assigneeUserId}
            assigneeLabel={it.assigneeUserId ? assigneeMap.get(it.assigneeUserId) : undefined}
            onOpen={onOpen}
          />
        ))}
        {items.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">No items — drop here or create new.</p>
        ) : null}
      </div>
    </div>
  )
}

type Props = {
  statuses: TeamWorkStatus[]
  statusLabels: Record<TeamWorkStatus, string>
  items: TeamWorkItem[]
  canManage: boolean
  assigneeMap: Map<string, string>
  onMoveItem: (itemId: string, newStatus: TeamWorkStatus) => Promise<void>
  onOpenItem: (id: string) => void
}

export function TeamWorkBoard({
  statuses,
  statusLabels,
  items,
  canManage,
  assigneeMap,
  onMoveItem,
  onOpenItem,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const byStatus = useMemo(() => {
    const m = new Map<TeamWorkStatus, TeamWorkItem[]>()
    for (const s of statuses) m.set(s, [])
    for (const it of items) {
      const list = m.get(it.status)
      if (list) list.push(it)
    }
    for (const s of statuses) {
      m.set(
        s,
        [...(m.get(s) || [])].sort((a, b) => a.boardRank - b.boardRank || b.updatedAt.localeCompare(a.updatedAt)),
      )
    }
    return m
  }, [items, statuses])

  const activeItem = activeId ? items.find((i) => itemDragId(i.id) === activeId) : undefined

  const parseColumn = (dropId: string): TeamWorkStatus | null => {
    if (!dropId.startsWith('col-')) return null
    const st = dropId.slice(4) as TeamWorkStatus
    return statuses.includes(st) ? st : null
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const overId = e.over?.id?.toString()
    const active = e.active?.id?.toString()
    if (!overId || !active || !active.startsWith('tw-')) return
    const itemId = active.slice(3)
    const newStatus = parseColumn(overId)
    if (!newStatus) return
    const cur = items.find((i) => i.id === itemId)
    if (!cur || cur.status === newStatus) return
    await onMoveItem(itemId, newStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(ev: DragStartEvent) => setActiveId(String(ev.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {statuses.map((st) => (
          <Column
            key={st}
            status={st}
            label={statusLabels[st] ?? st}
            items={byStatus.get(st) || []}
            canDrag={canManage}
            assigneeMap={assigneeMap}
            onOpen={onOpenItem}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="w-[260px] rounded-lg border border-primary/40 bg-card p-2.5 shadow-lg">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground">{activeItem.issueKey}</span>
            <p className="mt-1 text-sm font-medium leading-snug">{activeItem.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
