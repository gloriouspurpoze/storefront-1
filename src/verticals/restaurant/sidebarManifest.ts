import type { SidebarNavGroupDef, VerticalPackDefinition } from '../core/types'
import { restaurantReservationEngagement } from './engagement'
import { restaurantDashboardLayout } from './dashboardWidgets'
import { restaurantBillingPlans } from './billingPlans'
import {
  restaurantCatalogKinds,
  restaurantCompliance,
  restaurantIntegrations,
  restaurantReports,
  restaurantTaxStrategy,
  restaurantWorkforceRoles,
} from './packExtras'

/** Restaurant vertical — MVP sidebar (full KDS/menu modules ship later). */
export const restaurantSidebarGroups: SidebarNavGroupDef[] = [
  {
    id: 'restaurant_ops',
    title: 'Front of house',
    icon: 'Calendar',
    order: 30,
    items: [
      {
        id: 'reservations',
        name: 'Reservations',
        href: '/bookings',
        icon: 'Calendar',
        permissions: ['view_bookings', 'manage_bookings'],
        badge: null,
      },
      {
        id: 'orders',
        name: 'Orders',
        href: '/orders',
        icon: 'ShoppingCart',
        permissions: ['view_orders'],
        module: 'ecommerce',
        badge: null,
      },
    ],
  },
  {
    id: 'restaurant_menu',
    title: 'Menu',
    icon: 'Package',
    order: 50,
    items: [
      {
        id: 'menu_categories',
        name: 'Menu categories',
        href: '/categories/products',
        icon: 'FolderTree',
        permissions: ['view_categories', 'create_categories'],
        module: 'ecommerce',
        badge: null,
      },
      {
        id: 'menu_items',
        name: 'Menu items',
        href: '/products',
        icon: 'Package',
        permissions: ['view_products'],
        module: 'ecommerce',
        badge: null,
      },
      {
        id: 'inventory',
        name: 'Inventory',
        href: '/inventory',
        icon: 'Package2',
        permissions: ['view_products', 'edit_products', 'manage_product_inventory'],
        module: 'ecommerce',
        badge: null,
      },
    ],
  },
]

export const restaurantPack: VerticalPackDefinition = {
  key: 'restaurant',
  label: 'Restaurant',
  description: 'Table service, menu, reservations, and order operations.',
  version: '0.1.0',
  defaultModules: ['crm', 'finance', 'ecommerce', 'marketing_workspace', 'cms'],
  sidebarGroups: restaurantSidebarGroups,
  engagementTypes: [restaurantReservationEngagement],
  dashboardLayout: restaurantDashboardLayout,
  billingPlans: restaurantBillingPlans,
  catalogKinds: restaurantCatalogKinds,
  workforceRoles: restaurantWorkforceRoles,
  taxStrategy: restaurantTaxStrategy,
  compliance: restaurantCompliance,
  integrations: restaurantIntegrations,
  reports: restaurantReports,
  marketingSlug: 'for-restaurants',
}
