import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import { resolveProductGalleryUrls } from '@/lib/storefront-api'
import {
  getOrderingHoursFromConfig,
  ORDERING_DAY_KEYS,
  ORDERING_DAY_LABELS,
  parseOrderingTime12h,
} from '@/lib/orderingHours'
import { productDescription, productPageUrl } from '@/lib/product-seo'
import { layoutBrownButterProducts } from './productLayout'
import { isBrownButterNavEnabled } from './brownButterNav'

/** Every menu card shows the veg mark; schema says the same thing the page does. */
const VEG_DIET = 'https://schema.org/VegetarianDiet'

function hhmm(time?: string): string | null {
  const minutes = parseOrderingTime12h(time)
  if (minutes === null) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Weekly ordering hours → schema.org OpeningHoursSpecification (closed days omitted). */
export function brownButterOpeningHours(config: StorefrontConfig | null) {
  const hours = getOrderingHoursFromConfig(config)
  return ORDERING_DAY_KEYS.flatMap((day) => {
    const d = hours[day]
    const opens = hhmm(d.openTime)
    const closes = hhmm(d.closeTime)
    if (d.closed || !opens || !closes) return []
    return [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${ORDERING_DAY_LABELS[day]}`,
        opens,
        closes,
      },
    ]
  })
}

export function brownButterPriceRange(products: PublicProduct[]): string | undefined {
  const prices = products
    .flatMap((p) => (p.variants?.length ? p.variants.map((v) => v.price) : [p.price]))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (!prices.length) return undefined
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  return lo === hi ? `₹${lo}` : `₹${lo}–₹${hi}`
}

/**
 * Homepage graph: WebSite + Bakery (with the full menu). LLM answer engines and
 * Google read this to answer "where can I get NYC cookies in Mira Road", prices,
 * hours, and delivery questions without running the page's JavaScript.
 */
export function buildBrownButterHomeJsonLd({
  config,
  siteName,
  baseUrl,
  logoUrl,
  products,
}: {
  config: StorefrontConfig | null
  siteName: string
  baseUrl?: string
  logoUrl?: string
  products: PublicProduct[]
}): Record<string, unknown> {
  const home = baseUrl ? `${baseUrl}/` : undefined
  const branding = config?.branding
  const description =
    config?.seo?.defaultDescription?.trim() || branding?.tagline?.trim() || `${siteName} — fresh baked cookies.`
  const socials = Object.values(branding?.socials ?? {}).filter(
    (s): s is string => typeof s === 'string' && /^https?:\/\//i.test(s),
  )
  const sections = layoutBrownButterProducts(products)
    .filter((s) => s.items.length > 0)
    .map((section) => ({
      '@type': 'MenuSection',
      name: section.label,
      hasMenuItem: section.items.flatMap((item) => {
        const list = item.kind === 'tin' ? item.group.variants : [item.product]
        return list.map((p) => {
          const url = productPageUrl(baseUrl, p.slug)
          const image = resolveProductGalleryUrls(p)[0]
          return {
            '@type': 'MenuItem',
            name: item.kind === 'tin' && 'sizeLabel' in p ? `${item.group.name} (${p.sizeLabel})` : p.name,
            description: productDescription(p),
            ...(url ? { url } : {}),
            ...(image ? { image } : {}),
            suitableForDiet: VEG_DIET,
            offers: {
              '@type': 'Offer',
              price: p.price,
              priceCurrency: p.currency || 'INR',
              availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              ...(url ? { url } : {}),
            },
          }
        })
      }),
    }))

  const bakery: Record<string, unknown> = {
    '@type': 'Bakery',
    ...(home ? { '@id': `${home}#bakery`, url: home } : {}),
    name: siteName,
    description,
    ...(logoUrl ? { logo: logoUrl, image: logoUrl } : {}),
    ...(branding?.contactPhone ? { telephone: branding.contactPhone } : {}),
    ...(branding?.contactEmail ? { email: branding.contactEmail } : {}),
    ...(branding?.address
      ? { address: { '@type': 'PostalAddress', streetAddress: branding.address, addressCountry: 'IN' } }
      : {}),
    servesCuisine: ['Cookies', 'Desserts'],
    currenciesAccepted: 'INR',
    ...(brownButterPriceRange(products) ? { priceRange: brownButterPriceRange(products) } : {}),
    openingHoursSpecification: brownButterOpeningHours(config),
    ...(socials.length ? { sameAs: socials } : {}),
    ...(sections.length
      ? {
          hasMenu: {
            '@type': 'Menu',
            name: `${siteName} menu`,
            ...(home ? { url: home } : {}),
            hasMenuSection: sections,
          },
        }
      : {}),
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        ...(home ? { '@id': `${home}#website`, url: home } : {}),
        name: siteName,
        description,
        inLanguage: 'en-IN',
        ...(home ? { publisher: { '@id': `${home}#bakery` } } : {}),
      },
      bakery,
    ],
  }
}

/** Real, indexable Brown Butter pages (respects the theme's nav on/off toggles). */
export function brownButterSitePages(
  config: StorefrontConfig | null,
): Array<{ path: string; label: string; about: string }> {
  const pages = [{ path: '/', label: 'Menu & ordering', about: 'full menu with prices; order for pickup or delivery' }]
  if (isBrownButterNavEnabled(config, 'showAboutNav'))
    pages.push({ path: '/about', label: 'About', about: 'our story and how we bake' })
  if (isBrownButterNavEnabled(config, 'showJournalNav'))
    pages.push({ path: '/blog', label: 'The Cookie Journal', about: 'stories and baking notes' })
  if (isBrownButterNavEnabled(config, 'showTalkNav'))
    pages.push({ path: '/contact', label: 'Talk to us', about: 'custom orders, gifting and questions' })
  pages.push({ path: '/shipping-policy', label: 'Shipping policy', about: 'pickup, delivery areas, fees and timings' })
  return pages
}

/** Paths the Brown Butter site does not serve (they redirect to `/`). */
export const BROWN_BUTTER_REDIRECTED_PATHS = new Set(['/products', '/menu', '/reserve'])
