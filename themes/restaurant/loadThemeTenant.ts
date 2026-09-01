import { loadVerticalTenant } from '@/theme-kit/tenant'

export function loadRestaurantTenant(fallbackTagline = 'Where the menu meets the moment.') {
  return loadVerticalTenant('restaurant', fallbackTagline)
}
