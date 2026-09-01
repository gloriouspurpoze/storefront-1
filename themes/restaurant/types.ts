import type { ResolvedTenant } from '@/lib/types'
import { toThemeTenant as toThemeTenantBase } from '@/theme-kit/tenant'
import type { ThemeTenant } from '@/theme-kit/tenant'

export type { ThemeTenant }

export function toThemeTenant(t: ResolvedTenant, fallbackTagline: string): ThemeTenant {
  return toThemeTenantBase(t, fallbackTagline, '#7c2d12')
}
