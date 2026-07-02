'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
}

function whatsAppHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

function externalSocialHref(key: string, value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (key === 'instagram') return `https://instagram.com/${trimmed.replace(/^@/, '')}`
  return trimmed
}

export function MenuFastCardsFooter({ config }: { config: StorefrontConfig | null }) {
  const branding = config?.branding
  const phone = branding?.contactPhone?.trim()
  const email = branding?.contactEmail?.trim()
  const whatsapp = branding?.socials?.whatsapp?.trim()
  const whatsappLink = whatsapp ? whatsAppHref(whatsapp) : null
  const address = branding?.address?.trim()

  const socialLinks = Object.entries(branding?.socials ?? {})
    .filter(([key, value]) => key !== 'whatsapp' && Boolean(value?.trim()))
    .map(([key, value]) => ({
      key,
      label: SOCIAL_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
      href: externalSocialHref(key, value),
    }))

  const hasLinks = Boolean(phone || email || whatsappLink || socialLinks.length)
  const hasAddress = Boolean(address)

  if (!hasLinks && !hasAddress) {
    return (
      <footer className="mf-cards-shell-footer">
        <p className="mf-powered">Powered by Profixer</p>
      </footer>
    )
  }

  return (
    <footer className="mf-cards-shell-footer">
      {hasLinks ? (
        <nav className="mf-cards-shell-footer-links" aria-label="Contact and social">
          {phone ? (
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="mf-cards-shell-footer-link">
              {phone}
            </a>
          ) : null}
          {email ? (
            <a href={`mailto:${email}`} className="mf-cards-shell-footer-link">
              {email}
            </a>
          ) : null}
          {whatsappLink ? (
            <a
              href={whatsappLink}
              className="mf-cards-shell-footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          ) : null}
          {socialLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="mf-cards-shell-footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
      {hasAddress ? <p className="mf-cards-shell-footer-address">{address}</p> : null}
      <p className="mf-powered">Powered by Profixer</p>
    </footer>
  )
}
