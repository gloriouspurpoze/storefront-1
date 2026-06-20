import React from 'react'
import { Input, Label } from '../../ui'
import type { OrderingAvailabilityConfig } from '../../../services/api/storefrontStudio.service'

export function StorefrontOrderingAvailabilityEditor({
  value,
  onChange,
}: {
  value?: OrderingAvailabilityConfig | null
  onChange: (next: OrderingAvailabilityConfig) => void
}) {
  const availability = value ?? {}

  const patch = (next: Partial<OrderingAvailabilityConfig>) => {
    onChange({ ...availability, ...next })
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <h3 className="text-sm font-semibold">Order date window</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional calendar limits for preferred delivery date selection at checkout (IST).
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Earliest delivery date">
          <Input
            type="date"
            value={availability.earliestDate ?? ''}
            onChange={(e) => patch({ earliestDate: e.target.value || undefined })}
          />
        </Field>
        <Field label="Latest delivery date">
          <Input
            type="date"
            value={availability.latestDate ?? ''}
            onChange={(e) => patch({ latestDate: e.target.value || undefined })}
          />
        </Field>
      </div>
      <Field label="Slots note" hint="Shown in the menu drawer under ordering hours.">
        <Input
          value={availability.slotsNote ?? ''}
          onChange={(e) => patch({ slotsNote: e.target.value })}
          placeholder="Delivery slots start at 11:00 AM IST"
        />
      </Field>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
