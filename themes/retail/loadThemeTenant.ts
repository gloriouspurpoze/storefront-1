import { loadVerticalTenant } from '@/theme-kit/tenant'

export function loadRetailTenant(fallbackTagline = 'Curated, online, and on the way.') {
  return loadVerticalTenant('retail', fallbackTagline)
}
