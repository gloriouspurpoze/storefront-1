import type { Metadata } from 'next'
import type { StorefrontConfig } from './storefront-api'

/**
 * Fallback page names when Studio has no `seo.pages[path].title`. The layout's
 * title template appends the site name ("About us · Brand"), so falling back to
 * the site name itself would render "Brand · Brand".
 */
const PATH_TITLES: Record<string, string> = {
  '/about': 'About us',
  '/contact': 'Contact us',
  '/menu': 'Menu',
  '/products': 'Shop all',
  '/blog': 'Blog',
  '/shipping-policy': 'Shipping policy',
  '/services': 'Services',
  '/reserve': 'Reserve a table',
  '/amc': 'Annual maintenance plans',
  '/wholesale': 'Wholesale & bulk orders',
}

export function metadataForPath(
  cfg: StorefrontConfig | null,
  siteName: string,
  pathname: string,
): Pick<Metadata, 'title' | 'description' | 'robots' | 'openGraph' | 'alternates'> {
  const seo = cfg?.seo ?? {}
  const path = pathname.replace(/\/$/, '') || '/'
  const page = seo.pages?.[pathname] ?? seo.pages?.[path]
  const homeTitle = seo.defaultTitle || siteName
  const fallbackName = PATH_TITLES[path]
  // Home and unnamed paths use the site title as-is (no "Brand · Brand").
  const title: Metadata['title'] = page?.title
    ? page.title
    : path !== '/' && fallbackName
      ? fallbackName
      : { absolute: homeTitle }
  const ogTitle = typeof title === 'string' ? `${title} · ${siteName}` : homeTitle
  const description = page?.description || seo.defaultDescription || cfg?.branding?.tagline || ''
  const noindex = page?.noindex === true || seo.robots?.indexable === false

  return {
    title,
    description,
    robots: noindex ? { index: false, follow: seo.robots?.followLinks !== false } : undefined,
    // Relative: resolved against the layout's `metadataBase` (canonical domain or request host).
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      images: page?.ogImageUrl || seo.ogImageUrl ? [{ url: page?.ogImageUrl || seo.ogImageUrl! }] : undefined,
    },
  }
}
