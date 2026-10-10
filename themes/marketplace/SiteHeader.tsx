import { fetchStorefrontNavLinks } from '@/lib/cms-content'
import {
  fetchStorefrontCategories,
  fetchStorefrontConfig,
  type StorefrontConfig,
  type StorefrontProductCategory,
} from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { SiteHeaderClient } from './SiteHeaderClient'

const DEFAULT_LINKS = [
  { href: '/sellers', label: 'Sellers' },
  { href: '/sell', label: 'Sell' },
]

/**
 * Marketplace header: search-first bar, category mega menu, sellers + "Sell" links, and the
 * multi-seller cart drawer. Self-fetches whatever the page doesn't pass (cached per request).
 */
export async function SiteHeader({
  tenant,
  config,
  navLinks,
  categories,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  navLinks?: { href: string; label: string }[]
  categories?: StorefrontProductCategory[]
}) {
  const [cfg, links, cats] = await Promise.all([
    config !== undefined ? config : fetchStorefrontConfig(tenant.id),
    navLinks ?? fetchStorefrontNavLinks(tenant.id, 'header', 'marketplace'),
    categories ?? fetchStorefrontCategories(tenant.id),
  ])
  // Sellers / Sell are the marketplace's own nav — always present, never duplicated.
  const merged = [...DEFAULT_LINKS, ...links.filter((l) => !DEFAULT_LINKS.some((d) => d.href === l.href))]
  return <SiteHeaderClient tenant={tenant} config={cfg} navLinks={merged} categories={cats} />
}
