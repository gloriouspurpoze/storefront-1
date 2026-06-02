import type { Metadata } from 'next'
import type { StorefrontConfig } from './storefront-api'

export function metadataForPath(
  cfg: StorefrontConfig | null,
  siteName: string,
  pathname: string,
): Pick<Metadata, 'title' | 'description' | 'robots' | 'openGraph'> {
  const seo = cfg?.seo ?? {}
  const page = seo.pages?.[pathname] ?? seo.pages?.[pathname.replace(/\/$/, '') || '/']
  const title = page?.title || seo.defaultTitle || siteName
  const description = page?.description || seo.defaultDescription || cfg?.branding?.tagline || ''
  const noindex = page?.noindex === true || seo.robots?.indexable === false

  return {
    title,
    description,
    robots: noindex ? { index: false, follow: seo.robots?.followLinks !== false } : undefined,
    openGraph: {
      title,
      description,
      images: page?.ogImageUrl || seo.ogImageUrl ? [{ url: page?.ogImageUrl || seo.ogImageUrl! }] : undefined,
    },
  }
}
