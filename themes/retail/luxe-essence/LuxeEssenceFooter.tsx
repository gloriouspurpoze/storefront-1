'use client'

import Link from 'next/link'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
}

const DEFAULT_SHOP_LINKS: StorefrontNavLink[] = [
  { href: '#products', label: 'Featured' },
  { href: '/products', label: 'All products' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

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

export function LuxeEssenceFooter({
  config,
  siteName,
  tagline,
  footerLinks,
}: {
  config: StorefrontConfig | null
  siteName: string
  tagline?: string
  /** CMS footer menu links (empty → hardcoded Shop column). */
  footerLinks?: StorefrontNavLink[]
}) {
  const branding = config?.branding
  const trimmedTagline = tagline?.trim()
  const phone = branding?.contactPhone?.trim()
  const email = branding?.contactEmail?.trim()
  const address = branding?.address?.trim()
  const whatsapp = branding?.socials?.whatsapp?.trim()
  const whatsappLink = whatsapp ? whatsAppHref(whatsapp) : null
  const shopLinks = footerLinks?.length ? footerLinks : DEFAULT_SHOP_LINKS

  const socialLinks = Object.entries(branding?.socials ?? {})
    .filter(([key, value]) => key !== 'whatsapp' && Boolean(value?.trim()))
    .map(([key, value]) => ({
      key,
      label: SOCIAL_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
      href: externalSocialHref(key, value),
    }))

  const year = new Date().getFullYear()

  return (
    <>
      <footer className="le-footer">
        <div className="le-footer-brand">
          <h3>{siteName}</h3>
          {trimmedTagline ? <p className="le-footer-tagline">{trimmedTagline}</p> : null}
          {address ? <p className="le-footer-address">{address}</p> : null}
        </div>

        <div>
          <div className="le-footer-col-title">Shop</div>
          <ul className="le-footer-links">
            {shopLinks.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="le-footer-col-title">Account</div>
          <ul className="le-footer-links">
            <li>
              <Link href="/account">My orders</Link>
            </li>
            <li>
              <Link href="/orders/track">Track order</Link>
            </li>
            <li>
              <Link href="/account/login">Sign in</Link>
            </li>
            <li>
              <Link href="/account/login?signup=1">Sign up with Google</Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="le-footer-col-title">Help</div>
          <ul className="le-footer-links">
            <li>
              <Link href="/shipping-policy">Shipping policy</Link>
            </li>
            {phone ? (
              <li>
                <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            ) : null}
            {whatsappLink ? (
              <li>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
            ) : null}
            {socialLinks.map((link) => (
              <li key={link.key}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
      <div className="le-footer-bottom">
        © {year} {siteName}. All rights reserved.
      </div>
    </>
  )
}
