/**
 * Real <lastmod> dates for the hand-built marketing pages: the newest git commit touching
 * the files that make up a page's content (recorded at build time by
 * `scripts/page-lastmod.mjs`), or a newer edit to its CMS SEO entry. Never the deploy time —
 * Google stops trusting lastmod that changes on every deploy.
 */
import { MARKETING_VERTICALS, type VerticalKey } from '@profixer/marketing-data'
import RECORDED from './content/page-lastmod.json'

const PKG = '../packages/marketing-data/src'
const PLAN_FILES: Partial<Record<VerticalKey, string>> = {
  home_services: `${PKG}/plans/home_services.ts`,
  restaurant: `${PKG}/plans/restaurant.ts`,
  salon: `${PKG}/plans/salon.ts`,
  retail: `${PKG}/plans/retail.ts`,
}
const planFile = (key: VerticalKey) => PLAN_FILES[key] ?? `${PKG}/plans/home_services.ts`
const OFFER = 'platform/content/offer.ts'

/** Content sources per public path (keep in sync with ROOTS in scripts/page-lastmod.mjs). */
export function pageSources(path: string): string[] {
  if (path === '/') return ['app/platform/page.tsx', 'platform/content/home.ts', OFFER, `${PKG}/verticals.ts`, planFile('home_services')]
  if (path === '/pricing') return ['app/platform/pricing/page.tsx', OFFER, `${PKG}/verticals.ts`, ...Object.values(PLAN_FILES)]
  const vertical = MARKETING_VERTICALS.find((v) => `/${v.marketingSlug}` === path)
  if (!vertical) return []
  return [
    'app/platform/[slug]/page.tsx',
    'platform/content/previews.ts',
    OFFER,
    `${PKG}/landingContent.ts`,
    `${PKG}/verticals.ts`,
    planFile(vertical.key),
  ]
}

/** Newest valid ISO date, or undefined. Pure — exported for tests. */
export function latestDate(dates: readonly (string | undefined)[]): string | undefined {
  const times = dates.map((d) => (d ? Date.parse(d) : NaN)).filter((t) => Number.isFinite(t))
  return times.length ? new Date(Math.max(...times)).toISOString() : undefined
}

export function pageLastmod(path: string, cmsUpdatedAt?: string, recorded: Record<string, string> = RECORDED): string | undefined {
  return latestDate([...pageSources(path).map((file) => recorded[file]), cmsUpdatedAt])
}
