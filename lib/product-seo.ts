import type { Metadata } from 'next'
import type { PublicProduct, StorefrontConfig } from './storefront-api'

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
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    sku: product.id,
    category: product.categoryName,
    brand: {
      '@type': 'Brand',
      name: siteName,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: product.currency || 'INR',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: siteName,
      },
    },
  }
}

export function buildProductBreadcrumbJsonLd(
  product: PublicProduct,
  baseUrl?: string,
): Record<string, unknown> | null {
  if (!baseUrl) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${baseUrl}/products` },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${baseUrl}/products/${encodeURIComponent(product.slug)}`,
      },
    ],
  }
}
