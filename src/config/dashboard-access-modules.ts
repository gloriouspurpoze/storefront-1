import type { Permission } from '../types/rbac.types'

export type DashboardAccessModule = {
  id: string
  label: string
  description: string
  /** Turning the module on grants at least these (entry / read). */
  viewPermissions: Permission[]
  /** Optional elevated actions for this area. */
  extras?: { key: string; label: string; permissions: Permission[] }[]
}

export const DASHBOARD_ACCESS_MODULES: DashboardAccessModule[] = [
  {
    id: 'overview',
    label: 'Dashboard',
    description: 'Home overview',
    viewPermissions: ['view_dashboard'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Business metrics',
    viewPermissions: ['view_analytics'],
  },
  {
    id: 'crm',
    label: 'CRM',
    description: 'Leads, deals, contacts',
    viewPermissions: ['view_crm'],
    extras: [{ key: 'crm_manage', label: 'Manage CRM', permissions: ['manage_crm'] }],
  },
  {
    id: 'catalog',
    label: 'Catalog & marketplace',
    description: 'Categories, services, marketplace',
    viewPermissions: ['view_categories', 'view_services'],
    extras: [
      { key: 'cat_edit', label: 'Edit categories', permissions: ['edit_categories', 'create_categories'] },
      { key: 'svc_manage', label: 'Manage services', permissions: ['edit_services', 'approve_services'] },
    ],
  },
  {
    id: 'commerce',
    label: 'Products & orders',
    description: 'Store, inventory, orders',
    viewPermissions: ['view_products', 'view_orders'],
    extras: [
      { key: 'prod_edit', label: 'Manage products', permissions: ['edit_products', 'create_products'] },
      { key: 'ord_process', label: 'Process orders', permissions: ['process_orders', 'edit_orders'] },
    ],
  },
  {
    id: 'operations',
    label: 'Bookings & quotes',
    description: 'Scheduling and quotes',
    viewPermissions: ['view_bookings', 'view_quotes'],
    extras: [
      { key: 'book_manage', label: 'Manage bookings', permissions: ['manage_bookings', 'edit_bookings'] },
      { key: 'quote_approve', label: 'Approve quotes', permissions: ['approve_quotes', 'edit_quotes'] },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & payouts',
    description: 'Payments, invoices, payouts',
    viewPermissions: ['view_payments'],
    extras: [
      { key: 'pay_refund', label: 'Refunds & adjustments', permissions: ['refund_payments', 'create_payments'] },
    ],
  },
  {
    id: 'people',
    label: 'Users & providers',
    description: 'Team, providers, professionals',
    viewPermissions: ['view_users', 'view_providers'],
    extras: [
      { key: 'users_admin', label: 'Manage users', permissions: ['edit_users', 'create_users', 'manage_user_roles'] },
      { key: 'prov_admin', label: 'Manage providers', permissions: ['edit_providers', 'approve_providers'] },
    ],
  },
  {
    id: 'comms',
    label: 'Messages & notifications',
    description: 'Inbox and alerts',
    viewPermissions: ['view_messages', 'view_notifications'],
    extras: [
      { key: 'msg_send', label: 'Send messages', permissions: ['send_messages'] },
      { key: 'notif_manage', label: 'Manage notifications', permissions: ['manage_notifications'] },
    ],
  },
  {
    id: 'growth',
    label: 'Coupons & referrals',
    description: 'Promotions',
    viewPermissions: ['view_coupons', 'view_referrals'],
    extras: [
      { key: 'coupon_manage', label: 'Manage coupons', permissions: ['manage_coupons', 'edit_coupons'] },
      { key: 'ref_manage', label: 'Manage referrals', permissions: ['manage_referrals', 'edit_referrals'] },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Exports and reporting',
    viewPermissions: ['view_reports'],
    extras: [{ key: 'rep_export', label: 'Export reports', permissions: ['export_reports', 'generate_reports'] }],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'System configuration',
    viewPermissions: ['view_settings'],
    extras: [{ key: 'sys', label: 'System settings', permissions: ['manage_system_settings', 'edit_settings'] }],
  },
]
