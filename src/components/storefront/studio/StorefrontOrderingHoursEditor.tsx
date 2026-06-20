import React from 'react'
import { Input, Label, Switch } from '../../ui'
import {
  DEFAULT_ORDERING_HOURS,
  ORDERING_DAY_KEYS,
  ORDERING_DAY_LABELS,
  normalizeOrderingHours,
  type OrderingHoursConfig,
} from '../../../lib/storefrontOrderingHours'

export function StorefrontOrderingHoursEditor({
  value,
  onChange,
}: {
  value?: Partial<OrderingHoursConfig> | null
  onChange: (next: OrderingHoursConfig) => void
}) {
  const hours = normalizeOrderingHours(value)

  const updateDay = (day: (typeof ORDERING_DAY_KEYS)[number], patch: Partial<OrderingHoursConfig[typeof day]>) => {
    onChange({
      ...hours,
      [day]: { ...hours[day], ...patch },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Ordering hours</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure when customers can place orders. Applies to all storefront templates.
        </p>
      </div>
      <div className="space-y-3">
        {ORDERING_DAY_KEYS.map((day) => {
          const entry = hours[day]
          return (
            <div
              key={day}
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[120px_1fr_1fr_1fr]"
            >
              <div className="font-medium text-sm">{ORDERING_DAY_LABELS[day]}</div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`closed-${day}`}
                  checked={!entry.closed}
                  onCheckedChange={(open) => updateDay(day, { closed: !open })}
                />
                <Label htmlFor={`closed-${day}`} className="text-xs">
                  {entry.closed ? 'Closed' : 'Open'}
                </Label>
              </div>
              <Field label="Opens" disabled={entry.closed}>
                <Input
                  value={entry.openTime ?? ''}
                  placeholder={DEFAULT_ORDERING_HOURS[day].openTime}
                  disabled={entry.closed}
                  onChange={(e) => updateDay(day, { openTime: e.target.value })}
                />
              </Field>
              <Field label="Closes" disabled={entry.closed}>
                <Input
                  value={entry.closeTime ?? ''}
                  placeholder={DEFAULT_ORDERING_HOURS[day].closeTime}
                  disabled={entry.closed}
                  onChange={(e) => updateDay(day, { closeTime: e.target.value })}
                />
              </Field>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  disabled,
}: {
  label: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className={disabled ? 'opacity-50' : undefined}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
