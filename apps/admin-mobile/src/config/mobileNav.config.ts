import type { Permission } from '@profixer/types'

export type MobilePersona = 'admin' | 'provider' | 'professional'

export type MobileNavTier = 'tab' | 'ops' | 'drawer' | 'desktop-only'

export type MobileNavItem = {
  id: string
  label: string
  webPath: string
  mobileScreen: string
  permissions?: Permission[]
  tier: MobileNavTier
  personas: MobilePersona[]
  mvp?: boolean
}

/** Platform-agnostic nav config — mirrors web sidebar groups (docs/mobile/03). */
export const adminMobileNav: MobileNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    webPath: '/',
    mobileScreen: 'Dashboard',
    permissions: ['view_dashboard'],
    tier: 'tab',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'create-booking',
    label: 'New booking',
    webPath: '/operations/pos',
    mobileScreen: 'CreateBookingWizard',
    permissions: ['create_bookings', 'manage_bookings'],
    tier: 'ops',
    personas: ['admin'],
  },
  {
    id: 'service-requests',
    label: 'Service requests',
    webPath: '/requests',
    mobileScreen: 'ServiceRequestsList',
    permissions: ['view_services'],
    tier: 'ops',
    personas: ['admin'],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    webPath: '/bookings',
    mobileScreen: 'BookingsList',
    permissions: ['view_bookings', 'manage_bookings'],
    tier: 'ops',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'live-map',
    label: 'Live map',
    webPath: '/professionals/live-locations',
    mobileScreen: 'LiveMap',
    permissions: ['view_providers'],
    tier: 'ops',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'professionals',
    label: 'Professionals',
    webPath: '/professionals',
    mobileScreen: 'ProfessionalsList',
    permissions: ['view_providers'],
    tier: 'ops',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'provider-applications',
    label: 'Applications',
    webPath: '/provider-applications',
    mobileScreen: 'ProviderApplications',
    permissions: ['view_providers'],
    tier: 'ops',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'disputes',
    label: 'Disputes',
    webPath: '/operations/dispute-cases',
    mobileScreen: 'DisputeCases',
    permissions: ['view_bookings', 'manage_bookings', 'edit_bookings'],
    tier: 'ops',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'chat',
    label: 'Chat',
    webPath: '/chat',
    mobileScreen: 'ChatInbox',
    permissions: ['view_messages'],
    tier: 'tab',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    webPath: '/notifications',
    mobileScreen: 'Notifications',
    permissions: ['view_notifications', 'manage_notifications'],
    tier: 'tab',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'support-tickets',
    label: 'Support tickets',
    webPath: '/support/tickets',
    mobileScreen: 'SupportTickets',
    permissions: ['view_dashboard'],
    tier: 'tab',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'refunds',
    label: 'Refund requests',
    webPath: '/support/refund-requests',
    mobileScreen: 'RefundRequests',
    permissions: ['refund_payments'],
    tier: 'tab',
    personas: ['admin'],
    mvp: true,
  },
  {
    id: 'catalog',
    label: 'Catalog',
    webPath: '/platform-services',
    mobileScreen: 'CatalogHub',
    permissions: ['view_services'],
    tier: 'drawer',
    personas: ['admin'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    webPath: '/analytics',
    mobileScreen: 'Analytics',
    permissions: ['view_analytics'],
    tier: 'drawer',
    personas: ['admin'],
  },
  {
    id: 'crm',
    label: 'CRM',
    webPath: '/crm',
    mobileScreen: 'CrmHub',
    permissions: ['view_crm'],
    tier: 'drawer',
    personas: ['admin'],
  },
  {
    id: 'earnings',
    label: 'Earnings & payouts',
    webPath: '/payouts',
    mobileScreen: 'EarningsOverview',
    permissions: ['view_payments'],
    tier: 'drawer',
    personas: ['admin'],
  },
  {
    id: 'invoices',
    label: 'Invoices',
    webPath: '/invoices',
    mobileScreen: 'InvoicesList',
    permissions: ['view_payments'],
    tier: 'drawer',
    personas: ['admin'],
  },
  {
    id: 'payments',
    label: 'Payments',
    webPath: '/payments',
    mobileScreen: 'PaymentsList',
    permissions: ['view_payments'],
    tier: 'drawer',
    personas: ['admin'],
  },
  {
    id: 'users',
    label: 'Users',
    webPath: '/users/customers',
    mobileScreen: 'UsersList',
    permissions: ['view_users'],
    tier: 'drawer',
    personas: ['admin'],
  },
  {
    id: 'orders',
    label: 'Orders',
    webPath: '/orders',
    mobileScreen: 'OrdersList',
    permissions: ['view_orders'],
    tier: 'drawer',
    personas: ['admin'],
  },
  {
    id: 'settings',
    label: 'Settings',
    webPath: '/settings',
    mobileScreen: 'Settings',
    permissions: ['view_settings'],
    tier: 'drawer',
    personas: ['admin'],
    mvp: true,
  },
]

export function isNavItemVisible(
  item: MobileNavItem,
  checkRouteAccess: (path: string) => boolean,
): boolean {
  return checkRouteAccess(item.webPath.split('?')[0])
}

export function visibleNavItems(
  items: MobileNavItem[],
  checkRouteAccess: (path: string) => boolean,
  persona: MobilePersona,
): MobileNavItem[] {
  return items.filter(
    (item) => item.personas.includes(persona) && isNavItemVisible(item, checkRouteAccess),
  )
}

/** Tab is shown if any child route in that tab group is accessible. */
export function isAdminTabVisible(
  tab: 'home' | 'ops' | 'chat' | 'inbox' | 'more',
  checkRouteAccess: (path: string) => boolean,
): boolean {
  switch (tab) {
    case 'home':
      return checkRouteAccess('/')
    case 'ops':
      return adminMobileNav
        .filter((i) => i.tier === 'ops' && i.personas.includes('admin'))
        .some((i) => isNavItemVisible(i, checkRouteAccess))
    case 'chat':
      return checkRouteAccess('/chat')
    case 'inbox':
      return (
        checkRouteAccess('/notifications') ||
        checkRouteAccess('/support/tickets') ||
        checkRouteAccess('/support/refund-requests')
      )
    case 'more':
      return true
    default:
      return false
  }
}
