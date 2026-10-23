import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '@/themes/restaurant/types'
import {
  DEFAULT_SHIPPING_POLICY_SUMMARY,
  getShippingPolicyFromConfig,
} from '@/lib/shippingPolicy'
import { BrownButterFrame } from './BrownButterFrame'

export function BrownButterPolicyView({
  tenant,
  config,
  navLinks,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const policy = getShippingPolicyFromConfig(config)
  const summary = policy.summary || DEFAULT_SHIPPING_POLICY_SUMMARY
  const bodyLines = policy.body?.split(/\n+/).map((line) => line.trim()).filter(Boolean) ?? []

  return (
    <BrownButterFrame
      config={config}
      navLinks={navLinks}
      headerTitle={siteName}
      contactPhone={config?.branding?.contactPhone}
    >
      <article className="bb-story">
        <p className="bb-kicker">Policy</p>
        <h1 className="bb-page-title">Shipping policy</h1>
        <p className="bb-lead">How {siteName} handles delivery and pickup for online orders.</p>
        <div className="bb-prose">
          {policy.processingNote ? <p>{policy.processingNote}</p> : null}
          <p>{summary}</p>
          {bodyLines.map((line) => (
            <p key={line.slice(0, 48)}>{line}</p>
          ))}
          {policy.zones?.map((zone, index) => (
            <p key={`${zone.label}-${index}`}>
              <strong>{zone.label}</strong>
              {zone.details ? ` — ${zone.details}` : ''}
              {zone.fee ? ` (${zone.fee})` : ''}
            </p>
          ))}
        </div>
      </article>
    </BrownButterFrame>
  )
}
