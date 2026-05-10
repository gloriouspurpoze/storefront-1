import React, { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { OperationsCommercialService } from '../../services/api/operations-commercial.service'
import type { TenantCommercialTermsDto } from '../../types/operating-commercial.types'
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
      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee & commission matrix</CardTitle>
          <CardDescription>
            Amounts are in {currency} (major units). Percent fields are 0–100. Booking/checkout code can merge these
            with cart lines and payout rules — this screen is the{' '}
            <strong className="text-foreground">single source of truth</strong> per tenant.
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
