/**
 * Dev / QA theme override (pure — safe to import from middleware, RSC and tests).
 *
 * Lets a tester render any tenant with any storefront template without saving
 * the tenant's config:
 *
 *   http://<slug>.lvh.me:3001/?theme=saffron    → render with `saffron`, remember it (cookie)
 *   http://<slug>.lvh.me:3001/?theme=off        → clear the override
 *
 * Middleware validates the key, persists it in the `sf_theme` cookie and forwards
 * it to RSC as the `x-sf-theme-override` request header; `fetchStorefrontConfig`
 * then swaps `themeKey`. Disabled on Vercel production and on any production
 * build unless `STOREFRONT_THEME_OVERRIDE=on` (and never on VERCEL_ENV=production).
 */
export const THEME_OVERRIDE_PARAM = 'theme'
export const THEME_OVERRIDE_COOKIE = 'sf_theme'
export const THEME_OVERRIDE_HEADER = 'x-sf-theme-override'
export const THEME_OVERRIDE_MAX_AGE_SECONDS = 60 * 60 * 8

/** Every renderable theme key → the vertical whose data it expects. `classic` fits all. */
export const OVERRIDABLE_THEMES: Record<string, string | '*'> = {
  classic: '*',
  'trade-pro': 'home_services',
  saffron: 'restaurant',
  'menufast-minimal': 'restaurant',
  'menufast-cards': 'restaurant',
  'private-thebrownbutter': 'restaurant',
  'luxe-essence': 'retail',
  'soft-studio': 'retail',
  'marketplace-classic': 'marketplace',
}

type EnvLike = Record<string, string | undefined>

export function isThemeOverrideEnabled(env: EnvLike = process.env): boolean {
  if (env.VERCEL_ENV === 'production') return false
  if (env.STOREFRONT_THEME_OVERRIDE === 'off') return false
  return (
    env.NODE_ENV !== 'production' ||
    env.VERCEL_ENV === 'preview' ||
    env.STOREFRONT_THEME_OVERRIDE === 'on'
  )
}

/** Normalised theme key if it is a known template, else null. */
export function parseThemeKey(value: string | null | undefined): string | null {
  const key = (value ?? '').trim().toLowerCase()
  return Object.prototype.hasOwnProperty.call(OVERRIDABLE_THEMES, key) ? key : null
}

/** Whether `themeKey` can render a tenant of `verticalKey` (themes need their vertical's data). */
export function themeFitsVertical(themeKey: string, verticalKey: string | null | undefined): boolean {
  const v = OVERRIDABLE_THEMES[themeKey]
  return v === '*' || (!!v && v === verticalKey)
}

export function themesForVertical(verticalKey: string | null | undefined): string[] {
  return Object.keys(OVERRIDABLE_THEMES).filter((k) => themeFitsVertical(k, verticalKey))
}

export type ThemeOverrideDecision =
  | { action: 'none' }
  | { action: 'clear' }
  | { action: 'set'; themeKey: string; persist: boolean }

/**
 * Decide what the middleware should do for this request.
 * `param` wins over `cookie`; an invalid or wrong-vertical value is ignored (and a
 * stale cookie for another vertical is cleared, so switching tenants doesn't break).
 */
export function decideThemeOverride(input: {
  param: string | null
  cookie: string | null | undefined
  verticalKey: string | null | undefined
}): ThemeOverrideDecision {
  const { param, cookie, verticalKey } = input
  if (param !== null) {
    const p = param.trim().toLowerCase()
    if (p === '' || p === 'off' || p === 'clear' || p === 'none') return { action: 'clear' }
    const key = parseThemeKey(p)
    if (key && themeFitsVertical(key, verticalKey)) return { action: 'set', themeKey: key, persist: true }
    // Unknown / wrong-vertical param: ignore it and keep any saved override.
  }
  if (cookie) {
    const key = parseThemeKey(cookie)
    if (key && themeFitsVertical(key, verticalKey)) return { action: 'set', themeKey: key, persist: false }
    return { action: 'clear' }
  }
  return { action: 'none' }
}

/**
 * Apply an override to a loaded config. Drops `effectiveSections` (resolved by the API
 * for the tenant's *saved* theme) so the overriding theme falls back to its own
 * designed block order.
 */
export function applyThemeOverride<T extends { themeKey?: string; effectiveSections?: unknown }>(
  cfg: T,
  themeKey: string | null,
): T & { themeOverride?: string } {
  if (!themeKey || cfg.themeKey === themeKey) return cfg
  return { ...cfg, themeKey, effectiveSections: undefined, themeOverride: themeKey }
}
