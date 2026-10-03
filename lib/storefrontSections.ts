import type { StorefrontConfig } from '@/lib/storefront-api'

/**
 * Homepage block order for a theme. The API resolves `effectiveSections` (theme layout + the
 * tenant's saved order / on-off + platform policy — see fixer-backend
 * storefront-studio/shared/sectionLayout.ts); themes only map a type to their own block.
 *
 * The lists below are each theme's designed order. They MUST match `THEME_SECTION_LAYOUTS` /
 * `CLASSIC_SECTION_LAYOUTS` in the admin's src/lib/storefrontSectionLayout.ts. They are the
 * fallback when the API predates `effectiveSections`, and the allowlist of renderable types.
 */
export const THEME_SECTIONS = {
  'trade-pro': ['hero', 'stats', 'services', 'howItWorks', 'whyChooseUs', 'trust', 'about', 'faq', 'cta'],
  saffron: ['hero', 'menu'],
  'menufast-minimal': ['menu'],
  'menufast-cards': ['hero', 'offers', 'promo', 'menu'],
  'luxe-essence': ['hero', 'offers', 'products', 'promo'],
  'soft-studio': ['hero', 'highlights', 'products'],
} as const satisfies Record<string, readonly string[]>

export const CLASSIC_SECTIONS = {
  home_services: ['hero', 'trust', 'services', 'about', 'faq', 'cta'],
  restaurant: ['hero', 'menu', 'trust', 'reservations', 'about', 'faq'],
  retail: ['hero', 'products', 'trust', 'about', 'faq', 'giftMatch'],
} as const satisfies Record<string, readonly string[]>

/** Designed order for the active theme (layout theme, else the vertical's classic layout). */
export function themeSectionDefaults(themeKey: string | undefined | null, verticalKey: string | undefined | null): readonly string[] {
  if (themeKey && Object.prototype.hasOwnProperty.call(THEME_SECTIONS, themeKey)) {
    return THEME_SECTIONS[themeKey as keyof typeof THEME_SECTIONS]
  }
  return verticalKey === 'restaurant' || verticalKey === 'retail' ? CLASSIC_SECTIONS[verticalKey] : CLASSIC_SECTIONS.home_services
}

export function homepageSectionOrder(cfg: StorefrontConfig | null | undefined, themeDefault: readonly string[]): string[] {
  const eff = cfg?.effectiveSections
  if (!Array.isArray(eff) || eff.length === 0) return [...themeDefault]
  return eff.filter((s) => s.enabled && themeDefault.includes(s.type)).map((s) => s.type)
}

/** True when the block will render — use to skip data fetches for hidden blocks. */
export function homepageSectionOn(
  cfg: StorefrontConfig | null | undefined,
  themeDefault: readonly string[],
  type: string,
): boolean {
  return homepageSectionOrder(cfg, themeDefault).includes(type)
}
