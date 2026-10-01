import type { StorefrontConfig } from '@/lib/storefront-api'

/** Paid storefront add-on flag keys (mirror backend `storefrontFeatureAddons.ts`). */
export const STOREFRONT_ADDON_FLAGS = {
  reservations: 'showReservations',
  booking: 'showBooking',
  wishlist: 'showWishlist',
  liveChat: 'showLiveChat',
  whatsApp: 'showWhatsAppButton',
  amc: 'showAmcOffers',
  b2b: 'showB2bPortal',
  loyalty: 'showLoyaltyProgram',
} as const

export type StorefrontAddonFlag = (typeof STOREFRONT_ADDON_FLAGS)[keyof typeof STOREFRONT_ADDON_FLAGS]

/**
 * Strict add-on check: on only when purchased / granted, or explicitly switched on
 * by a super-admin. Unlike `flagOn` for core sections, unset means OFF.
 */
export function isAddonActive(cfg: StorefrontConfig | null | undefined, flagKey: StorefrontAddonFlag): boolean {
  if (!cfg) return false
  if (cfg.featureAddons?.[flagKey]?.purchased) return true
  const flags = cfg.featureFlags as Record<string, boolean | undefined> | undefined
  return flags?.[flagKey] === true
}
