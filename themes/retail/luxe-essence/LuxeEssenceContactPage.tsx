'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

function contactHref(type: 'tel' | 'mailto', value: string): string {
  return type === 'tel' ? `tel:${value.replace(/\s/g, '')}` : `mailto:${value}`
}

export function LuxeEssenceContactPage({
  tenant,
  config,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const phone = config?.branding?.contactPhone?.trim()
  const email = config?.branding?.contactEmail?.trim()
  const address = config?.branding?.address?.trim()
  const whatsapp = config?.branding?.socials?.whatsapp?.trim()
  const whatsappDigits = whatsapp?.replace(/\D/g, '')

  return (
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      mainClassName="sf-page-shell sf-page-shell--narrow"
    >
      <p className="sf-page-eyebrow">Contact</p>
      <h1 className="sf-page-title">We&apos;re here to help</h1>
      <p className="sf-page-lead">Orders, shipping, or product questions for {siteName}.</p>

      <section className="le-policy-panel" aria-label="Contact details">
        <div className="le-policy-panel__body">
          {phone ? (
            <p className="sf-menu-drawer__policy-copy">
              Phone:{' '}
              <a href={contactHref('tel', phone)} className="sf-menu-drawer__policy-link">
                {phone}
              </a>
            </p>
          ) : null}
          {email ? (
            <p className="sf-menu-drawer__policy-copy">
              Email:{' '}
              <a href={contactHref('mailto', email)} className="sf-menu-drawer__policy-link">
                {email}
              </a>
            </p>
          ) : null}
          {address ? <p className="sf-menu-drawer__policy-copy">{address}</p> : null}
          {whatsappDigits ? (
            <p className="sf-menu-drawer__policy-copy">
              WhatsApp:{' '}
              <a
                href={`https://wa.me/${whatsappDigits}`}
                className="sf-menu-drawer__policy-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Message us
              </a>
            </p>
          ) : null}
          {!phone && !email && !address && !whatsappDigits ? (
            <p className="sf-menu-drawer__policy-copy">
              Contact details are not configured yet. Check back soon or browse the store.
            </p>
          ) : null}
        </div>
      </section>

      <nav className="le-policy-links" aria-label="Related links">
        <Link href="/shipping-policy">Shipping policy</Link>
        <Link href="/orders/track">Track an order</Link>
        <Link href="/">Back to store</Link>
      </nav>
    </LuxeEssenceLayoutPage>
  )
}
