import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Loader2, Save } from 'lucide-react'
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
import { Textarea } from '../../components/ui/textarea'

function num(v: string): number {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function FieldHint({
  children,
  customer,
  partner,
}: {
  children: React.ReactNode
  customer: string
  partner: string
}) {
  return (
    <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      <p>{children}</p>
      <p>
        <span className="font-semibold text-foreground">Customer site:</span> {customer}
      </p>
      <p>
        <span className="font-semibold text-foreground">Provider / professional:</span> {partner}
      </p>
    </div>
  )
}

export function OperationsCommercialTermsPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_operating_terms')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

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
  const [internalNotes, setInternalNotes] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const res = await OperationsCommercialService.getTerms()
        if (cancelled) return
        const t: TenantCommercialTermsDto = res.data
        setCurrency(t.currency || 'INR')
        setConvenienceFeePercent(String(t.convenienceFeePercent ?? 0))
        setConvenienceFeeFixed(String(t.convenienceFeeFixed ?? 0))
        setTrainingFeePerProfessional(String(t.trainingFeePerProfessional ?? 0))
        setProviderCommissionPercent(String(t.providerCommissionPercent ?? 15))
        setPaymentProcessingFeePercent(String(t.paymentProcessingFeePercent ?? 0))
        setMinimumPlatformFeePerBooking(String(t.minimumPlatformFeePerBooking ?? 0))
        setGstPercentOnFees(String(t.gstPercentOnFees ?? 18))
        setAfterHoursSurchargePercent(String(t.afterHoursSurchargePercent ?? 0))
        setCommissionSlabs(
          t.commissionSlabs?.length ? t.commissionSlabs : DEFAULT_COMMISSION_SLABS,
        )
        setSupportCostPercent(String(t.supportCostPercent ?? DEFAULT_SUPPORT_COST_PERCENT))
        setRefundReservePercent(String(t.refundReservePercent ?? DEFAULT_REFUND_RESERVE_PERCENT))
        setMarketingAllocationPercent(
          String(t.marketingAllocationPercent ?? DEFAULT_MARKETING_ALLOCATION_PERCENT),
        )
        setVisitingFeeFixed(String(t.visitingFeeFixed ?? 0))
        setInternalNotes(t.internalNotes ?? '')
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

  async function save() {
    if (!canManage) return
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
        internalNotes,
      })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading commercial terms…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-foreground">How these fields affect live products</p>
            <p className="text-muted-foreground">
              Open the Knowledge kit article for customer vs provider impact, API paths, and PATCH behaviour.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0 self-start sm:self-center">
          <Link to="/knowledge-kit/operations-commercial-terms">Open guide</Link>
        </Button>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee & commission matrix</CardTitle>
          <CardDescription>
            Amounts are in {currency} (major units). Percent fields are 0–100. Values are stored per tenant (SaaS) or on
            the global row when no tenant is selected — backend booking/POS code reads them for platform fee math.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="oc-currency">Currency code</Label>
            <Input
              id="oc-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 8))}
              disabled={!canManage}
              className="max-w-xs font-mono"
            />
            <FieldHint
              customer="Displayed wherever the storefront formats money (e.g. checkout labels)."
              partner="Same code in partner statements when surfaced."
            >
              ISO currency for this tenant’s commercial row. Changing it does not auto-convert historical bookings.
            </FieldHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-conv-pct">Customer convenience fee (% of job subtotal)</Label>
            <Input
              id="oc-conv-pct"
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={convenienceFeePercent}
              onChange={(e) => setConvenienceFeePercent(e.target.value)}
              disabled={!canManage}
            />
            <FieldHint
              customer="When checkout/POS sends validated totals, this % is applied to the merchandise subtotal after discounts — customer may see a higher “taxes and fees” line."
              partner="Does not change catalog rates; customer total may rise so net to partner depends on your pricing rules."
            >
              Part of the platform convenience fee. Combined with flat fee and minimum floor before GST-on-fee.
            </FieldHint>
          </div>
          <div className="space-y-2">
            <Label htmlFor="oc-conv-flat">Convenience fee — flat add-on ({currency})</Label>
            <Input
              id="oc-conv-flat"
              type="number"
              step="0.01"
              min={0}
              value={convenienceFeeFixed}
              onChange={(e) => setConvenienceFeeFixed(e.target.value)}
              disabled={!canManage}
            />
            <FieldHint
              customer="Adds a fixed rupee platform line on applicable checkouts (in addition to the % component)."
              partner="Indirect — affects booking/order totals your partners fulfil."
            >
              Added after the percentage part; still subject to the minimum platform fee floor.
            </FieldHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-training">Training / onboarding fee per professional ({currency})</Label>
            <Input
              id="oc-training"
              type="number"
              step="1"
              min={0}
              value={trainingFeePerProfessional}
              onChange={(e) => setTrainingFeePerProfessional(e.target.value)}
              disabled={!canManage}
            />
            <FieldHint
              customer="Not wired into standard B2C checkout unless you build a dedicated flow."
              partner="Finance / onboarding use — distinct from per-partner commission on Edit Professional."
            >
              Tenant-level training economics field for ops tracking; not the same as wallet or per-job commission %.
            </FieldHint>
          </div>
          <div className="space-y-2">
            <Label htmlFor="oc-comm">Provider commission — platform retain (% of payout)</Label>
            <Input
              id="oc-comm"
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={providerCommissionPercent}
              onChange={(e) => setProviderCommissionPercent(e.target.value)}
              disabled={!canManage}
            />
            <FieldHint
              customer="Usually not shown as a separate line on the customer site."
              partner="May drive platform take on payouts; can interact with per-professional commission overrides."
            >
              Default tenant policy for how much of payout-related amounts the platform retains (0–100).
            </FieldHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-paygate">Payment processing pass-through (%)</Label>
            <Input
              id="oc-paygate"
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={paymentProcessingFeePercent}
              onChange={(e) => setPaymentProcessingFeePercent(e.target.value)}
              disabled={!canManage}
            />
            <FieldHint
              customer="May appear in payment-method or invoice disclosures when you surface pass-through fees."
              partner="Typically not shown to professionals unless you expose payment economics."
            >
              Models gateway / processing cost as a percent; integrate explicitly in payment flows when needed.
            </FieldHint>
          </div>
          <div className="space-y-2">
            <Label htmlFor="oc-minpf">Minimum platform fee per paid booking ({currency})</Label>
            <Input
              id="oc-minpf"
              type="number"
              step="0.01"
              min={0}
              value={minimumPlatformFeePerBooking}
              onChange={(e) => setMinimumPlatformFeePerBooking(e.target.value)}
              disabled={!canManage}
            />
            <FieldHint
              customer="Small jobs still incur at least this platform fee when the fee path runs — total due may look higher on low-ticket carts. Also used by the Pricing Simulator as the flat platform-fee line."
              partner="Protects platform unit economics on small bookings."
            >
              Floor applied to the computed convenience fee (before GST on the fee line).
            </FieldHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-visit">Visiting / inspection fee — flat ({currency})</Label>
            <Input
              id="oc-visit"
              type="number"
              step="0.01"
              min={0}
              value={visitingFeeFixed}
              onChange={(e) => setVisitingFeeFixed(e.target.value)}
              disabled={!canManage}
            />
            <FieldHint
              customer="Flat technician-visit charge shown on every booking (Urban Company's ₹49 visit fee model). Industry-standard line item — appears separately on the checkout summary."
              partner="100% retained by the platform — does NOT enter the provider's slab commission base. Covers travel + diagnostic time."
            >
              Used by the Pricing Simulator to model true customer-pays and platform revenue. Set to 0 to omit the
              line.
            </FieldHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-gst">GST % on platform fee lines (0 = exempt)</Label>
            <Input
              id="oc-gst"
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={gstPercentOnFees}
              onChange={(e) => setGstPercentOnFees(e.target.value)}
              disabled={!canManage}
            />
            <FieldHint
              customer="When non-zero, GST is calculated on the platform convenience fee and can appear as a separate line next to it."
              partner="Invoice / compliance views may show GST on platform charges."
            >
              Matches finance policy for taxing platform fees; 0 disables GST on that fee component in the calculator.
            </FieldHint>
          </div>
          <div className="space-y-2">
            <Label htmlFor="oc-after">After-hours / peak uplift hint (%)</Label>
            <Input
              id="oc-after"
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={afterHoursSurchargePercent}
              onChange={(e) => setAfterHoursSurchargePercent(e.target.value)}
              disabled={!canManage}
            />
            <FieldHint
              customer="Only affects pricing if your slot/pricing engine reads this field (otherwise inert)."
              partner="May increase job value for peak or night slots when wired into pricing."
            >
              Hint for peak / night uplift; POS or catalog modules may consume separately from convenience fee.
            </FieldHint>
          </div>

          <div className="space-y-4 md:col-span-2 rounded-lg border border-border/80 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Founder finance — slab commission &amp; unit costs</p>
            <p className="text-caption-sm text-muted-foreground">
              Powers the Pricing Simulator and provider payout modeling. Slabs: below ₹500 → 20%, ₹500–₹999 → 17.5%, ₹1000+
              → 15%.
            </p>
            <CommissionSlabEditor slabs={commissionSlabs} onChange={setCommissionSlabs} disabled={!canManage} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="oc-support">Support cost (% of ticket)</Label>
                <Input
                  id="oc-support"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={supportCostPercent}
                  onChange={(e) => setSupportCostPercent(e.target.value)}
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oc-refund">Refund reserve (%)</Label>
                <Input
                  id="oc-refund"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={refundReservePercent}
                  onChange={(e) => setRefundReservePercent(e.target.value)}
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oc-mkt">Marketing allocation (%)</Label>
                <Input
                  id="oc-mkt"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={marketingAllocationPercent}
                  onChange={(e) => setMarketingAllocationPercent(e.target.value)}
                  disabled={!canManage}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="oc-notes">Internal notes (finance / ops)</Label>
            <Textarea
              id="oc-notes"
              rows={4}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              disabled={!canManage}
              placeholder="e.g. GST inclusive on convenience from 1 Apr; negotiate partner commission separately…"
            />
            <FieldHint
              customer="Never exposed on the public storefront or public commerce API."
              partner="Never sent to provider apps."
            >
              Admin-only audit context; not included in public checkout-terms responses.
            </FieldHint>
          </div>

          {canManage && (
            <div className="md:col-span-2">
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save terms
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
