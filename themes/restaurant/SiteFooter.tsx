import { fetchStorefrontConfig, type StorefrontConfig } from '@/lib/storefront-api'
import { StoreFooter, addonFooterLinks, splitFooterLinks } from '@/components/chrome/StoreFooter'
import { fetchStorefrontNavLinks } from '@/lib/cms-content'
import type { ThemeTenant } from './types'

const DEFAULT_LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/reserve', label: 'Reservations' },
  { href: '/contact', label: 'Contact' },
]

const VISIT_LINKS = [
  { href: '/about', label: 'Our story' },
  { href: '/orders/track', label: 'Track order' },
  { href: '/shipping-policy', label: 'Delivery policy' },
]

export async function SiteFooter({
  tenant,
  navLinks,
  config,
}: {
  tenant: ThemeTenant
  navLinks?: { href: string; label: string }[]
  config?: StorefrontConfig | null
}) {
  const [cfg, cmsLinks] = await Promise.all([
    config !== undefined ? config : fetchStorefrontConfig(tenant.id),
    navLinks ?? fetchStorefrontNavLinks(tenant.id, 'footer', 'restaurant'),
  ])
  const links = cmsLinks.length ? cmsLinks : DEFAULT_LINKS
  const columns = [...splitFooterLinks(links, ['Order', 'Explore']), { title: 'Visit', links: [...VISIT_LINKS, ...addonFooterLinks(cfg, 'restaurant')] }]

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
