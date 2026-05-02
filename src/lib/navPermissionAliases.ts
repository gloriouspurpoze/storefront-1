import type { Permission } from '../types/rbac.types'

/**
 * Sidebar and legacy UI use shorthand strings; map them to canonical RBAC permissions.
 */
const ALIAS: Record<string, Permission[]> = {
  manage_categories: ['edit_categories', 'delete_categories'],
  manage_services: ['edit_services', 'approve_services'],
  manage_products: ['edit_products', 'delete_products'],
  manage_providers: ['edit_providers', 'approve_providers'],
  manage_orders: ['process_orders', 'edit_orders'],
  manage_bookings: ['manage_bookings', 'edit_bookings'],
  manage_payments: ['refund_payments', 'create_payments'],
  manage_users: ['manage_user_roles', 'edit_users'],
  manage_settings: ['manage_system_settings', 'edit_settings'],
  manage_marketing: ['manage_coupons', 'manage_referrals'],
  view_cms: ['view_settings'],
  manage_cms: ['manage_system_settings', 'edit_settings'],
  view_system_status: ['view_settings'],
}

/**
 * Expands nav requirement tokens (aliases or canonical permissions) into RBAC permissions.
 */
export function expandNavPermissionTokens(tokens: string[]): Permission[] {
  const out: Permission[] = []
  for (const t of tokens) {
    const mapped = ALIAS[t]
    if (mapped?.length) {
      out.push(...mapped)
      continue
    }
    out.push(t as Permission)
  }
  return Array.from(new Set(out))
}
