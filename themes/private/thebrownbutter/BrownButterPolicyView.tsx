import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '@/themes/restaurant/types'
import {
  DEFAULT_SHIPPING_POLICY_SUMMARY,
  getShippingPolicyFromConfig,
} from '@/lib/shippingPolicy'
import { BrownButterFrame } from './BrownButterFrame'
import { BrownButterOrderCard, BrownButterPageIntro } from './BrownButterPageParts'

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
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl || undefined

  return (
    <BrownButterFrame
      config={config}
      navLinks={navLinks}
      headerTitle={siteName}
      contactPhone={config?.branding?.contactPhone}
    >
      <div className="bb-page-body">
        <BrownButterPageIntro
          crumbs={[{ label: 'Shipping policy' }]}
          kicker="Policy"
          title="Shipping policy"
          lead={`How ${siteName} handles delivery and pickup for online orders.`}
        />
        <div className="bb-read">
          <article className="bb-paper">
            <div className="bb-prose">
              {policy.processingNote ? <p>{policy.processingNote}</p> : null}
              <p>{summary}</p>
              {bodyLines.map((line) => (
                <p key={line.slice(0, 48)}>{line}</p>
              ))}
            </div>
            {policy.zones?.length ? (
              <dl className="bb-zones">
                {policy.zones.map((zone, index) => (
                  <div key={`${zone.label}-${index}`} className="bb-zone">
                    <dt>{zone.label}</dt>
                    {zone.details ? <dd>{zone.details}</dd> : null}
                    {zone.fee ? <dd className="bb-zone__fee">{zone.fee}</dd> : null}
                  </div>
                ))}
              </dl>
            ) : null}
          </article>
          <BrownButterOrderCard config={config} siteName={siteName} logoUrl={logoUrl} />
        </div>
      </div>
    </BrownButterFrame>
  )
}
