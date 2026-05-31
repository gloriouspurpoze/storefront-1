import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Briefcase,
  Calculator,
  CheckCircle2,
  CreditCard,
  Eye,
  Info,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react'
import { OperationsCommercialService } from '../../services/api/operations-commercial.service'
import type { TenantCommercialTermsDto } from '../../types/operating-commercial.types'
import type { CommissionSlab } from '../../types/founder-finance.types'
import {
  DEFAULT_COMMISSION_SLABS,
  DEFAULT_MARKETING_ALLOCATION_PERCENT,
  DEFAULT_REFUND_RESERVE_PERCENT,
  DEFAULT_SUPPORT_COST_PERCENT,
} from '../../lib/founderFinanceMath'
import { CommissionSlabEditor } from '../finance/founder/CommissionSlabEditor'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../lib/utils'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function num(v: string): number {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(value: number, code: string): string {
  const safe = Number.isFinite(value) ? value : 0
  if (code === 'INR') {
    return '₹' + Math.round(safe).toLocaleString('en-IN')
  }
  return `${code} ${Math.round(safe).toLocaleString()}`
}

/**
 * Compact, audience-aware hint that lives directly under a field.
 *
 * Why: with the tab redesign the "Customer / Professional / Finance"
 * grouping already tells the operator *who* is impacted — so each hint
 * can lead with intent ("what this knob does") and supplement with the
 * one or two audiences that actually care, instead of the older 3-line
 * customer + provider block.
 */
function FieldHint({
  children,
  customer,
  partner,
  audience = 'both',
  variant = 'default',
}: {
  children: React.ReactNode
  customer?: string
  partner?: string
  audience?: 'customer' | 'partner' | 'both'
  variant?: 'default' | 'muted'
}) {
  const showCustomer = customer && (audience === 'customer' || audience === 'both')
  const showPartner = partner && (audience === 'partner' || audience === 'both')
  return (
    <div
      className={cn(
        'space-y-1 rounded-md border px-2.5 py-1.5 text-[11px] leading-relaxed',
        variant === 'muted'
          ? 'border-border/50 bg-muted/30 text-muted-foreground'
          : 'border-border/60 bg-muted/30 text-muted-foreground',
      )}
    >
      <p className="text-foreground/85">{children}</p>
      {showCustomer ? (
        <p>
          <span className="font-semibold text-foreground">Customer:</span> {customer}
        </p>
      ) : null}
      {showPartner ? (
        <p>
          <span className="font-semibold text-foreground">Professional:</span> {partner}
        </p>
      ) : null}
    </div>
  )
}

interface SectionCardProps {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  tone?: 'default' | 'accent'
}

/**
 * Reusable card for a logical group of fields inside a tab. Keeps the
 * visual rhythm consistent across audience tabs (header chip → title →
 * description → field grid).
 */
function SectionCard({ icon, title, description, children, tone = 'default' }: SectionCardProps) {
  return (
    <Card className={cn(tone === 'accent' && 'border-primary/25 shadow-sm')}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              tone === 'accent'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-foreground/70',
            )}
          >
            {icon}
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-[13px] leading-snug">{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

interface NumberFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  step?: string
  min?: number
  max?: number
  prefix?: string
  suffix?: string
  helper?: React.ReactNode
}

function NumberField({
  id,
  label,
  value,
  onChange,
  disabled,
  step = '0.01',
  min = 0,
  max,
  prefix,
  suffix,
  helper,
}: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-sm font-medium text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <Input
          id={id}
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(prefix && 'pl-9', suffix && 'pr-12')}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-xs font-medium text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {helper}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type TabKey = 'customer' | 'professional' | 'finance'

interface Snapshot {
  currency: string
  convenienceFeePercent: string
  convenienceFeeFixed: string
  trainingFeePerProfessional: string
  providerCommissionPercent: string
  paymentProcessingFeePercent: string
  minimumPlatformFeePerBooking: string
  gstPercentOnFees: string
  afterHoursSurchargePercent: string
  commissionSlabs: CommissionSlab[]
  supportCostPercent: string
  refundReservePercent: string
  marketingAllocationPercent: string
  visitingFeeFixed: string
  freeVisitThresholdRupees: string
  onlinePaymentEnabled: boolean
  onlinePaymentDisabledReason: string
  internalNotes: string
}

