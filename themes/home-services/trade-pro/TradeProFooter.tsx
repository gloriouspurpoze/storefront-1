import Link from 'next/link'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { getOrderingAvailabilityFromConfig } from '@/lib/orderingHours'
import { dedupeFooterColumns, splitFooterLinks } from '@/lib/footerLinks'
import type { ThemeTenant } from '../types'
import { ClockIcon, MapPinIcon, PhoneIcon } from './icons'
import './trade-pro.css'

const DEFAULT_LINKS: StorefrontNavLink[] = [
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/book', label: 'Get a quote' },
  { href: '/contact', label: 'Contact' },
]

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

function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function TradeProFooter({
  tenant,
  config,
  navLinks,
  hours,
  licenseNumber,
  insuranceNumber,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  hours?: string
  licenseNumber?: string
  insuranceNumber?: string
}) {
  const year = new Date().getFullYear()
  const branding = config?.branding
  const phone = branding?.contactPhone?.trim() || undefined
  const email = branding?.contactEmail?.trim() || undefined
  const address = branding?.address?.trim() || undefined
  const tagline = (branding?.tagline || tenant.tagline)?.trim() || undefined
  const linkColumns = dedupeFooterColumns(
    splitFooterLinks(navLinks?.length ? navLinks : DEFAULT_LINKS, ['Explore', 'More']),
  )

  const hoursText =
    hours?.trim() || getOrderingAvailabilityFromConfig(config).slotsNote || undefined
  const license = licenseNumber?.trim() || undefined
  const insurance = insuranceNumber?.trim() || undefined

  const whatsapp = branding?.socials?.whatsapp?.trim()
  const whatsappLink = whatsapp ? whatsAppHref(whatsapp) : null
  const socialLinks = Object.entries(branding?.socials ?? {})
    .filter(([key, value]) => key !== 'whatsapp' && Boolean(value?.trim()))
    .map(([key, value]) => ({
      key,
      label: SOCIAL_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
      href: externalSocialHref(key, value!),
    }))

  const hasSocials = Boolean(whatsappLink || socialLinks.length)
  const hasContact = Boolean(phone || email || address)
  const hasCredentials = Boolean(hoursText || license || insurance)

  return (
    <footer className="tp-footer">
      <div
        className="tp-container tp-footer__grid py-10 sm:py-12 lg:py-14"
        style={{
          ['--tp-footer-cols' as string]:
            linkColumns.length + Number(hasContact) + Number(hasCredentials) || 1,
        }}
      >
        <div className="tp-footer__brand">
          <div className="flex items-center gap-2.5">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt="" className="h-8 w-8 rounded-xl object-cover" />
            ) : (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold"
                style={{
                  backgroundColor: 'var(--tp-accent)',
                  color: 'var(--tp-accent-contrast)',
                }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-base font-semibold tracking-tight text-white">
              {tenant.name}
            </span>
          </div>
          {tagline ? (
            <p className="tp-footer__muted mt-3 max-w-xs text-sm leading-6">{tagline}</p>
          ) : null}
          {hasSocials ? (
            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
              {whatsappLink ? (
                <li>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tp-footer__link"
                  >
                    WhatsApp
                  </a>
                </li>
              ) : null}
              {socialLinks.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tp-footer__link"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {linkColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="tp-footer__title">{col.title}</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link href={link.href} className="tp-footer__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {hasContact ? (
          <div>
            <p className="tp-footer__title">
              Contact
            </p>
            <ul className="mt-3 space-y-2.5 text-sm">
              {phone ? (
                <li>
                  <a
                    href={`tel:${phone}`}
                    className="tp-footer__link flex items-center gap-2"
                  >
                    <PhoneIcon className="h-4 w-4 shrink-0" /> {phone}
                  </a>
                </li>
              ) : null}
              {email ? (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="tp-footer__link"
                  >
                    {email}
                  </a>
                </li>
              ) : null}
              {address ? (
                <li>
                  <a
                    href={mapsHref(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tp-footer__link flex items-start gap-2"
                  >
                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{address}</span>
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {hasCredentials ? (
          <div>
            <p className="tp-footer__title">
              Hours &amp; credentials
            </p>
            <ul className="tp-footer__muted mt-3 space-y-2.5 text-sm">
              {hoursText ? (
                <li className="flex items-start gap-2">
                  <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                  <span>{hoursText}</span>
                </li>
              ) : null}
              {license ? (
                <li>
                  <span className="tp-footer__faint">License</span> · {license}
                </li>
              ) : null}
              {insurance ? (
                <li>
                  <span className="tp-footer__faint">Insurance</span> · {insurance}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="tp-footer__bottom">
        <div className="tp-container flex flex-col gap-2 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {tenant.name}. All rights reserved.
          </span>
          <span>
            Powered by{' '}
            <a href="https://torqstudio.com" className="tp-footer__link underline-offset-4 hover:underline">
              Torq Studio
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
