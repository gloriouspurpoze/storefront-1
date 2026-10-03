import { fetchStorefrontConfig, type StorefrontConfig } from '@/lib/storefront-api'
import { StoreFooter, addonFooterLinks, splitFooterLinks } from '@/components/chrome/StoreFooter'
import { fetchStorefrontNavLinks } from '@/lib/cms-content'
import type { ThemeTenant } from './types'
import { resolveBookingAddon, withoutBookingLinks } from './bookingAddon'

const DEFAULT_LINKS = [
  { href: '/services', label: 'Browse all' },
  { href: '/book', label: 'Book now' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export async function SiteFooter({
  tenant,
  navLinks,
  bookingEnabled,
  config,
}: {
  tenant: ThemeTenant
  navLinks?: { href: string; label: string }[]
  /** Service booking add-on; resolved from the storefront config when omitted. */
  bookingEnabled?: boolean
  config?: StorefrontConfig | null
}) {
  const [booking, cfg, cmsLinks] = await Promise.all([
    resolveBookingAddon(tenant.id, bookingEnabled),
    config !== undefined ? Promise.resolve(config) : fetchStorefrontConfig(tenant.id),
    navLinks ?? fetchStorefrontNavLinks(tenant.id, 'footer', 'home_services'),
  ])
  const links = withoutBookingLinks(cmsLinks.length ? cmsLinks : DEFAULT_LINKS, booking)
  const columns = [
    ...splitFooterLinks(links, ['Services', 'Company']),
    { title: 'Support', links: [{ href: '/contact', label: 'Get help' }, { href: '/account', label: 'My account' }, ...addonFooterLinks(cfg, 'home_services')] },
  ]

  return (
    <StoreFooter
      name={tenant.name}
      tagline={tenant.tagline}
      logoUrl={cfg?.branding?.logoUrl}
      columns={columns}
      config={cfg}
    />
  )
}
