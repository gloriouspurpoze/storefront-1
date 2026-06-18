import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import type { SectionPriceRow } from '../../types/seoLandingSections'

function normalizeRows(raw: unknown): SectionPriceRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (!item || typeof item !== 'object') return { item: '', priceFrom: 0, priceTo: 0 }
    const o = item as Record<string, unknown>
    return {
      item: String(o.item ?? ''),
      priceFrom: Number(o.priceFrom ?? 0),
      priceTo: Number(o.priceTo ?? 0),
      currency: o.currency ? String(o.currency) : undefined,
      note: o.note ? String(o.note) : undefined,
    }
  })
}

export interface SeoLandingPriceTableEditorProps {
  rows: unknown
  caption?: string
  onChange: (rows: SectionPriceRow[]) => void
  onCaptionChange?: (caption: string) => void
  disabled?: boolean
}

export function SeoLandingPriceTableEditor({
  rows,
  caption = '',
  onChange,
  onCaptionChange,
  disabled,
}: SeoLandingPriceTableEditorProps) {
  const list = normalizeRows(rows)
  const display = list.length ? list : [{ item: '', priceFrom: 0, priceTo: 0 }]

  const patch = (index: number, patchRow: Partial<SectionPriceRow>) => {
    const next = [...display]
    next[index] = { ...next[index], ...patchRow }
    onChange(next.filter((r) => r.item.trim() || r.priceFrom > 0 || r.priceTo > 0))
  }

  const add = () => onChange([...display, { item: '', priceFrom: 0, priceTo: 0 }])

  const remove = (index: number) => {
    const next = display.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {display.map((row, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Row {i + 1}</Label>
            {display.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => remove(i)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <Input
            value={row.item}
            onChange={(e) => patch(i, { item: e.target.value })}
            placeholder="Service item (e.g. AC general service)"
            disabled={disabled}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From (₹)</Label>
              <Input
                type="number"
                value={row.priceFrom || ''}
                onChange={(e) => patch(i, { priceFrom: Number(e.target.value) })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To (₹)</Label>
              <Input
                type="number"
                value={row.priceTo || ''}
                onChange={(e) => patch(i, { priceTo: Number(e.target.value) })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Note (optional)</Label>
              <Input
                value={row.note ?? ''}
                onChange={(e) => patch(i, { note: e.target.value })}
                placeholder="Labour only, parts extra"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={add}
        disabled={disabled}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        Add price row
      </Button>
      {onCaptionChange ? (
        <div className="space-y-2 pt-2 border-t border-border/60">
          <Label>Table caption (shown above prices on site)</Label>
          <Input
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Indicative AC charges in Mira Bhayandar (2026)"
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  )
}
