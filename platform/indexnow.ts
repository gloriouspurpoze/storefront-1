/**
 * IndexNow (indexnow.org): tells Bing, Yandex, Seznam and Naver that pages changed, so a
 * published post is crawled in minutes. Bing's index also powers ChatGPT search and Copilot.
 *
 * Set `INDEXNOW_KEY` (8–128 letters, digits or dashes). The key is served at /indexnow.txt,
 * which proves the site owns it. Unset → nothing is submitted.
 */
import { MARKETING_VERTICALS } from '@profixer/marketing-data'
import { PLATFORM_CMS_TENANT_ID, PLATFORM_SITE_URL, siteUrl } from './config'
import { platformBlogPosts } from './cms'

export const INDEXNOW_KEY = /^[A-Za-z0-9-]{8,128}$/.test(process.env.INDEXNOW_KEY?.trim() ?? '') ? process.env.INDEXNOW_KEY!.trim() : ''

/** True when a revalidated tag belongs to the marketing site's own CMS content. Pure — exported for tests. */
export function touchesPlatformContent(tags: readonly string[], tenantId = PLATFORM_CMS_TENANT_ID): boolean {
  return Boolean(tenantId) && tags.some((t) => t === `tenant:${tenantId}` || t.startsWith(`tenant:${tenantId}:`))
}

/** Every public page whose content can come from the CMS, newest posts included. */
async function platformUrls(): Promise<string[]> {
  const posts = await platformBlogPosts(20)
  return [
    siteUrl('/'),
    siteUrl('/pricing'),
    ...MARKETING_VERTICALS.map((v) => siteUrl(`/${v.marketingSlug}`)),
    siteUrl('/blog'),
    ...posts.map((p) => siteUrl(`/blog/${p.slug}`)),
  ]
}

/** Submits the marketing site's URLs. Never throws — a failed ping must not fail a publish. */
export async function submitPlatformUrlsToIndexNow(): Promise<number> {
  const host = new URL(PLATFORM_SITE_URL).hostname
  if (!INDEXNOW_KEY || host === 'localhost' || host.endsWith('.localhost')) return 0
  try {
    const urlList = await platformUrls()
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: siteUrl('/indexnow.txt'), urlList }),
      signal: AbortSignal.timeout(5000),
    })
    return res.ok ? urlList.length : 0
  } catch {
    return 0
  }
}
