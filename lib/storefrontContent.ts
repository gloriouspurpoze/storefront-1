import type { StorefrontAnnouncement, StorefrontBanner, StorefrontSlider } from './storefront-api'

type SliderActiveFields = StorefrontSlider & { isActive?: boolean }
type BannerActiveFields = StorefrontBanner & { isActive?: boolean; is_active?: boolean }

/**
 * Drop CMS rows that belong to another org (or lack a tenant marker).
 * Public APIs should already scope by `x-tenant-id`; this is belt-and-suspenders
 * so seeded banners never bleed across storefronts.
 */
export function filterOwnedByTenant<T extends { tenantId?: string }>(
  rows: T[],
  tenantId: string,
): T[] {
  const id = tenantId.trim()
  if (!id) return []
  return rows.filter((row) => (row.tenantId ?? '').trim() === id)
}

/** Public slider payloads may use snake_case, camelCase, or omit the flag when pre-filtered. */
export function isSliderActive(slide: StorefrontSlider): boolean {
  const raw = slide as SliderActiveFields
  const active = raw.is_active ?? raw.isActive
  return active !== false
}

/** CMS banners may expose `isActive` or `is_active`; missing means active on public feeds. */
export function isBannerActive(banner: StorefrontBanner): boolean {
  const raw = banner as BannerActiveFields
  const active = raw.isActive ?? raw.is_active
  return active !== false
}

/** Dedupe slider lists while preserving first-seen order (for merged placement queries). */
export function mergeSlidersById(...groups: StorefrontSlider[][]): StorefrontSlider[] {
  const seen = new Set<string>()
  const merged: StorefrontSlider[] = []
  for (const group of groups) {
    for (const slide of group) {
      if (seen.has(slide.id)) continue
      seen.add(slide.id)
      merged.push(slide)
    }
  }
  return merged
}

/** True when `now` is inside an optional start/end window (inclusive boundaries). */
export function isWithinSchedule(
  start?: string | null,
  end?: string | null,
  now: Date = new Date(),
): boolean {
  if (start) {
    const startAt = new Date(start)
    if (!Number.isNaN(startAt.getTime()) && now < startAt) return false
  }
  if (end) {
    const endAt = new Date(end)
    if (!Number.isNaN(endAt.getTime()) && now > endAt) return false
  }
  return true
}

export function filterActiveSliders(
  sliders: StorefrontSlider[],
  now: Date = new Date(),
): StorefrontSlider[] {
  return sliders
    .filter((slide) => isSliderActive(slide) && isWithinSchedule(slide.start_date, slide.end_date, now))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

export function filterActiveBanners(
  banners: StorefrontBanner[],
  now: Date = new Date(),
): StorefrontBanner[] {
  return banners
    .filter((banner) => {
      if (!isBannerActive(banner)) return false
      const schedule = banner.schedule
      if (!schedule?.startDate && !schedule?.endDate) return true
      return isWithinSchedule(schedule.startDate, schedule.endDate, now)
    })
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
}

export type ResolvedAnnouncement = {
  title: string
  description?: string
  ctaText?: string
  ctaUrl?: string
}

export function resolveAnnouncement(
  data: StorefrontAnnouncement | null | undefined,
  marqueeEnabled: boolean,
  now: Date = new Date(),
): ResolvedAnnouncement | null {
  if (!marqueeEnabled || !data?.enabled) return null
  const banner = data.banner
  if (!banner) return null
  const title = banner.title?.trim()
  if (!title) return null
  if (!isWithinSchedule(banner.schedule?.startDate, banner.schedule?.endDate, now)) return null
  return {
    title,
    description: banner.description?.trim() || undefined,
    ctaText: banner.ctaText?.trim() || undefined,
    ctaUrl: banner.ctaUrl?.trim() || undefined,
  }
}

export function pickPopupBanner(banners: StorefrontBanner[], now: Date = new Date()): StorefrontBanner | null {
  const active = filterActiveBanners(banners, now)
  return active[0] ?? null
}

/**
 * Home creative buckets for tenant themes.
 * `home_page_hero` is a dedicated hero slot — never merge into the offers strip.
 * Offers strip = `offers` ∪ active `seasonal` only.
 */
export function resolveHomeSliderBuckets(
  input: {
    offers: StorefrontSlider[]
    seasonal: StorefrontSlider[]
    homePageHero: StorefrontSlider[]
  },
  now: Date = new Date(),
): { hero: StorefrontSlider[]; offers: StorefrontSlider[] } {
  return {
    hero: filterActiveSliders(input.homePageHero, now),
    offers: filterActiveSliders(mergeSlidersById(input.offers, input.seasonal), now),
  }
}

export function getSlideImageUrl(slide: StorefrontSlider, mobile = false): string {
  if (mobile && slide.image_url_mobile?.trim()) return slide.image_url_mobile
  return slide.image_url
}

export function getBannerImageUrl(banner: StorefrontBanner, mobile = false): string {
  const images = banner.images
  if (mobile && images.mobile?.trim()) return images.mobile
  return images.desktop
}
