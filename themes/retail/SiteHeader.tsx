import { fetchStorefrontNavLinks } from '@/lib/cms-content'
import {
  fetchStorefrontCategories,
  fetchStorefrontConfig,
  type StorefrontConfig,
  type StorefrontProductCategory,
} from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { SiteHeaderClient } from './SiteHeaderClient'

/**
 * Retail header for every page. Anything a page doesn't pass (config, CMS
 * links, categories) is fetched here — the fetches are cached and deduped per
 * request — so the header is identical on every route.
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
    navLinks ?? fetchStorefrontNavLinks(tenant.id, 'header', 'retail'),
    categories ?? fetchStorefrontCategories(tenant.id),
  ])
  return <SiteHeaderClient tenant={tenant} config={cfg} navLinks={links} categories={cats} />
}
