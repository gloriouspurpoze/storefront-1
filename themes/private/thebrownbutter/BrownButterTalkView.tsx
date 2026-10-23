import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { buildWhatsAppChatUrl, resolveWhatsAppNumber, whatsAppPrefillMessage } from '@/lib/storefrontWhatsApp'
import type { ThemeTenant } from '@/themes/restaurant/types'
import { BrownButterFrame } from './BrownButterFrame'
import { BrownButterTalkForm } from './BrownButterTalkForm'

export function BrownButterTalkView({
  tenant,
  config,
  navLinks,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
}) {
  const phone = config?.branding?.contactPhone?.trim()
  const tel = phone ? phone.replace(/[^\d+]/g, '') : ''
  const siteName = config?.branding?.siteName || tenant.name
  const waDigits = resolveWhatsAppNumber(config)
  const waHref = waDigits ? buildWhatsAppChatUrl(waDigits, whatsAppPrefillMessage(siteName)) : null

  return (
    <BrownButterFrame
      config={config}
      navLinks={navLinks}
      headerTitle={siteName}
      contactPhone={phone}
    >
      <section className="bb-talk">
        <p className="bb-kicker">Talk to us</p>
        <h1 className="bb-page-title">We read every note</h1>
        <p className="bb-lead">
          Custom tins, a delivery question, or a large order? send one message and we will get back to you.
        </p>
        <BrownButterTalkForm tenantId={tenant.id} />
        {phone && tel ? (
          <p className="bb-talk-phone">
            Have an Urgent Request?{' '}
            <a href={`tel:${tel}`}>{phone}</a>
          </p>
        ) : null}
        {waHref ? (
          <a className="bb-talk-wa" href={waHref} target="_blank" rel="noopener noreferrer">
            Message on WhatsApp
          </a>
        ) : null}
        
      </section>
    </BrownButterFrame>
  )
}
