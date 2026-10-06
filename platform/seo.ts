import type { Metadata } from 'next'
import { PLATFORM_BRAND, siteUrl } from './config'

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
}: {
  title: string
  description: string
  path: string
  ogTitle?: string
  eyebrow?: string
  type?: 'website' | 'article'
  absoluteTitle?: boolean
}): Metadata {
  const url = siteUrl(path)
  const image = ogImageUrl(ogTitle ?? title, eyebrow)
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle ?? title,
      description,
      url,
      type,
      siteName: PLATFORM_BRAND,
      locale: 'en_IN',
      images: [{ url: image, width: 1200, height: 630, alt: ogTitle ?? title }],
    },
    twitter: { card: 'summary_large_image', title: ogTitle ?? title, description, images: [image] },
  }
}

export function truncate(text: string, max = 158): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}
