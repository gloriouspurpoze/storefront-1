import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { CommissionSlab } from '../../../types/founder-finance.types'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

export function CommissionSlabEditor({
  slabs,
  onChange,
  disabled,
}: {
  slabs: CommissionSlab[]
  onChange: (next: CommissionSlab[]) => void
  disabled?: boolean
}) {
  const update = (index: number, patch: Partial<CommissionSlab>) => {
    const next = slabs.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange(next)
  }

  const addSlab = () => {
    const last = slabs[slabs.length - 1]
    const nextMin = last ? (last.maxAmount ?? last.minAmount) + 1 : 0
    onChange([...slabs, { minAmount: nextMin, maxAmount: null, percent: 15 }])
  }

  const removeSlab = (index: number) => {
    onChange(slabs.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Commission slabs (GMV tiers)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addSlab} disabled={disabled}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add slab
        </Button>
      </div>
      <p className="text-caption-sm text-muted-foreground">
        Example: below ₹500 → 20%, ₹500–₹999 → 17.5%, ₹1000+ → 15%. Leave max empty for open-ended top tier.
      </p>
      <div className="space-y-2">
        {slabs.map((slab, i) => (
          <div
            key={i}
            className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/20 p-3 sm:grid-cols-4"
          >
            <div>
              <Label className="text-caption-sm">Min (₹)</Label>
              <Input
                type="number"
                min={0}
                value={slab.minAmount}
                onChange={(e) => update(i, { minAmount: Number(e.target.value) || 0 })}
                disabled={disabled}
              />
            </div>
            <div>
              <Label className="text-caption-sm">Max (₹, empty = ∞)</Label>
              <Input
                type="number"
                min={0}
                value={slab.maxAmount ?? ''}
                placeholder="∞"
                onChange={(e) => {
                  const v = e.target.value.trim()
                  update(i, { maxAmount: v === '' ? null : Number(v) })
                }}
                disabled={disabled}
              />
            </div>
            <div>
              <Label className="text-caption-sm">Commission %</Label>
              <Input
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={slab.percent}
                onChange={(e) => update(i, { percent: Number(e.target.value) || 0 })}
                disabled={disabled}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removeSlab(i)}
                disabled={disabled || slabs.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
