import { fetchStorefrontNavLinks } from '@/lib/cms-content'
import { fetchStorefrontConfig, type StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from './types'
import { SiteHeaderClient } from './SiteHeaderClient'

/**
 * Restaurant header for every page; fetches config / CMS links when a page
 * doesn't pass them (cached + deduped) so the header is identical everywhere.
 */
export async function SiteHeader({
  tenant,
  config,
  navLinks,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  navLinks?: { href: string; label: string }[]
}) {
  const [cfg, links] = await Promise.all([
    config !== undefined ? config : fetchStorefrontConfig(tenant.id),
    navLinks ?? fetchStorefrontNavLinks(tenant.id, 'header', 'restaurant'),
  ])
  return <SiteHeaderClient tenant={tenant} config={cfg} navLinks={links} />
}
