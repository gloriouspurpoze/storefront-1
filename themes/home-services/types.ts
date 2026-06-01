/**
 * Shared types for the home-services theme. Kept here (not in `lib/`) so the
 * theme can be lifted into its own `packages/themes/home-services` workspace
 * later without rewriting imports.
 */
import type { ResolvedTenant } from '../../lib/types'
import type { PublicService } from '../../lib/storefront-api'

export interface ThemeTenant {
  id: string
  slug: string
  name: string
  brand: string
  logoUrl: string | null
  tagline: string
}

/** Adapter so the theme never reads raw resolver/tenant types directly. */
export function toThemeTenant(t: ResolvedTenant, fallbackTagline: string): ThemeTenant {
  const brand =
    (t.publicSiteTheme?.brandColor as string | undefined) ?? '#0f172a'
  const logoUrl = (t.publicSiteTheme?.logoUrl as string | undefined) ?? null
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    brand,
    logoUrl,
    tagline: fallbackTagline,
  }
}

export type { PublicService }
