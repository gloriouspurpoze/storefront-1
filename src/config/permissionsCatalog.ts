import { getRolePermissions } from './rbac.config'
import type { Permission } from '../types/rbac.types'
import { formatPermissionLabel } from '../lib/formatPermission'

/** Every permission the super_admin role can grant (single source of truth with RBAC config). */
export const ALL_DASHBOARD_PERMISSIONS: Permission[] = getRolePermissions('super_admin') as Permission[]

function categoryFor(p: Permission): string {
  if (p === 'view_dashboard' || p === 'view_analytics') return 'Overview & analytics'
  if (p.includes('product') || p.includes('inventory') || p === 'publish_products') return 'Products & store'
  if (p.includes('service') && !p.includes('request')) return 'Services'
  if (p.includes('order')) return 'Orders'
  if (p.includes('user') || p.includes('ban_users') || p === 'manage_user_roles') return 'Users & roles'
  if (p.includes('provider') || p.includes('professional')) return 'Providers'
  if (p.includes('booking')) return 'Bookings'
  if (p.includes('quote')) return 'Quotes'
  if (p.includes('categor')) return 'Categories'
  if (p.includes('cms') || p.includes('storefront')) return 'Storefront & CMS'
  if (p.includes('setting') || p.includes('system_settings')) return 'Settings'
  if (p.includes('report')) return 'Reports'
  if (p.includes('payment') || p.includes('refund')) return 'Payments'
  if (p.includes('message') || p.includes('notif')) return 'Messages & notifications'
  if (p.includes('coupon')) return 'Coupons'
  if (p.includes('referral')) return 'Referrals'
  if (p.includes('crm')) return 'CRM'
  return 'Other'
}

const order = (a: string, b: string) => a.localeCompare(b)

/** Permissions grouped for the admin chip picker UI. */
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = (() => {
  const byCat = new Map<string, Permission[]>()
  for (const p of ALL_DASHBOARD_PERMISSIONS) {
    const cat = categoryFor(p)
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat)!.push(p)
  }
  return Array.from(byCat.entries())
    .sort(([a], [b]) => order(a, b))
    .map(([label, permissions]) => ({
      label,
      permissions: [...permissions].sort((x, y) => x.localeCompare(y)),
    }))
})()

export { formatPermissionLabel }
