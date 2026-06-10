import React, { useState } from 'react'
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
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card, CardContent } from '../ui/card'
import { RichTextField } from '../forms/RichTextField'
import { cn } from '../../lib/utils'
import {
  SECTION_TYPE_META,
  createSection,
  type ContentSection,
  type ContentSectionType,
  type SectionCauseFix,
  type SectionFaq,
  type SectionHowToStep,
  type SectionPriceRow,
} from '../../types/seoLandingSections'

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

function linesToArray(text: string): string[] {
  return text.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim().length > 0)
}

function SectionBody({
  section,
  onChange,
  disabled,
}: {
  section: ContentSection
  onChange: (patch: Partial<ContentSection>) => void
  disabled?: boolean
}) {
  const headingField = (
    <div className="space-y-1.5">
      <Label className="text-xs">Heading (optional)</Label>
      <Input
        value={section.heading ?? ''}
        onChange={(e) => onChange({ heading: e.target.value })}
        placeholder="Section heading"
        disabled={disabled}
      />
    </div>
  )

  switch (section.type) {
    case 'rich_text':
      return (
        <div className="space-y-3">
          {headingField}
          <RichTextField
            label="Content"
            value={section.html ?? ''}
            onChange={(html) => onChange({ html })}
            disabled={disabled}
            height={220}
            placeholder="Write the section content…"
          />
        </div>
      )

    case 'callout':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {headingField}
            <div className="space-y-1.5">
              <Label className="text-xs">Style</Label>
              <select
                className={SELECT_CLASS}
                value={section.variant ?? 'info'}
                onChange={(e) => onChange({ variant: e.target.value as ContentSection['variant'] })}
                disabled={disabled}
              >
                <option value="info">Info (blue)</option>
                <option value="tip">Tip (green)</option>
                <option value="warning">Warning (amber)</option>
              </select>
            </div>
          </div>
          <RichTextField
            label="Callout text"
            value={section.html ?? ''}
            onChange={(html) => onChange({ html })}
            disabled={disabled}
            height={140}
          />
        </div>
      )

    case 'key_takeaways':
      return (
        <div className="space-y-3">
          {headingField}
          <div className="space-y-1.5">
            <Label className="text-xs">Bullets (one per line)</Label>
            <Textarea
              rows={5}
              value={(section.items ?? []).join('\n')}
              onChange={(e) => onChange({ items: linesToArray(e.target.value) })}
              placeholder={'First takeaway\nSecond takeaway'}
              disabled={disabled}
            />
          </div>
        </div>
      )

    case 'faqs':
      return (
        <div className="space-y-3">
          {headingField}
          <RepeatableList<SectionFaq>
            items={section.faqs ?? []}
            onChange={(faqs) => onChange({ faqs })}
            emptyItem={{ question: '', answer: '' }}
            addLabel="Add FAQ"
            disabled={disabled}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Input
                  value={item.question}
                  onChange={(e) => update({ question: e.target.value })}
                  placeholder="Question"
                  disabled={disabled}
                />
                <Textarea
                  rows={3}
                  value={item.answer}
                  onChange={(e) => update({ answer: e.target.value })}
                  placeholder="Answer (HTML allowed)"
                  disabled={disabled}
                />
              </div>
            )}
          />
        </div>
      )

    case 'price_table':
      return (
        <div className="space-y-3">
          {headingField}
          <RepeatableList<SectionPriceRow>
            items={section.rows ?? []}
            onChange={(rows) => onChange({ rows })}
            emptyItem={{ item: '', priceFrom: 0, priceTo: 0 }}
            addLabel="Add price row"
            disabled={disabled}
            renderItem={(row, update) => (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input
                  className="sm:col-span-2"
                  value={row.item}
                  onChange={(e) => update({ item: e.target.value })}
                  placeholder="Item"
                  disabled={disabled}
                />
                <Input
                  type="number"
                  value={String(row.priceFrom ?? '')}
                  onChange={(e) => update({ priceFrom: Number(e.target.value) })}
                  placeholder="From"
                  disabled={disabled}
                />
                <Input
                  type="number"
                  value={String(row.priceTo ?? '')}
                  onChange={(e) => update({ priceTo: Number(e.target.value) })}
                  placeholder="To"
                  disabled={disabled}
                />
                <Input
                  className="sm:col-span-4"
                  value={row.note ?? ''}
                  onChange={(e) => update({ note: e.target.value })}
                  placeholder="Note (optional)"
                  disabled={disabled}
                />
              </div>
            )}
          />
        </div>
      )

    case 'how_to':
      return (
        <div className="space-y-3">
          {headingField}
          <RepeatableList<SectionHowToStep>
            items={section.steps ?? []}
            onChange={(steps) => onChange({ steps })}
            emptyItem={{ name: '', text: '' }}
            addLabel="Add step"
            disabled={disabled}
            renderItem={(step, update) => (
              <div className="space-y-2">
                <Input
                  value={step.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Step title"
                  disabled={disabled}
                />
                <Textarea
                  rows={2}
                  value={step.text}
                  onChange={(e) => update({ text: e.target.value })}
                  placeholder="Step description"
                  disabled={disabled}
                />
              </div>
            )}
          />
        </div>
      )

    case 'causes':
      return (
        <div className="space-y-3">
          {headingField}
          <RepeatableList<SectionCauseFix>
            items={section.causes ?? []}
            onChange={(causes) => onChange({ causes })}
            emptyItem={{ cause: '', fix: '' }}
            addLabel="Add cause"
            disabled={disabled}
            renderItem={(row, update) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={row.cause}
                  onChange={(e) => update({ cause: e.target.value })}
                  placeholder="Cause"
                  disabled={disabled}
                />
                <Input
                  value={row.fix}
                  onChange={(e) => update({ fix: e.target.value })}
                  placeholder="Fix"
                  disabled={disabled}
                />
              </div>
            )}
          />
        </div>
      )

    default:
      return null
  }
}

