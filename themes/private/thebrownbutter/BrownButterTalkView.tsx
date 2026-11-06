import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { buildWhatsAppChatUrl, resolveWhatsAppNumber, whatsAppPrefillMessage } from '@/lib/storefrontWhatsApp'
import type { ThemeTenant } from '@/themes/restaurant/types'
import { BrownButterFrame } from './BrownButterFrame'
import { BrownButterPageIntro } from './BrownButterPageParts'
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
  const address = config?.branding?.address?.trim()

  return (
    <BrownButterFrame
      config={config}
      navLinks={navLinks}
      headerTitle={siteName}
      contactPhone={phone}
    >
      <div className="bb-page-body">
        <div className="bb-talk-layout">
          <div className="bb-talk-intro">
            <BrownButterPageIntro
              crumbs={[{ label: 'Talk to us' }]}
              kicker="Talk to us"
              title="We read every note"
              lead="Custom tins, a delivery question, or a large order? Send one message and we will get back to you."
            />
            <ul className="bb-contact-list">
              {waHref ? (
                <li>
                  <a className="bb-contact-item bb-contact-item--wa" href={waHref} target="_blank" rel="noopener noreferrer">
                    <span className="bb-contact-item__icon" aria-hidden>💬</span>
                    <span>
                      <strong>WhatsApp us</strong>
                      Fastest for orders and custom tins
                    </span>
                  </a>
                </li>
              ) : null}
              {phone && tel ? (
                <li>
                  <a className="bb-contact-item" href={`tel:${tel}`}>
                    <span className="bb-contact-item__icon" aria-hidden>📞</span>
                    <span>
                      <strong>Urgent request?</strong>
                      Call {phone}
                    </span>
                  </a>
                </li>
              ) : null}
              {address ? (
                <li>
                  <span className="bb-contact-item">
                    <span className="bb-contact-item__icon" aria-hidden>📍</span>
                    <span>
                      <strong>Pickup point</strong>
                      {address}
                    </span>
                  </span>
                </li>
              ) : null}
            </ul>
          </div>
          <section className="bb-paper bb-talk" aria-label="Send us a message">
            <h2 className="bb-paper__title">Send a message</h2>
            <BrownButterTalkForm tenantId={tenant.id} />
          </section>
        </div>
      </div>
    </BrownButterFrame>
  )
}
