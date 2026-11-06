import { headers } from 'next/headers'
import { assertRouteTenant } from '@/lib/load-tenant'
import { env } from '@/lib/env'
import { withTenantId } from '@/lib/tenant-headers'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchStorefrontBlogPosts } from '@/lib/cms-blog'
import { isBrownButterNavEnabled, isBrownButterTheme } from '@/themes/private/thebrownbutter/brownButterNav'
import { BROWN_BUTTER_REDIRECTED_PATHS, brownButterSitePages } from '@/themes/private/thebrownbutter/brownButterSeo'

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

/** Theme pages the API list doesn't know about, minus paths the theme redirects away. */
async function withThemePages(
  tenantId: string,
  baseUrl: string,
  urls: SitemapApiUrl[],
): Promise<SitemapApiUrl[]> {
  const cfg = await fetchStorefrontConfig(tenantId).catch(() => null)
  if (!isBrownButterTheme(cfg?.themeKey)) return urls
  const pathOf = (loc: string) => loc.replace(baseUrl, '').replace(/\/+$/, '') || '/'
  const kept = urls.filter((u) => !BROWN_BUTTER_REDIRECTED_PATHS.has(pathOf(u.loc)))
  const have = new Set(kept.map((u) => pathOf(u.loc)))
  const extra: SitemapApiUrl[] = []
  for (const page of brownButterSitePages(cfg)) {
    if (!have.has(page.path)) extra.push({ loc: `${baseUrl}${page.path}`, changefreq: 'monthly', priority: 0.6 })
  }
  if (isBrownButterNavEnabled(cfg, 'showJournalNav')) {
    const posts = await fetchStorefrontBlogPosts(tenantId).catch(() => [])
    for (const post of posts) {
      const path = `/blog/${encodeURIComponent(post.slug)}`
      if (!have.has(path)) {
        extra.push({ loc: `${baseUrl}${path}`, lastmod: post.date || undefined, changefreq: 'monthly', priority: 0.5 })
      }
    }
  }
  return [...kept, ...extra]
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

  urls = await withThemePages(tenant.id, baseUrl, urls)

  return new Response(renderSitemap(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
