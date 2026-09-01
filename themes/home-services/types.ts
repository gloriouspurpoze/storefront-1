import type { ResolvedTenant } from '../../lib/types'
import type { PublicService } from '../../lib/storefront-api'
import { toThemeTenant as toThemeTenantBase } from '@/theme-kit/tenant'
import type { ThemeTenant } from '@/theme-kit/tenant'

export type { ThemeTenant }

/** Adapter so the theme never reads raw resolver/tenant types directly. */
export function toThemeTenant(t: ResolvedTenant, fallbackTagline: string): ThemeTenant {
  return toThemeTenantBase(t, fallbackTagline, '#0f172a')
}

export type { PublicService }
