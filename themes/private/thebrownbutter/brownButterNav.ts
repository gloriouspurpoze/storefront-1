import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'

export const BROWN_BUTTER_THEME_KEY = 'private-thebrownbutter'

export const BROWN_BUTTER_NAV_ITEMS = [
  { key: 'showAboutNav', href: '/about', label: 'About' },
  { key: 'showJournalNav', href: '/blog', label: 'The Cookie Journal' },
  { key: 'showTalkNav', href: '/contact', label: 'Talk to us' },
] as const

export type BrownButterNavKey = (typeof BROWN_BUTTER_NAV_ITEMS)[number]['key']

const THEME_HREFS = new Set<string>(BROWN_BUTTER_NAV_ITEMS.map((item) => item.href))

/** Path-only key so `/about`, `about`, and `/about/` match. External URLs stay as typed. */
export function brownButterHrefKey(href: string): string | null {
  const raw = href.trim()
  if (!raw || raw === '#') return null
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw
  const path = (raw.startsWith('/') ? raw : `/${raw}`).split(/[?#]/)[0]
  const trimmed = path.replace(/\/+$/, '')
  return trimmed || '/'
}

export function isBrownButterTheme(themeKey?: string | null): boolean {
  return themeKey === BROWN_BUTTER_THEME_KEY
}

export function isBrownButterNavEnabled(
  config: Pick<StorefrontConfig, 'templateSettings'> | null | undefined,
  key: BrownButterNavKey,
): boolean {
  return config?.templateSettings?.[BROWN_BUTTER_THEME_KEY]?.[key] !== false
}

/**
 * Theme links first (hidden when the tenant turns them off).
 * A CMS header item with the same path can rename a theme link.
 * Other CMS links stay after the theme links.
 */
export function resolveBrownButterHeaderLinks(
  config: Pick<StorefrontConfig, 'templateSettings'> | null | undefined,
  cmsLinks?: StorefrontNavLink[] | null,
): StorefrontNavLink[] {
  const cmsByHref = new Map<string, string>()
  for (const link of cmsLinks ?? []) {
    const href = brownButterHrefKey(link.href)
    const label = link.label?.trim()
    if (!href || !label) continue
    cmsByHref.set(href, label)
  }

  const primary = BROWN_BUTTER_NAV_ITEMS.filter((item) => isBrownButterNavEnabled(config, item.key)).map(
    (item) => ({
      href: item.href,
      label: cmsByHref.get(item.href) || item.label,
    }),
  )

  const extras: StorefrontNavLink[] = []
  const seen = new Set<string>()
  for (const link of cmsLinks ?? []) {
    const href = brownButterHrefKey(link.href)
    const label = link.label?.trim()
    if (!href || !label || seen.has(href) || THEME_HREFS.has(href)) continue
    seen.add(href)
    extras.push({ href: link.href.trim(), label })
  }

  return [...primary, ...extras]
}
