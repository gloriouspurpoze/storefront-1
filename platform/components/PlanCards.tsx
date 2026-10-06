import { Check } from 'lucide-react'
import { formatPlanPriceInr, type VerticalPlanDef } from '@profixer/marketing-data'
import { launchOfferLive } from '../content/offer'
import { AttributionLink } from './AttributionLink'

const inr = new Intl.NumberFormat('en-IN')
const inrCurrency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

/** Readable names for plan module keys (the keys are backend `featureModules`). */
const MODULE_LABELS: Record<string, string> = {
  crm: 'CRM',
  cms: 'Website & content (CMS)',
  ecommerce: 'Online store & orders',
  finance: 'Finance & invoicing',
  marketing_workspace: 'Marketing workspace',
  team_work: 'Team collaboration',
  quotations: 'Quotations',
  employee_management: 'Staff management',
  bazaar: 'Marketplace (bazaar)',
}

function moduleLabel(key: string): string {
  return MODULE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function planLimitLines(plan: VerticalPlanDef): string[] {
  const out: string[] = []
  if (plan.limits?.maxUsers) out.push(`Up to ${inr.format(plan.limits.maxUsers)} team members`)
  if (plan.limits?.maxBookingsPerMonth) out.push(`${inr.format(plan.limits.maxBookingsPerMonth)} bookings / month`)
  return out
}

function planDiscount(plan: VerticalPlanDef): { was: string; saved: string; percent: number } | null {
  const now = plan.priceMonthlyInr
  const was = plan.compareAtMonthlyInr
  if (now == null || was == null || was <= now) return null
  return { was: inrCurrency.format(was), saved: inrCurrency.format(was - now), percent: Math.round(((was - now) / was) * 100) }
}

export function PlanCards({ plans, trialHref, ctaLabel = 'Start free trial' }: { plans: VerticalPlanDef[]; trialHref: string; ctaLabel?: string }) {
  const offerLive = launchOfferLive()
  return (
    <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
      {plans.map((plan) => {
        const price = formatPlanPriceInr(plan)
        const discount = offerLive ? planDiscount(plan) : null
        const limits = planLimitLines(plan)
        return (
          <div
            key={plan.key}
            className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
              plan.recommended ? 'border-tq-primary shadow-lg ring-1 ring-tq-primary' : 'border-tq-line'
            }`}
          >
            {plan.recommended ? (
              <span className="absolute -top-3 left-6 rounded-full bg-tq-primary px-3 py-0.5 text-xs font-semibold text-white">Most popular</span>
            ) : null}
            <h3 className="font-semibold text-tq-ink">{plan.label}</h3>
            <p className="mt-1 text-sm text-tq-muted">{plan.description}</p>
            {discount ? (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <s className="text-lg text-tq-muted" aria-label={`Was ${discount.was}`}>{discount.was}</s>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-tq-success">Save {discount.percent}%</span>
              </div>
            ) : null}
            <p className={`${discount ? 'mt-1' : 'mt-6'} text-4xl font-semibold tracking-tight text-tq-ink`}>
              {price ?? 'Custom'}
              {price ? <span className="text-sm font-normal text-tq-muted"> /month</span> : null}
            </p>
            {discount ? <p className="mt-1 text-sm font-medium text-tq-success">You save {discount.saved} every month</p> : null}
            {limits.length ? (
              <ul className="mt-4 space-y-1 border-t border-tq-line pt-4 text-sm font-medium text-tq-ink">
                {limits.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-tq-muted">
              {plan.includedModules.slice(0, 6).map((mod) => (
                <li key={mod} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-tq-primary" aria-hidden />
                  {moduleLabel(mod)}
                </li>
              ))}
            </ul>
            <AttributionLink
              href={trialHref}
              className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold ${
                plan.recommended ? 'bg-tq-primary text-white hover:bg-tq-primary-deep' : 'border border-tq-line text-tq-ink hover:border-tq-primary/50'
              }`}
            >
              {ctaLabel}
            </AttributionLink>
          </div>
        )
      })}
    </div>
  )
}

/** Product + Offer structured data for a plan list (prices in INR). */
export function plansJsonLd(plans: VerticalPlanDef[], name: string, url: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS',
    url,
    offers: plans
      .filter((p) => p.priceMonthlyInr != null)
      .map((p) => ({
        '@type': 'Offer',
        name: p.label,
        description: p.description,
        price: p.priceMonthlyInr,
        priceCurrency: 'INR',
        url,
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: p.priceMonthlyInr,
          priceCurrency: 'INR',
          unitText: 'MONTH',
        },
      })),
  }
}
