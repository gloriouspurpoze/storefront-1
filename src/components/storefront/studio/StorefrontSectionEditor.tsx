import React from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Switch } from '../../ui'
import type { StorefrontSection, StorefrontSectionCatalogItem } from '../../../services/api/storefrontStudio.service'

function SortableRow({
  section,
  label,
  onToggle,
}: {
  section: StorefrontSection
  label: string
  onToggle: (enabled: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2"
    >
      <button type="button" className="cursor-grab touch-none p-1" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{section.type}</div>
      </div>
      <Switch checked={section.enabled} onCheckedChange={onToggle} />
    </div>
  )
}

export function StorefrontSectionEditor({
  sections,
  catalog,
  onChange,
}: {
  sections: StorefrontSection[]
  catalog: StorefrontSectionCatalogItem[]
  onChange: (next: StorefrontSection[]) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const sorted = [...sections].sort((a, b) => a.order - b.order)
  const labelFor = (type: string) => catalog.find((c) => c.type === type)?.label ?? type

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sorted.findIndex((s) => s.id === active.id)
    const newIndex = sorted.findIndex((s) => s.id === over.id)
    const moved = arrayMove(sorted, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }))
    onChange(moved)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={sorted.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sorted.map((section) => (
            <SortableRow
              key={section.id}
              section={section}
              label={labelFor(section.type)}
              onToggle={(enabled) =>
                onChange(sections.map((s) => (s.id === section.id ? { ...s, enabled } : s)))
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
