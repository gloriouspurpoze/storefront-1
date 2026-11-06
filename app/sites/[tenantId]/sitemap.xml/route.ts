import { headers } from 'next/headers'
import { assertRouteTenant } from '@/lib/load-tenant'
import { env } from '@/lib/env'
import { withTenantId } from '@/lib/tenant-headers'

export const revalidate = 300

interface SitemapApiUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toIsoDate(value: string | undefined): string {
  const d = value ? new Date(value) : new Date()
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function renderSitemap(urls: SitemapApiUrl[]): string {
  const entries = urls
    .filter((u) => typeof u.loc === 'string' && u.loc)
    .map((u) => {
      const parts = [
        `<loc>${xmlEscape(u.loc)}</loc>`,
        `<lastmod>${toIsoDate(u.lastmod)}</lastmod>`,
        `<changefreq>${xmlEscape(u.changefreq || 'weekly')}</changefreq>`,
        `<priority>${typeof u.priority === 'number' ? u.priority : 0.5}</priority>`,
      ]
      return `<url>\n${parts.join('\n')}\n</url>`
    })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
}

/**
 * Tenant /sitemap.xml. Middleware rewrites the custom-domain path onto
 * /sites/[tenantId]/sitemap.xml. This is a plain route handler rather than a
 * `sitemap.ts` metadata file: Next never passes segment `params` to sitemap
 * functions, so the old file threw on every request (500 → Search Console 404).
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await ctx.params
  const tenant = await assertRouteTenant(tenantId)

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const baseUrl = `${proto}://${host}`.replace(/\/+$/, '')

  let urls: SitemapApiUrl[] = [{ loc: `${baseUrl}/` }]
  try {
    const res = await fetch(
      `${env.API_BASE_URL.replace(/\/+$/, '')}/public/storefront/sitemap?baseUrl=${encodeURIComponent(baseUrl)}`,
      {
        headers: withTenantId(tenant.id, { Accept: 'application/json' }),
        next: { revalidate: 300 },
      },
    )
    if (res.ok) {
      const json = (await res.json()) as { data?: { urls?: SitemapApiUrl[] } }
      const fromApi = json?.data?.urls ?? []
      if (fromApi.length) urls = fromApi
    }
  } catch {
    // Fall back to the home page so crawlers always get a valid sitemap.
  }

  return new Response(renderSitemap(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
