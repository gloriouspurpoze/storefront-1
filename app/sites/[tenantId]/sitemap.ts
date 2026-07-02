import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { assertRouteTenant } from '@/lib/load-tenant'
import { env } from '@/lib/env'
import { withTenantId } from '@/lib/tenant-headers'

interface SitemapApiUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
}

export default async function sitemap({
  params,
}: {
  params: Promise<{ tenantId: string }>
}): Promise<MetadataRoute.Sitemap> {
  const { tenantId } = await params
  const tenant = await assertRouteTenant(tenantId)

  const h = await headers()
  const host = h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const baseUrl = `${proto}://${host}`

  try {
    const res = await fetch(
      `${env.API_BASE_URL.replace(/\/+$/, '')}/public/storefront/sitemap?baseUrl=${encodeURIComponent(baseUrl)}`,
      {
        headers: withTenantId(tenant.id, { Accept: 'application/json' }),
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) return [{ url: baseUrl, lastModified: new Date() }]
    const json = (await res.json()) as { success?: boolean; data?: { urls?: SitemapApiUrl[] } }
    const urls = json?.data?.urls ?? []
    return urls.map((u) => ({
      url: u.loc,
      lastModified: u.lastmod ? new Date(u.lastmod) : new Date(),
      changeFrequency: (u.changefreq as MetadataRoute.Sitemap[0]['changeFrequency']) ?? 'weekly',
      priority: u.priority ?? 0.5,
    }))
  } catch {
    return [{ url: baseUrl, lastModified: new Date() }]
  }
}
