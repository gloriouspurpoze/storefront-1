import { fetchStorefrontConfig, type StorefrontConfig } from '@/lib/storefront-api'
import { STOREFRONT_ADDON_FLAGS, isAddonActive } from '@/lib/storefrontAddons'

/**
 * Service booking add-on (`showBooking`) helpers for home-services server components.
 * When the add-on is inactive every "Book" CTA falls back to the always-available
 * contact / enquiry flow instead of pointing at a gated page.
 */
export function bookingAddonActive(config: StorefrontConfig | null | undefined): boolean {
  return isAddonActive(config, STOREFRONT_ADDON_FLAGS.booking)
}

/**
 * Resolve the flag for components that may be rendered without config (e.g. from the shared
 * home-page section renderer). `fetchStorefrontConfig` is a cached GET, so this dedupes with
 * the page's own config fetch.
 */
export async function resolveBookingAddon(
  tenantId: string | undefined,
  explicit?: boolean,
): Promise<boolean> {
  if (typeof explicit === 'boolean') return explicit
  if (!tenantId) return false
  return bookingAddonActive(await fetchStorefrontConfig(tenantId))
}

export const BOOK_PATH = '/book'
export const ENQUIRY_PATH = '/contact'

export function bookingCta(enabled: boolean, bookLabel: string, enquiryLabel = 'Get in touch') {
  return enabled ? { href: BOOK_PATH, label: bookLabel } : { href: ENQUIRY_PATH, label: enquiryLabel }
}

function isBookHref(href: string): boolean {
  return href === BOOK_PATH || href.startsWith(`${BOOK_PATH}?`) || href.startsWith(`${BOOK_PATH}/`)
}

/** Drop `/book` nav links when the add-on is off (CMS menus may still contain one). */
export function withoutBookingLinks<T extends { href: string }>(links: T[], enabled: boolean): T[] {
  return enabled ? links : links.filter((l) => !isBookHref(l.href))
}
