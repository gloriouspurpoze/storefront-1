import { loadVerticalTenant } from '@/theme-kit/tenant'

export function loadHomeServicesTenant(fallbackTagline = 'Trusted local pros, on demand.') {
  return loadVerticalTenant('home_services', fallbackTagline)
}
