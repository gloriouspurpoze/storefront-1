import { headers } from 'next/headers'
import { assertRouteTenant } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'

export const revalidate = 600

/**
 * Tenant /robots.txt. Middleware rewrites the custom-domain path onto
 * /sites/[tenantId]/robots.txt. Next only recognises a `robots.ts` metadata
 * file at the app root, so a nested one was silently ignored (404).
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
  const base = `${proto}://${host}`.replace(/\/+$/, '')

  const cfg = await fetchStorefrontConfig(tenant.id)
  const indexable = cfg?.seo?.robots?.indexable !== false

  const lines = ['User-agent: *']
  if (indexable) {
    // Private / transactional pages never belong in an index.
    lines.push('Allow: /', 'Disallow: /cart', 'Disallow: /checkout', 'Disallow: /account')
  } else {
    lines.push('Disallow: /')
  }
  if (cfg?.seo?.sitemapEnabled !== false) {
    lines.push('', `Sitemap: ${base}/sitemap.xml`)
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    },
  })
}
