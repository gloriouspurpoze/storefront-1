import { AlertTriangle, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { SAAS_MODE, getBillingPortalUrl } from '../../lib/saasEnv'
import {
  formatPlanPriceInr,
  getPlanForVertical,
  tenantModulesExceedPlan,
} from '../../lib/verticalPlans'
import { normalizeVerticalKey } from '../../verticals/core/types'
import { Button } from '../ui/button'

/**
 * Informational banner when billing is unhealthy or entitlements exceed the
 * assigned plan. Enforcement remains on the backend.
 */
export function TenantPlanNudge() {
  const tenant = useAppSelector((s) => s.tenant)
  const planKey = tenant?.planKey ?? null
  const billingStatus = tenant?.billingStatus ?? null
  const verticalKey = normalizeVerticalKey(tenant?.verticalKey)
  const featureModules = tenant?.featureModules ?? null

  if (!SAAS_MODE || !tenant?.tenantId) return null

  const plan = getPlanForVertical(verticalKey, planKey)
  const billingBad =
    billingStatus === 'past_due' || billingStatus === 'canceled'
  const modulesOver = tenantModulesExceedPlan(plan, featureModules)

  if (!billingBad && !modulesOver && !planKey) return null

  const billingUrl = getBillingPortalUrl()

  return (
    <div
      className="mb-4 rounded-md border border-bloom-coral/40 bg-bloom-rose/40 px-4 py-3 text-sm dark:bg-bloom-coral/10"
      role="status"
    >
      <div className="flex flex-wrap items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bloom-deep" />
        <div className="min-w-0 flex-1 space-y-1">
          {billingBad && (
            <p>
              <strong className="text-foreground">Billing attention:</strong> subscription status is{' '}
              <span className="font-mono">{billingStatus}</span>. Some features may be limited until payment is
              updated.
            </p>
          )}
          {modulesOver && plan && (
            <p>
              <strong className="text-foreground">Plan entitlements:</strong> your organization has modules outside the{' '}
              <strong>{plan.label}</strong> plan
              {formatPlanPriceInr(plan) ? ` (${formatPlanPriceInr(plan)}/mo)` : ''}. Platform operators can align
              modules on{' '}
              <Link to="/settings/platform-tenants" className="font-medium text-primary underline-offset-2 hover:underline">
                Platform tenants
              </Link>
              .
            </p>
          )}
          {!planKey && !billingBad && (
            <p>
              <strong className="text-foreground">No plan assigned.</strong> Ask your platform operator to set a plan on
              this organization.
            </p>
          )}
        </div>
        {billingUrl && (
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" asChild>
            <a href={billingUrl} target="_blank" rel="noopener noreferrer">
              <CreditCard className="h-3.5 w-3.5" />
              Billing portal
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
