/**
 * Torq Studio site content edited in admin (CMS → Torq Studio website): plan prices and copy,
 * industries, and the home feature cards. Stored as global static-content rows in fixer-backend;
 * the defaults and merge rules live in `@profixer/marketing-data` (`siteContent.ts`).
 *
 * Any fetch failure → the built-in content, so the marketing site never depends on the API.
 * Saving in admin busts the `platform:site-content` tag via `/api/revalidate`.
 */
import { cache } from 'react'
import {
  PLATFORM_SITE_CONTENT_KEYS,
  resolvePlatformSiteContent,
  type PlatformSiteContent,
  type PlatformSiteSection,
} from '@profixer/marketing-data'
import { env } from '@/lib/env'

export const PLATFORM_SITE_CONTENT_TAG = 'platform:site-content'

type Section = { data?: unknown; updatedAt?: string }

async function fetchSection(section: PlatformSiteSection): Promise<Section> {
  try {
    const res = await fetch(
      `${env.API_BASE_URL.replace(/\/+$/, '')}/cms/static-content/${PLATFORM_SITE_CONTENT_KEYS[section]}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 300, tags: [PLATFORM_SITE_CONTENT_TAG] } },
    )
    if (!res.ok) return {}
    const json = (await res.json().catch(() => null)) as { data?: unknown; meta?: { updatedAt?: unknown } } | null
    const updatedAt = json?.meta?.updatedAt
    return { data: json?.data, updatedAt: typeof updatedAt === 'string' ? updatedAt : undefined }
  } catch {
    return {}
  }
}

export type StorefrontSiteContent = PlatformSiteContent & {
  /** Newest admin save across the three sections — feeds sitemap <lastmod>. */
  updatedAt?: string
}

/** One fetch per section per request, shared by metadata, JSON-LD and the page body. */
export const platformSiteContent = cache(async (): Promise<StorefrontSiteContent> => {
  const [pricing, industries, home] = await Promise.all([
    fetchSection('pricing'),
    fetchSection('industries'),
    fetchSection('home'),
  ])
  const updatedAt = [pricing, industries, home]
    .map((s) => s.updatedAt)
    .filter((d): d is string => Boolean(d) && !Number.isNaN(Date.parse(d!)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0]
  return { ...resolvePlatformSiteContent({ pricing: pricing.data, industries: industries.data, home: home.data }), updatedAt }
})
