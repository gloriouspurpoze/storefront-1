import { fetchStorefrontConfig, type StorefrontConfig } from '@/lib/storefront-api'
import { StoreFooter, addonFooterLinks, splitFooterLinks } from '@/components/chrome/StoreFooter'
import { fetchStorefrontNavLinks } from '@/lib/cms-content'
import type { ThemeTenant } from './types'

const SHOP_LINKS = [
  { href: '/products', label: 'Shop all' },
  { href: '/sellers', label: 'All sellers' },
  { href: '/search', label: 'Search' },
]

const SELL_LINKS = [
  { href: '/sell', label: 'Sell with us' },
  { href: '/sell/apply', label: 'Apply to sell' },
]

const HELP_LINKS = [
  { href: '/account/orders', label: 'My orders' },
  { href: '/account', label: 'My account' },
  { href: '/contact', label: 'Contact us' },
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
    navLinks ?? fetchStorefrontNavLinks(tenant.id, 'footer', 'marketplace'),
  ])
  const help = [...HELP_LINKS, ...addonFooterLinks(cfg, 'retail')]
  const columns = cmsLinks.length
    ? [...splitFooterLinks(cmsLinks, ['Shop', 'Explore']), { title: 'Sell', links: SELL_LINKS }, { title: 'Help', links: help }]
    : [
        { title: 'Shop', links: SHOP_LINKS },
        { title: 'Sell', links: SELL_LINKS },
        { title: 'Help', links: help },
        { title: 'Company', links: [{ href: '/about', label: 'About' }, { href: '/blog', label: 'Journal' }] },
      ]

  return (
    <StoreFooter
      name={tenant.name}
      tagline={tenant.tagline}
      logoUrl={cfg?.branding?.logoUrl}
      columns={columns}
      config={cfg}
      bottomNote={
        <>
          Every order is fulfilled by an independent seller · Secure checkout · Powered by{' '}
          <a href="https://torqstudio.com">Torq Studio</a>
        </>
      }
    />
  )
}