export function OperationsCommercialTermsPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_operating_terms')

  const [activeTab, setActiveTab] = useState<TabKey>('customer')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [justSavedAt, setJustSavedAt] = useState<number | null>(null)

  const [currency, setCurrency] = useState('INR')
  const [convenienceFeePercent, setConvenienceFeePercent] = useState('0')
  const [convenienceFeeFixed, setConvenienceFeeFixed] = useState('0')
  const [trainingFeePerProfessional, setTrainingFeePerProfessional] = useState('0')
  const [providerCommissionPercent, setProviderCommissionPercent] = useState('15')
  const [paymentProcessingFeePercent, setPaymentProcessingFeePercent] = useState('0')
  const [minimumPlatformFeePerBooking, setMinimumPlatformFeePerBooking] = useState('0')
  const [gstPercentOnFees, setGstPercentOnFees] = useState('18')
  const [afterHoursSurchargePercent, setAfterHoursSurchargePercent] = useState('0')
  const [commissionSlabs, setCommissionSlabs] = useState<CommissionSlab[]>(DEFAULT_COMMISSION_SLABS)
  const [supportCostPercent, setSupportCostPercent] = useState(String(DEFAULT_SUPPORT_COST_PERCENT))
  const [refundReservePercent, setRefundReservePercent] = useState(String(DEFAULT_REFUND_RESERVE_PERCENT))
  const [marketingAllocationPercent, setMarketingAllocationPercent] = useState(
    String(DEFAULT_MARKETING_ALLOCATION_PERCENT),
  )
  const [visitingFeeFixed, setVisitingFeeFixed] = useState('0')
  const [freeVisitThresholdRupees, setFreeVisitThresholdRupees] = useState('500')
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true)
  const [onlinePaymentDisabledReason, setOnlinePaymentDisabledReason] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  /** Snapshot at last successful load — used for dirty-state + "Reset changes". */
  const initialRef = useRef<Snapshot | null>(null)

  const currentSnapshot: Snapshot = {
    currency,
    convenienceFeePercent,
    convenienceFeeFixed,
    trainingFeePerProfessional,
    providerCommissionPercent,
    paymentProcessingFeePercent,
    minimumPlatformFeePerBooking,
    gstPercentOnFees,
    afterHoursSurchargePercent,
    commissionSlabs,
    supportCostPercent,
    refundReservePercent,
    marketingAllocationPercent,
    visitingFeeFixed,
    freeVisitThresholdRupees,
    onlinePaymentEnabled,
    onlinePaymentDisabledReason,
    internalNotes,
  }

  const isDirty = useMemo(() => {
    if (!initialRef.current) return false
    return JSON.stringify(initialRef.current) !== JSON.stringify(currentSnapshot)
  }, [currentSnapshot])

  function applySnapshot(snap: Snapshot) {
    setCurrency(snap.currency)
    setConvenienceFeePercent(snap.convenienceFeePercent)
    setConvenienceFeeFixed(snap.convenienceFeeFixed)
    setTrainingFeePerProfessional(snap.trainingFeePerProfessional)
    setProviderCommissionPercent(snap.providerCommissionPercent)
    setPaymentProcessingFeePercent(snap.paymentProcessingFeePercent)
    setMinimumPlatformFeePerBooking(snap.minimumPlatformFeePerBooking)
    setGstPercentOnFees(snap.gstPercentOnFees)
    setAfterHoursSurchargePercent(snap.afterHoursSurchargePercent)
    setCommissionSlabs(snap.commissionSlabs)
    setSupportCostPercent(snap.supportCostPercent)
    setRefundReservePercent(snap.refundReservePercent)
    setMarketingAllocationPercent(snap.marketingAllocationPercent)
    setVisitingFeeFixed(snap.visitingFeeFixed)
    setFreeVisitThresholdRupees(snap.freeVisitThresholdRupees)
    setOnlinePaymentEnabled(snap.onlinePaymentEnabled)
    setOnlinePaymentDisabledReason(snap.onlinePaymentDisabledReason)
    setInternalNotes(snap.internalNotes)
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const res = await OperationsCommercialService.getTerms()
        if (cancelled) return
        const t: TenantCommercialTermsDto = res.data
        const snap: Snapshot = {
          currency: t.currency || 'INR',
          convenienceFeePercent: String(t.convenienceFeePercent ?? 0),
          convenienceFeeFixed: String(t.convenienceFeeFixed ?? 0),
          trainingFeePerProfessional: String(t.trainingFeePerProfessional ?? 0),
          providerCommissionPercent: String(t.providerCommissionPercent ?? 15),
          paymentProcessingFeePercent: String(t.paymentProcessingFeePercent ?? 0),
          minimumPlatformFeePerBooking: String(t.minimumPlatformFeePerBooking ?? 0),
          gstPercentOnFees: String(t.gstPercentOnFees ?? 18),
          afterHoursSurchargePercent: String(t.afterHoursSurchargePercent ?? 0),
          commissionSlabs: t.commissionSlabs?.length ? t.commissionSlabs : DEFAULT_COMMISSION_SLABS,
          supportCostPercent: String(t.supportCostPercent ?? DEFAULT_SUPPORT_COST_PERCENT),
          refundReservePercent: String(t.refundReservePercent ?? DEFAULT_REFUND_RESERVE_PERCENT),
          marketingAllocationPercent: String(t.marketingAllocationPercent ?? DEFAULT_MARKETING_ALLOCATION_PERCENT),
          visitingFeeFixed: String(t.visitingFeeFixed ?? 0),
          freeVisitThresholdRupees: String(t.freeVisitThresholdRupees ?? 500),
          onlinePaymentEnabled: t.onlinePaymentEnabled !== false,
          onlinePaymentDisabledReason: t.onlinePaymentDisabledReason ?? '',
          internalNotes: t.internalNotes ?? '',
        }
        applySnapshot(snap)
        initialRef.current = snap
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load terms')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /** Auto-dismiss the "Saved" pill after a few seconds. */
  useEffect(() => {
    if (!justSavedAt) return
    const id = window.setTimeout(() => setJustSavedAt(null), 3500)
    return () => window.clearTimeout(id)
  }, [justSavedAt])

  async function save() {
    if (!canManage || !isDirty) return
    setSaving(true)
    setErr(null)
    try {
      await OperationsCommercialService.patchTerms({
        currency,
        convenienceFeePercent: num(convenienceFeePercent),
        convenienceFeeFixed: num(convenienceFeeFixed),
        trainingFeePerProfessional: num(trainingFeePerProfessional),
        providerCommissionPercent: num(providerCommissionPercent),
        paymentProcessingFeePercent: num(paymentProcessingFeePercent),
        minimumPlatformFeePerBooking: num(minimumPlatformFeePerBooking),
        gstPercentOnFees: num(gstPercentOnFees),
        afterHoursSurchargePercent: num(afterHoursSurchargePercent),
        commissionSlabs,
        supportCostPercent: num(supportCostPercent),
        refundReservePercent: num(refundReservePercent),
        marketingAllocationPercent: num(marketingAllocationPercent),
        visitingFeeFixed: num(visitingFeeFixed),
        freeVisitThresholdRupees: num(freeVisitThresholdRupees),
        onlinePaymentEnabled,
        onlinePaymentDisabledReason: onlinePaymentDisabledReason.trim(),
        internalNotes,
      })
      // Re-anchor the snapshot so the dirty pill goes away.
      initialRef.current = currentSnapshot
      setJustSavedAt(Date.now())
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    if (!initialRef.current) return
    applySnapshot(initialRef.current)
    setErr(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading commercial terms…
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-4 pb-28">
      {/* Top utility bar — currency chip + state + guide link */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="oc-currency-chip" className="text-xs uppercase tracking-wide text-muted-foreground">
              Currency
            </Label>
            <Input
              id="oc-currency-chip"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 8))}
              disabled={!canManage}
              className="h-8 w-20 font-mono text-sm uppercase"
              aria-label="Currency code"
            />
          </div>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" aria-hidden />
            <span>All amounts in {currency} (major units). Percents are 0–100.</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Unsaved changes
            </span>
          ) : justSavedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Saved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Up to date
            </span>
          )}
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link to="/knowledge-kit/operations-commercial-terms">
              <Info className="h-3.5 w-3.5" />
              Field guide
            </Link>
          </Button>
        </div>
      </div>

      {err ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{err}</p>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="space-y-5">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          <TabTrigger
            value="customer"
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Customer-facing"
            hint="What shows up on the storefront bill"
          />
          <TabTrigger
            value="professional"
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Professional"
            hint="Commission & onboarding economics"
          />
          <TabTrigger
            value="finance"
            icon={<Calculator className="h-3.5 w-3.5" />}
            label="Finance & internal"
            hint="Unit economics + ops notes"
          />
        </TabsList>

        {/* -------- Customer tab -------- */}
        <TabsContent value="customer" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              {/* Online payment master switch */}
              <SectionCard
                tone="accent"
                icon={<CreditCard className="h-5 w-5" />}
                title="Online payment (Razorpay)"
                description="Customer-facing master switch. When off, the “Online pay” tile is hidden on web checkout and any pay-now booking is rejected by the API."
              >
                <div className="flex flex-col gap-4 rounded-lg border border-border bg-background/40 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {onlinePaymentEnabled ? 'Online pay is live' : 'Online pay is paused'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {onlinePaymentEnabled
                        ? 'Customers can pay with UPI, cards, net banking & wallets — and unlock the 5% pay-now discount.'
                        : 'Customers can only choose “Pay after service”. POS bookings are NOT affected.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        onlinePaymentEnabled
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                      )}
                    >
                      {onlinePaymentEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={onlinePaymentEnabled}
                      onCheckedChange={(v) => setOnlinePaymentEnabled(Boolean(v))}
                      disabled={!canManage}
                      aria-label="Toggle online payment"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="oc-online-pay-reason" className="text-sm">
                    Reason shown when disabled
                    <span className="ml-1 text-xs font-normal text-muted-foreground">optional · 200 chars</span>
                  </Label>
                  <Input
                    id="oc-online-pay-reason"
                    maxLength={200}
                    value={onlinePaymentDisabledReason}
                    onChange={(e) => setOnlinePaymentDisabledReason(e.target.value)}
                    disabled={!canManage || onlinePaymentEnabled}
                    placeholder="e.g. Online pay paused while we upgrade the gateway. UPI / cards return shortly."
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Rendered next to the locked tile on web checkout. Blank uses a neutral fallback.
                  </p>
                </div>
              </SectionCard>

              {/* Visit & delivery fee */}
              <SectionCard
                icon={<Truck className="h-5 w-5" />}
                title="Visit & delivery fee"
                description="Flat fee on the cart + free-tier threshold. Live on the customer site within 60 seconds of saving."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="oc-visit"
                    label={`Visit / delivery fee (${currency})`}
                    value={visitingFeeFixed}
                    onChange={setVisitingFeeFixed}
                    disabled={!canManage}
                    step="1"
                    prefix={currency === 'INR' ? '₹' : currency}
                    helper={
                      <FieldHint
                        audience="customer"
                        customer="Shown as the “Visit fee” or “Delivery fee” line on cart + checkout (Urban Company ₹49, Sulekha ₹99 pattern)."
                      >
                        Set to 0 to remove the line entirely. Waived above the threshold on the right.
                      </FieldHint>
                    }
                  />
                  <NumberField
                    id="oc-visit-thresh"
                    label={`Free above (${currency})`}
                    value={freeVisitThresholdRupees}
                    onChange={setFreeVisitThresholdRupees}
                    disabled={!canManage}
                    step="1"
                    prefix={currency === 'INR' ? '₹' : currency}
                    helper={
                      <FieldHint
                        audience="customer"
                        customer="Drives the “Add ₹X more for free visit” nudge — keep aligned with your cart-tier ladder."
                      >
                        Subtotal (after discounts) above which the fee is waived. 0 = never waive.
                      </FieldHint>
                    }
                  />
                </div>
              </SectionCard>

              {/* Platform fees + taxes */}
              <SectionCard
                icon={<Sparkles className="h-5 w-5" />}
                title="Platform fees & taxes"
                description="Convenience fee math, payment-gateway pass-through, GST and after-hours uplift — every knob that hits the customer's taxes-and-fees line."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="oc-conv-pct"
                    label="Convenience fee (%)"
                    value={convenienceFeePercent}
                    onChange={setConvenienceFeePercent}
                    disabled={!canManage}
                    max={100}
                    suffix="%"
                    helper={
                      <FieldHint audience="customer" customer="Applied to merchandise subtotal after discounts.">
                        Part of the platform convenience fee. Combined with the flat add-on and the floor below.
                      </FieldHint>
                    }
                  />
                  <NumberField
                    id="oc-conv-flat"
                    label={`Convenience flat add-on (${currency})`}
                    value={convenienceFeeFixed}
                    onChange={setConvenienceFeeFixed}
                    disabled={!canManage}
                    prefix={currency === 'INR' ? '₹' : currency}
                    helper={
                      <FieldHint audience="customer" customer="Adds a fixed rupee line in addition to the %.">
                        Subject to the minimum platform fee floor.
                      </FieldHint>
                    }
                  />
                  <NumberField
                    id="oc-minpf"
                    label={`Min platform fee (${currency})`}
                    value={minimumPlatformFeePerBooking}
                    onChange={setMinimumPlatformFeePerBooking}
                    disabled={!canManage}
                    prefix={currency === 'INR' ? '₹' : currency}
                    helper={
                      <FieldHint
                        audience="customer"
                        customer="Low-ticket carts still incur at least this fee."
                      >
                        Floor on the computed convenience fee (before GST).
                      </FieldHint>
                    }
                  />
                  <NumberField
                    id="oc-gst"
                    label="GST on fees (%)"
                    value={gstPercentOnFees}
                    onChange={setGstPercentOnFees}
                    disabled={!canManage}
                    max={100}
                    suffix="%"
                    helper={
                      <FieldHint
                        audience="customer"
                        customer="When non-zero, GST is shown next to the convenience fee."
                      >
                        Matches finance policy on taxing platform charges. 0 = exempt line.
                      </FieldHint>
                    }
                  />
                  <NumberField
                    id="oc-paygate"
                    label="Payment processing pass-through (%)"
                    value={paymentProcessingFeePercent}
                    onChange={setPaymentProcessingFeePercent}
                    disabled={!canManage}
                    max={100}
                    suffix="%"
                    helper={
                      <FieldHint
                        audience="customer"
                        customer="May appear on payment-method / invoice disclosures when surfaced."
                      >
                        Gateway / processing cost model — wire into payment flows explicitly.
                      </FieldHint>
                    }
                  />
                  <NumberField
                    id="oc-after"
                    label="After-hours / peak uplift (%)"
                    value={afterHoursSurchargePercent}
                    onChange={setAfterHoursSurchargePercent}
                    disabled={!canManage}
                    max={100}
                    suffix="%"
                    helper={
                      <FieldHint
                        audience="customer"
                        customer="Adds an uplift line on peak / night slots when pricing engine reads it."
                      >
                        Hint for peak / night pricing — POS or catalog modules may consume.
                      </FieldHint>
                    }
                  />
                </div>
              </SectionCard>
            </div>

            {/* Live preview rail */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <CustomerPreviewCard
                currency={currency}
                visitingFeeFixed={num(visitingFeeFixed)}
                freeVisitThresholdRupees={num(freeVisitThresholdRupees)}
                convenienceFeePercent={num(convenienceFeePercent)}
                convenienceFeeFixed={num(convenienceFeeFixed)}
                minimumPlatformFeePerBooking={num(minimumPlatformFeePerBooking)}
                gstPercentOnFees={num(gstPercentOnFees)}
                afterHoursSurchargePercent={num(afterHoursSurchargePercent)}
                onlinePaymentEnabled={onlinePaymentEnabled}
              />
            </div>
          </div>
        </TabsContent>

        {/* -------- Professional tab -------- */}
        <TabsContent value="professional" className="space-y-5">
          <SectionCard
            icon={<Users className="h-5 w-5" />}
            title="Per-job commission policy"
            description="Default tenant commission applied to provider payouts (unless overridden on the Edit Professional screen)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="oc-comm"
                label="Provider commission (%)"
                value={providerCommissionPercent}
                onChange={setProviderCommissionPercent}
                disabled={!canManage}
                max={100}
                suffix="%"
                helper={
                  <FieldHint
                    audience="partner"
                    partner="Drives platform take on payouts; can be overridden per-professional."
                  >
                    Default tenant policy for how much of payout-related amounts the platform retains (0–100).
                  </FieldHint>
                }
              />
              <NumberField
                id="oc-training"
                label={`Training / onboarding fee per professional (${currency})`}
                value={trainingFeePerProfessional}
                onChange={setTrainingFeePerProfessional}
                disabled={!canManage}
                step="1"
                prefix={currency === 'INR' ? '₹' : currency}
                helper={
                  <FieldHint
                    audience="partner"
                    partner="Finance / onboarding use — separate from per-partner commission overrides."
                  >
                    Tenant-level training economics field for ops tracking; not the same as wallet or per-job commission %.
                  </FieldHint>
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<Calculator className="h-5 w-5" />}
            title="Tiered commission by GMV (founder-finance slabs)"
            description={`Drives the Pricing Simulator and provider-payout modeling. Empty / missing → backend falls back to provider commission %.`}
          >
            <CommissionSlabEditor slabs={commissionSlabs} onChange={setCommissionSlabs} disabled={!canManage} />
            <FieldHint
              audience="partner"
              partner="Higher slabs at low GMV protect platform unit economics; surface in payout statements when relevant."
              variant="muted"
            >
              Default slabs: below ₹500 → 20%, ₹500–₹999 → 17.5%, ₹1000+ → 15%. Override per-tenant as needed.
            </FieldHint>
          </SectionCard>
        </TabsContent>

        {/* -------- Finance tab -------- */}
        <TabsContent value="finance" className="space-y-5">
          <SectionCard
            icon={<Calculator className="h-5 w-5" />}
            title="Unit-economics modeling"
            description="Percent-of-ticket allocations used by the Founder Finance dashboard + Pricing Simulator. These do NOT charge the customer."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                id="oc-support"
                label="Support cost (%)"
                value={supportCostPercent}
                onChange={setSupportCostPercent}
                disabled={!canManage}
                step="0.1"
                max={100}
                suffix="%"
              />
              <NumberField
                id="oc-refund"
                label="Refund reserve (%)"
                value={refundReservePercent}
                onChange={setRefundReservePercent}
                disabled={!canManage}
                step="0.1"
                max={100}
                suffix="%"
              />
              <NumberField
                id="oc-mkt"
                label="Marketing allocation (%)"
                value={marketingAllocationPercent}
                onChange={setMarketingAllocationPercent}
                disabled={!canManage}
                step="0.1"
                max={100}
                suffix="%"
              />
            </div>
            <FieldHint variant="muted">
              Industry default is ~2% support, ~1.5% refund reserve, ~5% marketing — tune to your blended P&amp;L. Changes
              here re-flow the Founder Finance contribution-margin chart.
            </FieldHint>
          </SectionCard>

          <SectionCard
            icon={<Info className="h-5 w-5" />}
            title="Internal notes"
            description="Admin-only audit context. Never exposed on the public storefront or to provider apps."
          >
            <Textarea
              id="oc-notes"
              rows={4}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              disabled={!canManage}
              placeholder="e.g. GST inclusive on convenience from 1 Apr; negotiate partner commission separately…"
            />
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Sticky save bar — only sticky while dirty, otherwise inline */}
      {canManage ? (
        <div
          className={cn(
            'pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-4 transition',
            isDirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
          )}
        >
          <div className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" aria-hidden />
              <span className="font-medium text-foreground">Unsaved changes</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">— review and save when ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={saving} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button type="button" size="sm" onClick={() => void save()} disabled={saving} className="gap-1.5">
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function TabTrigger({
  value,
  icon,
  label,
  hint,
}: {
  value: TabKey
  icon: React.ReactNode
  label: string
  hint: string
}) {
  return (
    <TabsTrigger
      value={value}
      className="flex h-auto flex-1 min-w-[140px] flex-col items-start gap-0.5 px-3 py-2 text-left data-[state=active]:bg-background"
    >
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
        {icon}
        {label}
      </span>
      <span className="text-[11px] font-normal text-muted-foreground">{hint}</span>
    </TabsTrigger>
  )
}

interface CustomerPreviewProps {
  currency: string
  visitingFeeFixed: number
  freeVisitThresholdRupees: number
  convenienceFeePercent: number
  convenienceFeeFixed: number
  minimumPlatformFeePerBooking: number
  gstPercentOnFees: number
  afterHoursSurchargePercent: number
  onlinePaymentEnabled: boolean
}

/**
 * Live "what the customer sees" mini-cart. Three sample subtotals (low,
 * mid, high-ticket) re-compute the line items using the SAME formulas the
 * backend applies, so an operator can sanity-check the effect of every
 * change before hitting Save.
 */
function CustomerPreviewCard(props: CustomerPreviewProps) {
  const [afterHours, setAfterHours] = useState(false)
  const samples = [299, 999, 2499]

  function compute(subtotal: number) {
    const visitFeeApplies = props.visitingFeeFixed > 0
    const visitWaived =
      visitFeeApplies && props.freeVisitThresholdRupees > 0 && subtotal >= props.freeVisitThresholdRupees
    const visitFee = visitFeeApplies && !visitWaived ? props.visitingFeeFixed : 0

    let convFee = subtotal * (props.convenienceFeePercent / 100) + props.convenienceFeeFixed
    if (convFee < props.minimumPlatformFeePerBooking) convFee = props.minimumPlatformFeePerBooking
    convFee = Math.round(convFee * 100) / 100

    const convFeeGst = props.gstPercentOnFees > 0 ? Math.round(convFee * (props.gstPercentOnFees / 100) * 100) / 100 : 0

    const afterHoursLine =
      afterHours && props.afterHoursSurchargePercent > 0
        ? Math.round(subtotal * (props.afterHoursSurchargePercent / 100) * 100) / 100
        : 0

    const total = subtotal + visitFee + convFee + convFeeGst + afterHoursLine

    return { subtotal, visitFee, visitWaived, convFee, convFeeGst, afterHoursLine, total }
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Eye className="h-4 w-4" aria-hidden />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-sm">Live customer preview</CardTitle>
            <CardDescription className="text-[11px] leading-snug">
              Same formulas the backend uses — change any field on the left and watch totals shift before saving.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex items-center justify-between rounded-md border border-border bg-background/50 px-2.5 py-1.5">
          <span className="text-[11px] font-medium text-foreground">After-hours slot</span>
          <Switch checked={afterHours} onCheckedChange={(v) => setAfterHours(Boolean(v))} aria-label="Toggle after-hours preview" />
        </label>

        <div className="space-y-2">
          {samples.map((s) => {
            const r = compute(s)
            return (
              <div
                key={s}
                className="rounded-lg border border-border bg-background/40 p-2.5 text-[11px]"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-semibold text-foreground">{formatCurrency(s, props.currency)} cart</span>
                  <span className="font-bold text-primary">{formatCurrency(r.total, props.currency)}</span>
                </div>
                <ul className="space-y-0.5 text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(r.subtotal, props.currency)}</span>
                  </li>
                  {r.visitFee > 0 ? (
                    <li className="flex justify-between">
                      <span>Visit fee</span>
                      <span>+ {formatCurrency(r.visitFee, props.currency)}</span>
                    </li>
                  ) : r.visitWaived ? (
                    <li className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Visit fee (waived)</span>
                      <span>Free</span>
                    </li>
                  ) : null}
                  {r.convFee > 0 ? (
                    <li className="flex justify-between">
                      <span>Convenience fee</span>
                      <span>+ {formatCurrency(r.convFee, props.currency)}</span>
                    </li>
                  ) : null}
                  {r.convFeeGst > 0 ? (
                    <li className="flex justify-between">
                      <span>GST on fee</span>
                      <span>+ {formatCurrency(r.convFeeGst, props.currency)}</span>
                    </li>
                  ) : null}
                  {r.afterHoursLine > 0 ? (
                    <li className="flex justify-between">
                      <span>After-hours uplift</span>
                      <span>+ {formatCurrency(r.afterHoursLine, props.currency)}</span>
                    </li>
                  ) : null}
                </ul>
              </div>
            )
          })}
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px]',
            props.onlinePaymentEnabled
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
          )}
        >
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          <span>
            Online pay tile is <span className="font-semibold">{props.onlinePaymentEnabled ? 'visible' : 'hidden'}</span> for customers
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
