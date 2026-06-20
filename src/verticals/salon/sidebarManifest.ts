import type { SidebarNavGroupDef, VerticalPackDefinition } from '../core/types'
import { salonAppointmentEngagement } from './engagement'
import { salonDashboardLayout } from './dashboardWidgets'
import { salonBillingPlans } from './billingPlans'
import {
  salonCatalogKinds,
  salonCompliance,
  salonIntegrations,
  salonReports,
  salonTaxStrategy,
  salonWorkforceRoles,
} from './packExtras'

/** Salon & spa — appointments, stylists, treatments (MVP; shares bookings API until salon module ships). */
export const salonSidebarGroups: SidebarNavGroupDef[] = [
  {
    id: 'salon_ops',
    title: 'Appointments',
    icon: 'Calendar',
    order: 30,
    items: [
      {
        id: 'appointments',
        name: 'Appointments',
        href: '/bookings',
        icon: 'Calendar',
        permissions: ['view_bookings', 'manage_bookings'],
        badge: null,
      },
      {
        id: 'salon_pos',
        name: 'POS — Salon',
        href: '/operations/pos',
        icon: 'ScanLine',
        permissions: ['create_bookings', 'manage_bookings'],
        badge: null,
      },
    ],
  },
  {
    id: 'salon_team',
    title: 'Team & catalog',
    icon: 'Scissors',
    order: 50,
    items: [
      {
        id: 'stylists',
        name: 'Stylists',
        href: '/professionals',
        icon: 'User',
        permissions: ['view_providers', 'edit_providers', 'approve_providers'],
        badge: null,
      },
      {
        id: 'treatments',
        name: 'Treatments & services',
        href: '/platform-services',
        icon: 'Sparkles',
        permissions: ['view_services', 'manage_services'],
        badge: null,
      },
      {
        id: 'retail_categories',
        name: 'Product categories',
        href: '/categories/products',
        icon: 'FolderTree',
        permissions: ['view_categories', 'create_categories'],
        module: 'ecommerce',
        badge: null,
      },
      {
        id: 'retail',
        name: 'Retail products',
        href: '/products',
        icon: 'Package',
        permissions: ['view_products'],
        module: 'ecommerce',
        badge: null,
      },
    ],
  },
]

export const salonPack: VerticalPackDefinition = {
  key: 'salon',
  label: 'Salon & spa',
  description: 'Appointments, stylists, treatments, and light retail for salon and spa businesses.',
  version: '0.1.0',
  defaultModules: ['crm', 'finance', 'marketing_workspace', 'cms', 'ecommerce'],
  sidebarGroups: salonSidebarGroups,
  engagementTypes: [salonAppointmentEngagement],
  dashboardLayout: salonDashboardLayout,
  billingPlans: salonBillingPlans,
  catalogKinds: salonCatalogKinds,
  workforceRoles: salonWorkforceRoles,
  taxStrategy: salonTaxStrategy,
  compliance: salonCompliance,
  integrations: salonIntegrations,
  reports: salonReports,
  marketingSlug: 'for-salons',
}