/** Generic add/remove list editor used by faqs, price rows, steps, causes. */
function RepeatableList<T>({
  items,
  onChange,
  emptyItem,
  addLabel,
  renderItem,
  disabled,
}: {
  items: T[]
  onChange: (next: T[]) => void
  emptyItem: T
  addLabel: string
  renderItem: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2 rounded-md border border-border p-2">
          <div className="flex-1">
            {renderItem(item, (patch) => {
              const next = items.slice()
              next[index] = { ...item, ...patch }
              onChange(next)
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            disabled={disabled}
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { ...emptyItem }])}
        disabled={disabled}
      >
        <Plus className="mr-1 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  )
}

function SortableSectionCard({
  section,
  index,
  total,
  collapsed,
  onToggleCollapse,
  onChange,
  onRemove,
  disabled,
}: {
  section: ContentSection
  index: number
  total: number
  collapsed: boolean
  onToggleCollapse: () => void
  onChange: (patch: Partial<ContentSection>) => void
  onRemove: () => void
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  const meta = SECTION_TYPE_META[section.type]

  return (
    <Card ref={setNodeRef} style={style} className="rounded-md">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab touch-none p-1 text-muted-foreground"
            {...attributes}
            {...listeners}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {index + 1}. {meta.label}
            </span>
            {section.heading?.trim() ? (
              <span className="truncate text-xs text-muted-foreground">— {section.heading}</span>
            ) : null}
          </button>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {index + 1}/{total}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={onRemove}
            disabled={disabled}
            title="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {!collapsed ? (
          <div className="mt-3 border-t pt-3">
            <SectionBody section={section} onChange={onChange} disabled={disabled} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export interface SeoSectionsEditorProps {
  sections: ContentSection[]
  onChange: (next: ContentSection[]) => void
  disabled?: boolean
}

export function SeoSectionsEditor({ sections, onChange, disabled }: SeoSectionsEditorProps) {
  const [addType, setAddType] = useState<ContentSectionType>('rich_text')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(sections, oldIndex, newIndex))
  }

  const addSection = () => {
    onChange([...sections, createSection(addType)])
  }

  const patchSection = (id: string, patch: Partial<ContentSection>) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold">Page sections</Label>
        <span className="text-xs text-muted-foreground">{sections.length} section(s)</span>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No sections yet. Add a block below to build the page body. Drag the handle to reorder.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.map((section, index) => (
                <SortableSectionCard
                  key={section.id}
                  section={section}
                  index={index}
                  total={sections.length}
                  collapsed={collapsed[section.id] ?? false}
                  onToggleCollapse={() =>
                    setCollapsed((prev) => ({ ...prev, [section.id]: !(prev[section.id] ?? false) }))
                  }
                  onChange={(patch) => patchSection(section.id, patch)}
                  onRemove={() => onChange(sections.filter((s) => s.id !== section.id))}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
        <select
          className={cn(SELECT_CLASS, 'sm:w-56')}
          value={addType}
          onChange={(e) => setAddType(e.target.value as ContentSectionType)}
          disabled={disabled}
        >
          {(Object.keys(SECTION_TYPE_META) as ContentSectionType[]).map((t) => (
            <option key={t} value={t}>
              {SECTION_TYPE_META[t].label}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={addSection} disabled={disabled}>
          <Plus className="mr-1 h-4 w-4" />
          Add section
        </Button>
        <span className="text-xs text-muted-foreground">{SECTION_TYPE_META[addType].description}</span>
      </div>
    </div>
  )
}

export default SeoSectionsEditor
