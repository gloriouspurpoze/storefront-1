import React, { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import type { MarketingCalendarItem } from '../../types/marketingWorkspace.types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { CONTENT_TYPE_LABEL } from '../../lib/marketingWorkspaceLabels'

const DROP_PREFIX = 'cal-day:'

function DayColumn({ dateStr, children }: { dateStr: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${DROP_PREFIX}${dateStr}` })
  const day = parseISO(`${dateStr}T12:00:00`)
  const label = format(day, 'EEE d')
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[220px] w-[min(100%,11rem)] shrink-0 flex-col rounded-lg border bg-muted/30 p-2 transition-colors',
        isOver && 'border-primary bg-primary/[0.07]',
      )}
    >
      <div className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  )
}

function EntryCard({ row }: { row: MarketingCalendarItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: row.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-md border bg-background p-2 text-left shadow-sm',
        isDragging && 'z-50 opacity-90 ring-2 ring-primary',
      )}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...listeners}
          {...attributes}
          aria-label="Drag to reschedule"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-3 text-xs font-medium leading-snug">{row.title}</div>
          <Badge variant="outline" className="mt-1 text-[10px] font-normal">
            {CONTENT_TYPE_LABEL[row.contentType]}
          </Badge>
        </div>
      </div>
    </div>
  )
}

export interface CalendarWeekBoardProps {
  weekStart: string
  entries: MarketingCalendarItem[]
  onWeekShift: (deltaWeeks: number) => void
  onReschedule: (entryId: string, newDate: string) => Promise<void>
  disabled?: boolean
}

export function CalendarWeekBoard({
  weekStart,
  entries,
  onWeekShift,
  onReschedule,
  disabled,
}: CalendarWeekBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const days = useMemo(() => {
    const start = parseISO(`${weekStart}T12:00:00`)
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'))
  }, [weekStart])

  const byDay = useMemo(() => {
    const m = new Map<string, MarketingCalendarItem[]>()
    for (const d of days) m.set(d, [])
    for (const e of entries) {
      const key = e.scheduledDate.slice(0, 10)
      if (m.has(key)) m.get(key)!.push(e)
    }
    Array.from(m.values()).forEach((list) => {
      list.sort((a, b) => a.title.localeCompare(b.title))
    })
    return m
  }, [entries, days])

  const onDragEnd = async (event: DragEndEvent) => {
    if (disabled) return
    const { active, over } = event
    if (!over) return
    const overId = String(over.id)
    if (!overId.startsWith(DROP_PREFIX)) return
    const newDate = overId.slice(DROP_PREFIX.length)
    const entryId = String(active.id)
    const row = entries.find((e) => e.id === entryId)
    if (!row || row.scheduledDate.slice(0, 10) === newDate) return
    await onReschedule(entryId, newDate)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Week of <span className="font-medium text-foreground">{weekStart}</span>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onWeekShift(-1)} disabled={disabled}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onWeekShift(1)} disabled={disabled}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <DndContext sensors={sensors} onDragEnd={(e) => void onDragEnd(e)}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => (
            <DayColumn key={d} dateStr={d}>
              {(byDay.get(d) || []).map((row) => (
                <EntryCard key={row.id} row={row} />
              ))}
            </DayColumn>
          ))}
        </div>
      </DndContext>
      <p className="text-xs text-muted-foreground">
        Drag cards between days to reschedule. Each drop saves immediately via the API.
      </p>
    </div>
  )
}
