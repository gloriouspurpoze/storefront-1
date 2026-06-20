import React from 'react'
import { Button, Input, Label, Textarea } from '../../ui'
import type { ShippingPolicyConfig } from '../../../services/api/storefrontStudio.service'

const EMPTY_ZONE = { label: '', details: '', fee: '' }

export function StorefrontShippingPolicyEditor({
  value,
  onChange,
}: {
  value?: ShippingPolicyConfig | null
  onChange: (next: ShippingPolicyConfig) => void
}) {
  const policy = value ?? {}
  const zones = policy.zones ?? []

  const patch = (next: Partial<ShippingPolicyConfig>) => {
    onChange({ ...policy, ...next })
  }

  const updateZone = (index: number, field: 'label' | 'details' | 'fee', text: string) => {
    const next = zones.map((z, i) => (i === index ? { ...z, [field]: text } : z))
    patch({ zones: next })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Shipping policy</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Shown in the hamburger menu and as a popup when customers choose delivery at checkout.
        </p>
      </div>
      <Field label="Short summary" hint="One or two sentences shown at the top.">
        <Textarea
          rows={2}
          value={policy.summary ?? ''}
          onChange={(e) => patch({ summary: e.target.value })}
          placeholder="Orders are processed within 1–2 business days after payment."
        />
      </Field>
      <Field label="Processing note" hint="Optional lead-in before zones or details.">
        <Input
          value={policy.processingNote ?? ''}
          onChange={(e) => patch({ processingNote: e.target.value })}
          placeholder="We pack fresh items daily."
        />
      </Field>
      <Field label="Full details" hint="Plain text; line breaks are preserved.">
        <Textarea
          rows={4}
          value={policy.body ?? ''}
          onChange={(e) => patch({ body: e.target.value })}
          placeholder="Delivery timelines, returns, damaged packages, etc."
        />
      </Field>
      <div className="space-y-2">
        <Label className="text-xs">Delivery zones</Label>
        {zones.map((zone, index) => (
          <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
            <Input
              value={zone.label}
              placeholder="Zone label"
              onChange={(e) => updateZone(index, 'label', e.target.value)}
            />
            <Input
              value={zone.details}
              placeholder="Coverage / timeline"
              onChange={(e) => updateZone(index, 'details', e.target.value)}
            />
            <Input
              value={zone.fee ?? ''}
              placeholder="Fee (e.g. ₹149)"
              onChange={(e) => updateZone(index, 'fee', e.target.value)}
            />
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => patch({ zones: [...zones, { ...EMPTY_ZONE }] })}
        >
          Add zone
        </Button>
      </div>
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
      <Label className="mb-1 block text-xs">{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
