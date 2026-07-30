import type { Metadata } from 'next'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { metadataForPath } from '@/lib/seo-from-config'

/** Page-level metadata that honors Studio `seo.pages` overrides. */
export async function storefrontPathMetadata(pathname: string): Promise<Metadata> {
  const tenant = await loadTenantFromRequest()
  if (!tenant) return { title: 'Store' }
  const cfg = await fetchStorefrontConfig(tenant.id)
  const siteName = cfg?.branding?.siteName || tenant.name
  return metadataForPath(cfg, siteName, pathname)
}
