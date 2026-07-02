import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { ReservationForm } from '../ReservationForm'
import { MenuFastCardsContentShell } from './MenuFastCardsContentShell'

export function MenuFastCardsContactPage({
  tenant,
  config,
  tenantId,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  tenantId: string
}) {
  return (
    <MenuFastCardsContentShell tenant={tenant} config={config} title="Contact">
      <article className="mf-cards-content-article">
        <h2 className="mf-cards-content-heading">Get in touch</h2>
        <p className="mf-cards-content-muted">
          Questions, events, or large orders — send us a message and we will get back to you.
        </p>
        <div className="mf-cards-contact-form">
          <ReservationForm tenantId={tenantId} />
        </div>
      </article>
    </MenuFastCardsContentShell>
  )
}
