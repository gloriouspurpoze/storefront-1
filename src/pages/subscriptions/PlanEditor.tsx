/**
 * Plan Editor — create or edit a subscription plan with live preview.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Crown, Plus, Save, Sparkles, Trash2 } from 'lucide-react'

import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Separator } from '../../components/ui/separator'

import {
  SubscriptionsService,
  type BillingCycle,
  type PlanBenefits,
  type PlanInput,
  type PlanStatus,
  type PlanType,
  type SubscriptionPlan,
} from '../../services/api/subscriptions.service'
import { cn } from '../../lib/utils'
import {
  BILLING_CYCLE_LABEL,
  PLAN_STATUS_LABEL,
  PLAN_TYPE_LABEL,
  billingCycleSuffix,
  formatINR,
  paiseToRupees,
  planStatusBadgeClass,
  rupeesToPaise,
} from './subscriptionFormatters'

interface PlanEditorProps {
  planId?: string
  onDone: () => void
}

type FormState = {
  name: string
  slug: string
  type: PlanType
  description: string
  priceRupees: string
  billingCycle: BillingCycle
  trialDays: string
  status: PlanStatus
  isPopular: boolean
  sortOrder: string
  features: string[]
  benefits: PlanBenefits
}

const EMPTY: FormState = {
  name: '',
  slug: '',
  type: 'customer',
  description: '',
  priceRupees: '0',
  billingCycle: 'monthly',
  trialDays: '0',
  status: 'active',
  isPopular: false,
  sortOrder: '0',
  features: [],
  benefits: {},
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function planToForm(plan: SubscriptionPlan): FormState {
  return {
    name: plan.name ?? '',
    slug: plan.slug ?? '',
    type: plan.type,
    description: plan.description ?? '',
    priceRupees: String(paiseToRupees(plan.price)),
    billingCycle: plan.billingCycle,
    trialDays: String(plan.trialDays ?? 0),
    status: plan.status,
    isPopular: !!plan.isPopular,
    sortOrder: String(plan.sortOrder ?? 0),
    features: Array.isArray(plan.features) ? [...plan.features] : [],
    benefits: { ...(plan.benefits ?? {}) },
  }
}

function formToPayload(form: FormState): PlanInput {
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || slugify(form.name),
    type: form.type,
    description: form.description.trim(),
    price: rupeesToPaise(form.priceRupees),
    billingCycle: form.billingCycle,
    trialDays: Math.max(0, Math.min(180, Number(form.trialDays) || 0)),
    status: form.status,
    isPopular: form.isPopular,
    sortOrder: Math.max(0, Number(form.sortOrder) || 0),
    features: form.features.map((f) => f.trim()).filter(Boolean),
    benefits: cleanBenefits(form.benefits),
  }
}

function cleanBenefits(b: PlanBenefits): PlanBenefits {
  const out: PlanBenefits = {}
  if (b.discountPercentage != null && b.discountPercentage > 0) out.discountPercentage = Number(b.discountPercentage)
  if (b.priorityBooking) out.priorityBooking = true
  if (b.freeCancellations === 'unlimited' || (typeof b.freeCancellations === 'number' && b.freeCancellations > 0)) {
    out.freeCancellations = b.freeCancellations
  }
  if (b.freeInspections != null && b.freeInspections > 0) out.freeInspections = Number(b.freeInspections)
  if (b.dedicatedManager) out.dedicatedManager = true
  if (b.emergencySupport) out.emergencySupport = true
  if (b.extendedWarranty) out.extendedWarranty = true
  if (b.familyMembers != null && b.familyMembers > 0) out.familyMembers = Number(b.familyMembers)
  if (b.enhancedProfile) out.enhancedProfile = true
  if (b.topListings) out.topListings = true
  if (b.freeLeadsPerDay != null && b.freeLeadsPerDay > 0) out.freeLeadsPerDay = Number(b.freeLeadsPerDay)
  if (b.analytics) out.analytics = true
  if (b.apiAccess) out.apiAccess = true
  if (b.teamMembers != null && b.teamMembers > 0) out.teamMembers = Number(b.teamMembers)
  return out
}

export function PlanEditor({ planId, onDone }: PlanEditorProps) {
  const isEdit = !!planId
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    if (!planId) return
    setLoading(true)
    SubscriptionsService.getPlan(planId)
      .then((p) => setForm(planToForm(p)))
      .finally(() => setLoading(false))
  }, [planId])

  const setField = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
  }, [])

  const setBenefit = useCallback(<K extends keyof PlanBenefits>(k: K, v: PlanBenefits[K]) => {
    setForm((f) => ({ ...f, benefits: { ...f.benefits, [k]: v } }))
  }, [])

  const onSlugAuto = () => {
    if (!form.slug && form.name) setField('slug', slugify(form.name))
  }

  const addFeature = () => {
    if (!newFeature.trim()) return
    setField('features', [...form.features, newFeature.trim()])
    setNewFeature('')
  }
  const removeFeature = (idx: number) => {
    setField(
      'features',
      form.features.filter((_, i) => i !== idx)
    )
  }

  const onSave = async () => {
    const payload = formToPayload(form)
    if (!payload.name || !payload.slug || payload.price < 0) return
    try {
      setSaving(true)
      if (isEdit && planId) {
        await SubscriptionsService.updatePlan(planId, payload)
      } else {
        await SubscriptionsService.createPlan(payload)
      }
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const isProvider = form.type === 'provider'

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading plan…</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEdit ? `Edit plan · ${form.name || ''}` : 'Create subscription plan'}
        subtitle={
          isEdit
            ? 'Update pricing, features and benefits. Existing subscribers keep their current plan version until renewal.'
            : 'Define a recurring offer. Use customer plans for memberships and provider plans for tooling tiers.'
        }
        icon={<Sparkles className="h-7 w-7" />}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onDone}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button onClick={onSave} disabled={saving || !form.name.trim()}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create plan'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-name">Display name *</Label>
                  <Input
                    id="plan-name"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    onBlur={onSlugAuto}
                    placeholder="e.g. Fixer Pro"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-slug">Slug *</Label>
                  <Input
                    id="plan-slug"
                    value={form.slug}
                    onChange={(e) => setField('slug', slugify(e.target.value))}
                    placeholder="fixer-pro"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL identifier — used by integrations and analytics.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-desc">Short description</Label>
                <Textarea
                  id="plan-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Used on the upgrade screen and in receipts."
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Audience</Label>
                  <Select value={form.type} onValueChange={(v) => setField('type', v as PlanType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="provider">Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Billing cycle</Label>
                  <Select
                    value={form.billingCycle}
                    onValueChange={(v) => setField('billingCycle', v as BillingCycle)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setField('status', v as PlanStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive (hidden)</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing & trial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-price">Price (₹) *</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    min={0}
                    step="1"
                    value={form.priceRupees}
                    onChange={(e) => setField('priceRupees', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Charged per {BILLING_CYCLE_LABEL[form.billingCycle].toLowerCase()} cycle.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-trial">Trial days</Label>
                  <Input
                    id="plan-trial"
                    type="number"
                    min={0}
                    max={180}
                    value={form.trialDays}
                    onChange={(e) => setField('trialDays', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">0 disables free trial.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-sort">Sort order</Label>
                  <Input
                    id="plan-sort"
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setField('sortOrder', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Lower number shows first.</p>
                </div>
              </div>

              <label className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
                <Checkbox
                  checked={form.isPopular}
                  onCheckedChange={(c) => setField('isPopular', c === true)}
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Crown className="h-3.5 w-3.5 text-bloom-coral" /> Mark as “Most popular”
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Highlights this plan in upgrade screens. Only one popular plan per audience is
                    recommended.
                  </span>
                </span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Features (shown on upgrade screen)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                  placeholder="e.g. Unlimited free cancellations"
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add
                </Button>
              </div>
              {form.features.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add 3–6 short bullet points highlighting what makes this plan valuable.
                </p>
              ) : (
                <ul className="space-y-2">
                  {form.features.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span>{f}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeFeature(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Benefits unlocked by this plan
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Drives in-app checks (e.g. priority booking, leads/day). Leave blank to skip.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumericBenefit
                  label="Discount %"
                  hint="Applied to platform fee / service price"
                  value={form.benefits.discountPercentage ?? ''}
                  onChange={(n) => setBenefit('discountPercentage', n)}
                  max={50}
                />
                <NumericBenefit
                  label="Free inspections / cycle"
                  value={form.benefits.freeInspections ?? ''}
                  onChange={(n) => setBenefit('freeInspections', n)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FreeCancellationsControl
                  value={form.benefits.freeCancellations}
                  onChange={(v) => setBenefit('freeCancellations', v)}
                />
                <NumericBenefit
                  label="Family members covered"
                  value={form.benefits.familyMembers ?? ''}
                  onChange={(n) => setBenefit('familyMembers', n)}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <BooleanBenefit
                  label="Priority booking"
                  hint="Bumps the customer to the top of dispatch queue."
                  checked={!!form.benefits.priorityBooking}
                  onChange={(v) => setBenefit('priorityBooking', v)}
                />
                <BooleanBenefit
                  label="24x7 emergency support"
                  checked={!!form.benefits.emergencySupport}
                  onChange={(v) => setBenefit('emergencySupport', v)}
                />
                <BooleanBenefit
                  label="Dedicated account manager"
                  checked={!!form.benefits.dedicatedManager}
                  onChange={(v) => setBenefit('dedicatedManager', v)}
                />
                <BooleanBenefit
                  label="Extended warranty"
                  checked={!!form.benefits.extendedWarranty}
                  onChange={(v) => setBenefit('extendedWarranty', v)}
                />
              </div>

              {isProvider && (
                <>
                  <Separator />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Provider-only perks
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NumericBenefit
                      label="Free leads / day"
                      value={form.benefits.freeLeadsPerDay ?? ''}
                      onChange={(n) => setBenefit('freeLeadsPerDay', n)}
                    />
                    <NumericBenefit
                      label="Team members included"
                      value={form.benefits.teamMembers ?? ''}
                      onChange={(n) => setBenefit('teamMembers', n)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <BooleanBenefit
                      label="Enhanced profile"
                      hint="Badge + storefront upgrades."
                      checked={!!form.benefits.enhancedProfile}
                      onChange={(v) => setBenefit('enhancedProfile', v)}
                    />
                    <BooleanBenefit
                      label="Top listings"
                      checked={!!form.benefits.topListings}
                      onChange={(v) => setBenefit('topListings', v)}
                    />
                    <BooleanBenefit
                      label="Analytics dashboard"
                      checked={!!form.benefits.analytics}
                      onChange={(v) => setBenefit('analytics', v)}
                    />
                    <BooleanBenefit
                      label="API access"
                      checked={!!form.benefits.apiAccess}
                      onChange={(v) => setBenefit('apiAccess', v)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <Card className="sticky top-4 xl:top-6">
            <CardHeader>
              <CardTitle className="text-base">Live preview</CardTitle>
              <p className="text-xs text-muted-foreground">
                How this plan looks in the upgrade screen.
              </p>
            </CardHeader>
            <CardContent>
              <PlanPreviewCard form={form} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function NumericBenefit({
  label,
  hint,
  value,
  onChange,
  max,
}: {
  label: string
  hint?: string
  value: number | ''
  onChange: (n: number | undefined) => void
  max?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        max={max}
        value={value === undefined ? '' : value}
        onChange={(e) => {
          const v = e.target.value
          if (v === '') onChange(undefined)
          else onChange(Math.max(0, max != null ? Math.min(max, Number(v)) : Number(v)))
        }}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function BooleanBenefit({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
      <span>
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  )
}

function FreeCancellationsControl({
  value,
  onChange,
}: {
  value: number | 'unlimited' | undefined
  onChange: (v: number | 'unlimited' | undefined) => void
}) {
  const isUnlimited = value === 'unlimited'
  const numeric = typeof value === 'number' ? value : ''
  return (
    <div className="space-y-1.5">
      <Label>Free cancellations / cycle</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={isUnlimited ? '' : (numeric as number | '')}
          disabled={isUnlimited}
          onChange={(e) =>
            onChange(e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))
          }
        />
        <label className="flex shrink-0 items-center gap-1.5 text-xs">
          <Checkbox
            checked={isUnlimited}
            onCheckedChange={(c) => onChange(c === true ? 'unlimited' : undefined)}
          />
          Unlimited
        </label>
      </div>
    </div>
  )
}

function PlanPreviewCard({ form }: { form: FormState }) {
  const features = useMemo(() => form.features.map((f) => f.trim()).filter(Boolean), [form.features])
  const priceLabel = formatINR(Number(form.priceRupees) || 0)

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border bg-card p-4 shadow-sm',
        form.isPopular && 'border-primary/50 ring-1 ring-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-base font-semibold">{form.name || 'Untitled plan'}</h4>
            {form.isPopular && (
              <Badge variant="outline" className="border-bloom-coral/45 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-coral">
                <Crown className="mr-1 h-3 w-3" /> Popular
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">/{form.slug || slugify(form.name) || '—'}</p>
        </div>
        <Badge variant="outline" className={cn('text-xs', planStatusBadgeClass(form.status))}>
          {PLAN_STATUS_LABEL[form.status]}
        </Badge>
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums">{priceLabel}</span>
        <span className="text-sm text-muted-foreground">{billingCycleSuffix(form.billingCycle)}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{PLAN_TYPE_LABEL[form.type]}</span>
        <span>·</span>
        <span>{BILLING_CYCLE_LABEL[form.billingCycle]}</span>
        {Number(form.trialDays) > 0 && (
          <>
            <span>·</span>
            <span>{form.trialDays}-day trial</span>
          </>
        )}
      </div>

      {form.description && (
        <p className="mt-3 text-sm text-muted-foreground">{form.description}</p>
      )}

      <ul className="mt-3 space-y-1.5 text-sm">
        {features.length === 0 ? (
          <li className="text-muted-foreground">No features added yet.</li>
        ) : (
          features.map((f, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{f}</span>
            </li>
          ))
        )}
      </ul>

      <Separator className="my-3" />
      <Button className="w-full" disabled>
        {form.status === 'active' ? 'Continue with' : 'Unavailable —'} {form.name || 'plan'}
      </Button>
    </div>
  )
}

export default PlanEditor
