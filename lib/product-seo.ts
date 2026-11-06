import type { Metadata } from 'next'
import type { PublicProduct, StorefrontConfig } from './storefront-api'
import { resolveProductGalleryUrls } from './storefront-api'

/** Strip HTML tags for meta descriptions and JSON-LD text fields. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function containsHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text)
}

export function productDescription(product: PublicProduct): string {
  const raw = product.shortDescription ?? product.description ?? ''
  const plain = stripHtml(raw)
  return plain || `Buy ${product.name} online.`
}

export function resolveStorefrontBaseUrl(
  cfg: StorefrontConfig | null,
  host?: string | null,
  proto = 'https',
): string | undefined {
  const configured = cfg?.seo?.canonicalDomain?.replace(/\/$/, '')
  if (configured) return configured
  if (host) return `${proto}://${host}`
  return undefined
}

export function productPageUrl(baseUrl: string | undefined, slug: string): string | undefined {
  if (!baseUrl) return undefined
  return `${baseUrl}/products/${encodeURIComponent(slug)}`
}

export function buildProductMetadata(
  product: PublicProduct,
  cfg: StorefrontConfig | null,
  siteName: string,
  baseUrl?: string,
): Metadata {
  const description = productDescription(product)
  const url = productPageUrl(baseUrl, product.slug)
  const title = product.name
  const images = product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : undefined
  const seo = cfg?.seo ?? {}
  const robotsIndex = seo.robots?.indexable !== false
  const robotsFollow = seo.robots?.followLinks !== false
  const categoryKeywords = product.categoryName ? [product.name, product.categoryName] : [product.name]

  return {
    title,
    description,
    keywords: [...categoryKeywords, ...(seo.defaultKeywords ?? [])],
    alternates: url ? { canonical: url } : undefined,
    robots: { index: robotsIndex, follow: robotsFollow },
    openGraph: {
      type: 'website',
      title: `${title} · ${siteName}`,
      description,
      url,
      siteName,
      images,
    },
    // Open Graph product tags (read by Facebook/Pinterest catalog + link unfurlers).
    other: {
      'product:price:amount': String(product.price),
      'product:price:currency': product.currency || 'INR',
      'product:availability': product.inStock ? 'in stock' : 'out of stock',
    },
    twitter:
      seo.twitterHandle || product.imageUrl
        ? {
            card: product.imageUrl ? 'summary_large_image' : 'summary',
            site: seo.twitterHandle,
            title,
            description,
            images: product.imageUrl ? [product.imageUrl] : undefined,
          }
        : undefined,
  }
}

export function buildProductJsonLd(
  product: PublicProduct,
  siteName: string,
  baseUrl?: string,
): Record<string, unknown> {
  const url = productPageUrl(baseUrl, product.slug)
  const description = productDescription(product)
  const currency = product.currency || 'INR'
  const images = resolveProductGalleryUrls(product)
  const availability = (inStock: boolean) =>
    inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  // Marketplace products are sold by an independent seller, not the site operator.
  const seller = {
    '@type': 'Organization',
    name: product.sellerName || siteName,
    ...(product.sellerSlug && baseUrl ? { url: `${baseUrl}/store/${encodeURIComponent(product.sellerSlug)}` } : {}),
  }
  const variants = (product.variants ?? []).filter((v) => Number.isFinite(v.price))
  const offers =
    variants.length > 1
      ? {
          '@type': 'AggregateOffer',
          url,
          priceCurrency: currency,
          lowPrice: Math.min(...variants.map((v) => v.price)),
          highPrice: Math.max(...variants.map((v) => v.price)),
          offerCount: variants.length,
          availability: availability(variants.some((v) => v.inStock !== false) && product.inStock),
          seller,
          offers: variants.map((v) => ({
            '@type': 'Offer',
            name: v.name,
            url,
            price: v.price,
            priceCurrency: currency,
            availability: availability(v.inStock !== false && product.inStock),
            itemCondition: 'https://schema.org/NewCondition',
          })),
        }
      : {
          '@type': 'Offer',
          url,
          priceCurrency: currency,
          price: variants[0]?.price ?? product.price,
          availability: availability(product.inStock),
          itemCondition: 'https://schema.org/NewCondition',
          seller,
        }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    ...(url ? { '@id': `${url}#product`, url } : {}),
    name: product.name,
    description,
    image: images.length ? images : undefined,
    sku: product.id,
    category: product.categoryName,
    brand: {
      '@type': 'Brand',
      name: siteName,
    },
    offers,
    // Only real review data — never synthesize ratings.
    ...(product.totalReviews && product.totalReviews > 0 && product.averageRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating,
            reviewCount: product.totalReviews,
          },
        }
      : {}),
  }
}

export function buildProductBreadcrumbJsonLd(
  product: PublicProduct,
  baseUrl?: string,
  /** Middle crumb; `null` for stores without a catalog page (Home → Product). */
  listing: { name: string; path: string } | null = { name: 'Shop', path: '/products' },
): Record<string, unknown> | null {
  if (!baseUrl) return null
  const crumbs: Array<{ name: string; item: string }> = [{ name: 'Home', item: `${baseUrl}/` }]
  if (listing) crumbs.push({ name: listing.name, item: `${baseUrl}${listing.path}` })
  crumbs.push({ name: product.name, item: `${baseUrl}/products/${encodeURIComponent(product.slug)}` })
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })),
  }
}
