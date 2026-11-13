import Link from 'next/link'
import type { ReactNode } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { STOREFRONT_ADDON_FLAGS, isAddonActive } from '@/lib/storefrontAddons'
import { IconMail, IconMapPin, IconPhone } from '@/ui'
import './store-footer.css'

import { dedupeFooterColumns, type FooterColumn, type FooterLink } from '@/lib/footerLinks'

export type { FooterColumn, FooterLink }
export { dedupeFooterColumns, isLegalFooterLink, splitFooterLinks } from '@/lib/footerLinks'

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'X',
  x: 'X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  whatsapp: 'WhatsApp',
}

/**
 * Shared multi-column footer used by every vertical's `SiteFooter`. Server
 * component; columns come from the CMS footer menu (split by the theme) or
 * vertical defaults. Contact + socials come from Studio branding when passed.
 */
export function StoreFooter({
  name,
  tagline,
  logoUrl,
  columns,
  config,
  trustSlot,
  bottomNote,
}: {
  name: string
  tagline?: string
  logoUrl?: string | null
  columns: FooterColumn[]
  config?: StorefrontConfig | null
  /** Optional row above the bottom bar (payment / trust badges). */
  trustSlot?: ReactNode
  bottomNote?: ReactNode
}) {
  const year = new Date().getFullYear()
  const b = config?.branding
  // Socials are URLs, except WhatsApp which Studio may store as a bare phone number.
  const socials = Object.entries(b?.socials ?? {})
    .map(([key, url]): [string, string] => {
      const v = typeof url === 'string' ? url.trim() : ''
      if (key.toLowerCase() === 'whatsapp' && v && !/^https?:\/\//.test(v)) return [key, `https://wa.me/${v.replace(/\D/g, '')}`]
      return [key, v]
    })
    .filter(([, url]) => /^https?:\/\//.test(url))
  const cols = dedupeFooterColumns(columns)

  return (
    <footer className="sf-footer">
      <div
        className="sf-footer__top sf-container"
        style={{ ['--sf-footer-cols' as string]: Math.max(1, cols.length) }}
      >
        <div className="sf-footer__brand">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="sf-footer__logo" loading="lazy" />
          ) : (
            <p className="sf-footer__name">{name}</p>
          )}
          {tagline && <p className="sf-footer__tagline">{tagline}</p>}
          {(b?.contactPhone || b?.contactEmail || b?.address) && (
            <ul className="sf-footer__contact">
              {b?.contactPhone && (
                <li>
                  <IconPhone size={16} />
                  <a href={`tel:${b.contactPhone.replace(/\s+/g, '')}`}>{b.contactPhone}</a>
                </li>
              )}
              {b?.contactEmail && (
                <li>
                  <IconMail size={16} />
                  <a href={`mailto:${b.contactEmail}`}>{b.contactEmail}</a>
                </li>
              )}
              {b?.address && (
                <li>
                  <IconMapPin size={16} />
                  <span>{b.address}</span>
                </li>
              )}
            </ul>
          )}
          {socials.length > 0 && (
            <ul className="sf-footer__socials">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {SOCIAL_LABELS[key.toLowerCase()] ?? key}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cols.map((col) => (
          <nav key={col.title} className="sf-footer__col" aria-label={col.title}>
            <p className="sf-footer__col-title">{col.title}</p>
            <ul>
              {col.links.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      {trustSlot && <div className="sf-footer__trust sf-container">{trustSlot}</div>}
      <div className="sf-footer__bottom">
        <div className="sf-container sf-footer__bottom-inner">
          <span>
            © {year} {name}. All rights reserved.
          </span>
          <span>
            {bottomNote ?? (
              <>
                Powered by <a href="https://torqstudio.com">Torq Studio</a>
              </>
            )}
          </span>
        </div>
      </div>
    </footer>
  )
}

/**
 * Footer links for paid add-on pages — only when the add-on is active, so the
 * footer never links to a page that 404s.
 */
export function addonFooterLinks(
  config: StorefrontConfig | null | undefined,
  vertical: 'retail' | 'restaurant' | 'home_services',
): FooterLink[] {
  const links: FooterLink[] = []
  if (vertical === 'retail' && isAddonActive(config, STOREFRONT_ADDON_FLAGS.wishlist)) links.push({ href: '/wishlist', label: 'Wishlist' })
  if (vertical === 'restaurant' && isAddonActive(config, STOREFRONT_ADDON_FLAGS.reservations)) links.push({ href: '/reserve', label: 'Book a table' })
  if (isAddonActive(config, STOREFRONT_ADDON_FLAGS.amc)) links.push({ href: '/amc', label: 'Maintenance plans' })
  if (isAddonActive(config, STOREFRONT_ADDON_FLAGS.b2b)) links.push({ href: '/wholesale', label: 'Wholesale' })
  return links
}
