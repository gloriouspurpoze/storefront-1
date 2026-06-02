import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await loadTenantFromRequest()
  const h = await headers()
  const host = h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const base = `${proto}://${host}`

  if (!tenant) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  const cfg = await fetchStorefrontConfig(tenant.id)
  const indexable = cfg?.seo?.robots?.indexable !== false
  const follow = cfg?.seo?.robots?.followLinks !== false

  return {
    rules: {
      userAgent: '*',
      allow: indexable ? '/' : undefined,
      disallow: indexable ? undefined : '/',
    },
    sitemap: cfg?.seo?.sitemapEnabled !== false ? `${base}/sitemap.xml` : undefined,
  }
}
