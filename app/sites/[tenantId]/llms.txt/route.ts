import { headers } from 'next/headers'
import { assertRouteTenant } from '@/lib/load-tenant'
import { fetchProducts, fetchStorefrontConfig, type PublicProduct } from '@/lib/storefront-api'
import { formatDayOrderingHours, getOrderingHoursFromConfig, ORDERING_DAY_KEYS, ORDERING_DAY_LABELS } from '@/lib/orderingHours'
import { stripHtml } from '@/lib/product-seo'
import { getShippingPolicyFromConfig } from '@/lib/shippingPolicy'
import { textResponse } from '@/platform/llms'
import { isBrownButterTheme } from '@/themes/private/thebrownbutter/brownButterNav'
import { brownButterSitePages } from '@/themes/private/thebrownbutter/brownButterSeo'

export const revalidate = 3600

function money(amount: number, currency = 'INR'): string {
  return currency === 'INR' ? `₹${amount.toLocaleString('en-IN')}` : `${amount} ${currency}`
}

function priceLabel(p: PublicProduct): string {
  const prices = (p.variants?.length ? p.variants.map((v) => v.price) : [p.price]).filter(Number.isFinite)
  if (!prices.length) return ''
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  return lo === hi ? money(lo, p.currency) : `${money(lo, p.currency)}–${money(hi, p.currency)}`
}

/**
 * Tenant /llms.txt (llmstxt.org). Middleware rewrites the custom-domain
 * path onto /sites/[tenantId]/llms.txt. Plain facts an answer engine can quote:
 * what is sold, prices, where, when, and how to order.
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
  const isBrownButter = isBrownButterTheme(cfg?.themeKey)

  const branding = cfg?.branding
  const facts: string[] = []
  if (branding?.address) facts.push(`- Location: ${branding.address}`)
  if (branding?.contactPhone) facts.push(`- Phone / WhatsApp: ${branding.contactPhone}`)
  if (branding?.contactEmail) facts.push(`- Email: ${branding.contactEmail}`)
  if (isBrownButter) {
    const hours = getOrderingHoursFromConfig(cfg)
    const open = ORDERING_DAY_KEYS.filter((d) => !hours[d].closed)
    if (open.length) {
      facts.push(
        `- Ordering hours (IST): ${open.map((d) => `${ORDERING_DAY_LABELS[d].slice(0, 3)} ${formatDayOrderingHours(hours[d])}`).join('; ')}`,
      )
    }
    const policy = getShippingPolicyFromConfig(cfg)
    if (policy.summary) facts.push(`- Delivery: ${stripHtml(policy.summary)}`)
    facts.push('- All menu items are vegetarian.')
    facts.push(`- How to order: add items on the menu (${base}/), then check out online.`)
  }

  const pages = isBrownButter
    ? brownButterSitePages(cfg).map((p) => `- [${p.label}](${base}${p.path}): ${p.about}`)
    : [
        `- [Home](${base}/): order online`,
        `- [Products](${base}/products): full catalog`,
        `- [Contact](${base}/contact)`,
      ]

  const productLines = products.map((p) => {
    const blurb = stripHtml(p.shortDescription || p.description || '')
    const meta = [priceLabel(p), p.categoryName, p.inStock ? '' : 'currently sold out'].filter(Boolean).join(' · ')
    return `- [${p.name}](${base}/products/${encodeURIComponent(p.slug)})${meta ? ` (${meta})` : ''}${blurb ? `: ${blurb}` : ''}`
  })

  const lines = [
    `# ${name}`,
    '',
    description ? `> ${description}` : `> ${name}`,
    '',
    ...(facts.length ? ['## About', ...facts, ''] : []),
    '## Pages',
    ...pages,
    '',
    isBrownButter ? '## Menu' : '## Products',
    ...(productLines.length ? productLines : ['- Catalog is listed on the home page.']),
    '',
    `Machine-readable URL list: ${base}/sitemap.xml`,
    `Crawler rules: ${base}/robots.txt`,
  ]

  return textResponse(lines)
}
