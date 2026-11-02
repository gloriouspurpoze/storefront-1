import { headers } from 'next/headers'
import { assertRouteTenant } from '@/lib/load-tenant'
import { fetchProducts, fetchStorefrontConfig } from '@/lib/storefront-api'
import { textResponse } from '@/platform/llms'

export const revalidate = 3600

/**
 * Tenant /llms.txt (llmstxt.org). Middleware rewrites the custom-domain
 * path onto /sites/[tenantId]/llms.txt.
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
  const name = cfg?.branding?.siteName?.trim() || tenant.name
  const description =
    cfg?.seo?.defaultDescription?.trim() || cfg?.branding?.tagline?.trim() || ''
  const products = (await fetchProducts(tenant.id, 80)).filter((p) => p.slug)

  const lines = [
    `# ${name}`,
    '',
    description ? `> ${description}` : `> ${name}`,
    '',
    '## Pages',
    `- [Home](${base}/): order online`,
    `- [Products](${base}/products): full catalog`,
    `- [Contact](${base}/contact)`,
    '',
    '## Products',
    ...(products.length
      ? products.map(
          (p) =>
            `- [${p.name}](${base}/products/${encodeURIComponent(p.slug)})${p.shortDescription ? `: ${p.shortDescription}` : ''}`,
        )
      : ['- Catalog is listed on the products page.']),
    '',
    `Machine-readable URL list: ${base}/sitemap.xml`,
    `Crawler rules: ${base}/robots.txt`,
  ]

  return textResponse(lines)
}
