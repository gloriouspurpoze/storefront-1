import type { Metadata } from 'next'
import { PLATFORM_BRAND, siteUrl } from './config'
import type { SeoOverride } from './cms'

/** OG image served by `app/platform/og/route.tsx` (public path `/og`). */
export function ogImageUrl(title: string, eyebrow?: string): string {
  const params = new URLSearchParams({ title })
  if (eyebrow) params.set('eyebrow', eyebrow)
  return siteUrl(`/og?${params.toString()}`)
}

/**
 * Per-page metadata: unique title + description, canonical URL, Open Graph and
 * Twitter cards. `path` is the public path (e.g. `/pricing`), not the internal `/platform/...`.
 */
export function pageMetadata({
  title,
  description,
  path,
  ogTitle,
  eyebrow,
  type = 'website',
  absoluteTitle = false,
  override,
}: {
  title: string
  description: string
  path: string
  ogTitle?: string
  eyebrow?: string
  type?: 'website' | 'article'
  absoluteTitle?: boolean
  /** Admin → CMS → SEO entry for this path; its fields win over the built-in ones. */
  override?: SeoOverride | null
}): Metadata {
  title = override?.title ?? title
  description = override?.description ?? description
  const url = siteUrl(path)
  const shareTitle = override?.title ?? ogTitle ?? title
  const image = override?.ogImage ?? ogImageUrl(shareTitle, eyebrow)
  // A CMS image has unknown dimensions; only the generated one is known to be 1200×630.
  const imageMeta = override?.ogImage ? { url: image, alt: shareTitle } : { url: image, width: 1200, height: 630, alt: shareTitle }
  return {
    title: skipTitleSuffix(title, absoluteTitle) ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: shareTitle,
      description,
      url,
      type,
      siteName: PLATFORM_BRAND,
      locale: 'en_IN',
      images: [imageMeta],
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [image] },
    ...(override?.noindex ? { robots: { index: false, follow: true } } : {}),
  }
}

/** Google truncates titles at roughly 60 characters (~580px). */
export const MAX_TITLE_LENGTH = 60
const TITLE_SUFFIX = ` | ${PLATFORM_BRAND}`

/**
 * Whether to skip the layout's "| Torq Studio" suffix: the title already names the brand
 * (often a CMS SEO title), or the suffix would push it past the length Google shows, which
 * would cut off the page's own keywords. Google still shows the brand from WebSite schema.
 */
export function skipTitleSuffix(title: string, force = false): boolean {
  return force || title.includes(PLATFORM_BRAND) || title.length + TITLE_SUFFIX.length > MAX_TITLE_LENGTH
}

export function truncate(text: string, max = 158): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}
