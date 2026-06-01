import type { ResolvedTenant } from '@/lib/types'

export interface ThemeTenant {
  id: string
  slug: string
  name: string
  brand: string
  logoUrl: string | null
  tagline: string
}

export function toThemeTenant(t: ResolvedTenant, fallbackTagline: string): ThemeTenant {
  const brand = (t.publicSiteTheme?.brandColor as string | undefined) ?? '#7c2d12'
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
