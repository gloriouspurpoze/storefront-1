import Link from 'next/link'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { getOrderingAvailabilityFromConfig } from '@/lib/orderingHours'
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
  const links = navLinks?.length ? navLinks : DEFAULT_LINKS

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
    <footer className="tp-ink-band">
      <div className="tp-container grid gap-10 py-12 sm:grid-cols-2 sm:py-16 lg:grid-cols-4 lg:py-20">
        <div>
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
            <span className="text-base font-semibold tracking-tight text-[var(--tp-cta-contrast)]">
              {tenant.name}
            </span>
          </div>
          {tagline ? (
            <p className="mt-3 max-w-xs text-sm text-[var(--tp-cta-contrast)]/70">{tagline}</p>
          ) : null}
          {hasSocials ? (
            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-[var(--tp-cta-contrast)]/75">
              {whatsappLink ? (
                <li>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[var(--tp-cta-contrast)]"
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
                    className="transition hover:text-[var(--tp-cta-contrast)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tp-cta-contrast)]/45">
            Explore
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--tp-cta-contrast)]/80">
            {links.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link href={link.href} className="transition hover:text-[var(--tp-cta-contrast)]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {hasContact ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tp-cta-contrast)]/45">
              Contact
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--tp-cta-contrast)]/80">
              {phone ? (
                <li>
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-2 transition hover:text-[var(--tp-cta-contrast)]"
                  >
                    <PhoneIcon className="h-4 w-4 shrink-0" /> {phone}
                  </a>
                </li>
              ) : null}
              {email ? (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="transition hover:text-[var(--tp-cta-contrast)]"
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
                    className="flex items-start gap-2 text-[var(--tp-cta-contrast)]/65 transition hover:text-[var(--tp-cta-contrast)]"
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
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tp-cta-contrast)]/45">
              Hours &amp; credentials
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--tp-cta-contrast)]/65">
              {hoursText ? (
                <li className="flex items-start gap-2">
                  <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                  <span>{hoursText}</span>
                </li>
              ) : null}
              {license ? (
                <li>
                  <span className="opacity-50">License</span> · {license}
                </li>
              ) : null}
              {insurance ? (
                <li>
                  <span className="opacity-50">Insurance</span> · {insurance}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/10">
        <div className="tp-container flex flex-col gap-3 py-4 text-xs text-[var(--tp-cta-contrast)]/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {tenant.name}. All rights reserved.
          </span>
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Legal">
            <Link href="/privacy" className="transition hover:text-[var(--tp-cta-contrast)]/80">
              Privacy
            </Link>
            <span aria-hidden className="opacity-30">
              ·
            </span>
            <Link href="/terms" className="transition hover:text-[var(--tp-cta-contrast)]/80">
              Terms
            </Link>
            <span aria-hidden className="opacity-30">
              ·
            </span>
            <span>
              Powered by{' '}
              <a
                href="https://torqstudio.com"
                className="underline-offset-4 transition hover:underline hover:text-[var(--tp-cta-contrast)]/80"
              >
                Torq Studio
              </a>
            </span>
          </nav>
        </div>
      </div>
    </footer>
  )
}
