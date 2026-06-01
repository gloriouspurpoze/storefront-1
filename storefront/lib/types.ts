/**
 * Shared types between the resolver, the API client, and the App Router pages.
 * Mirrors `fixer-backend/src/modules/platform-tenants/...resolvePublicTenantForHost`.
 */

export type VerticalKey =
  | 'home_services'
  | 'restaurant'
  | 'salon'
  | 'retail'
  | 'fitness'
  | 'real_estate'
  | 'b2b_services'
  | 'healthcare'
  | 'education'

export interface PublicSiteTheme {
  brandColor?: string
  accentColor?: string
  logoUrl?: string
  fontFamily?: string
  /** Free-form bag — admin's `Site appearance` panel writes here. */
  [key: string]: unknown
}

export interface ResolvedTenant {
  id: string
  slug: string
  name: string
  verticalKey: VerticalKey
  publicSiteTheme: PublicSiteTheme | null
  matchedBy: 'custom_domain' | 'platform_subdomain'
}
