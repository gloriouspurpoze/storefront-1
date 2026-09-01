import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { resolveTenant } from '@/lib/tenant-resolver'
import type { ResolvedTenant, VerticalKey } from '@/lib/types'

/**
 * Resolves the current request's tenant and enforces that it belongs to
 * `verticalKey` (404s otherwise). Shared body for every `themes/{vertical}/loadThemeTenant.ts`.
 */
export async function loadVerticalTenant(
  verticalKey: VerticalKey,
  fallbackTagline: string,
): Promise<ResolvedTenant & { fallbackTagline: string }> {
  const h = await headers()
  const id = h.get('x-tenant-id')
  const slug = h.get('x-tenant-slug')
  const headerVertical = h.get('x-tenant-vertical') as VerticalKey | null
  const nameRaw = h.get('x-tenant-name')

  const tenant: ResolvedTenant | null =
    id && slug && headerVertical && nameRaw
      ? {
          id,
          slug,
          name: decodeURIComponent(nameRaw),
          verticalKey: headerVertical,
          publicSiteTheme: null,
          matchedBy: 'platform_subdomain',
        }
      : await resolveTenant(h.get('host') ?? '')

  if (!tenant || tenant.verticalKey !== verticalKey) notFound()
  return { ...tenant, fallbackTagline }
}

export interface ThemeTenant {
  id: string
  slug: string
  name: string
  brand: string
  logoUrl: string | null
  tagline: string
}

/** Shared adapter from `ResolvedTenant` to the shape theme components consume. */
export function toThemeTenant(
  t: ResolvedTenant,
  fallbackTagline: string,
  brandColorFallback: string,
): ThemeTenant {
  const brand = (t.publicSiteTheme?.brandColor as string | undefined) ?? brandColorFallback
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
