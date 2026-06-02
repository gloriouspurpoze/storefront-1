import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CreditCard, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { useVerticalPlans } from '../../hooks/useVerticalPlans'
import { formatPlanPriceInr } from '../../lib/verticalPlans'
import { billingService } from '../../services/api/billing.service'
import { useToast } from '../../components/ui'

export function BillingUpgradePage() {
  const { toast } = useToast()
  const [params] = useSearchParams()
  const { verticalKey, plans, planFor } = useVerticalPlans()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const success = params.get('success') === '1'
  const canceled = params.get('canceled') === '1'
  const addonSku = params.get('addon')

  const startCheckout = async (planKey: string) => {
    setLoadingKey(planKey)
    try {
      const res = await billingService.createCheckoutSession({ planKey, verticalKey })
      const data = res.data as { url?: string | null; mock?: boolean; message?: string } | undefined
      if (data?.url) {
        window.location.href = data.url
        return
      }
      toast({
        title: data?.mock ? 'Stripe not configured' : 'Checkout',
        description: data?.message ?? 'Contact your platform operator to assign this plan.',
      })
    } catch (e) {
      toast({
        title: 'Checkout failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Billing & plans"
        subtitle="Upgrade your organization plan. Charges are processed via Stripe when configured."
        icon={<CreditCard className="h-8 w-8" />}
      />

      {success && (
        <p className="mb-4 rounded-md border border-storm-mist/40 bg-storm-mist/20 px-3 py-2 text-sm">
          Payment successful — plan will update after webhook processing.
        </p>
      )}
      {canceled && (
        <p className="mb-4 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
          Checkout canceled.
        </p>
      )}
      {addonSku && (
        <p className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          Storefront add-on <strong>{addonSku}</strong> — complete payment, then your platform operator will
          enable the widget. Or ask support to grant it on your trial.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.key}>
            <CardContent className="space-y-3 p-5">
              <p className="font-semibold">{p.label}</p>
              <p className="text-2xl font-bold text-primary">
                {formatPlanPriceInr(p) ?? '—'}
                {formatPlanPriceInr(p) ? <span className="text-sm font-normal">/mo</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              {p.limits?.maxUsers != null && (
                <p className="text-xs">Up to {p.limits.maxUsers} dashboard users</p>
              )}
              <Button
                type="button"
                className="w-full"
                disabled={loadingKey !== null}
                onClick={() => void startCheckout(p.key)}
              >
                {loadingKey === p.key ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {planFor(null) && (
        <p className="mt-6 text-xs text-muted-foreground">
          Current vertical: {verticalKey}. Plans are defined in the vertical pack manifest.
        </p>
      )}
    </div>
  )
}
