import type { RolePermissions, UserRole, Permission, RoutePermission } from '../../types/src/rbac.types'
import {
  expandStorefrontRequirement,
  storefrontPermissionSatisfied,
} from './storefrontPermissionAliases'

// Define permissions for each role
export const rolePermissionsMap: Record<UserRole, RolePermissions> = {
  super_admin: {
    role: 'super_admin',
    level: 100,
    description: 'Full system access with all permissions',
    permissions: [
      // Dashboard
      'view_dashboard',
      'view_analytics',
      
      // Products
      'view_products',
      'create_products',
      'edit_products',
      'delete_products',
      'manage_product_inventory',
      'publish_products',
      
      // Services
      'view_services',
      'create_services',
      'edit_services',
      'delete_services',
      'approve_services',
      'manage_service_categories',
      
      // Orders
      'view_orders',
      'create_orders',
      'edit_orders',
      'delete_orders',
      'process_orders',
      'cancel_orders',
      'refund_orders',
      
      // Users
      'view_users',
      'create_users',
      'edit_users',
      'delete_users',
      'manage_user_roles',
      'ban_users',
      
      // Providers
      'view_providers',
      'create_providers',
      'edit_providers',
      'delete_providers',
      'approve_providers',
      'verify_providers',
      
      // Bookings
      'view_bookings',
      'create_bookings',
      'edit_bookings',
      'delete_bookings',
      'manage_bookings',
      
      // Quotes
      'view_quotes',
      'create_quotes',
      'edit_quotes',
      'delete_quotes',
      'approve_quotes',
      
      // Categories
      'view_categories',
      'create_categories',
      'edit_categories',
      'delete_categories',
      
      // Settings
      'view_settings',
      'edit_settings',
      'manage_system_settings',
      
      // Reports
      'view_reports',
      'export_reports',
      'generate_reports',
      
      // Messages
      'view_messages',
      'send_messages',
      'delete_messages',
      
      // Notifications
      'view_notifications',
      'manage_notifications',
      
      // Coupons
      'view_coupons',
      'create_coupons',
      'edit_coupons',
      'delete_coupons',
      'manage_coupons',
      
      // Referrals
      'view_referrals',
      'create_referrals',
      'edit_referrals',
      'delete_referrals',
      'manage_referrals',

      'view_crm',
      'manage_crm',

      'view_team_tasks',
      'manage_team_tasks',
      'manage_team_projects',

      'view_finance',
      'manage_finance',

      'view_amc',
      'manage_amc',

      'view_rate_cards',
      'manage_rate_cards',

      'view_company_documents',
      'manage_company_documents',

      'view_operating_terms',
      'manage_operating_terms',

      'view_provider_assets',
      'manage_provider_assets',

      'view_professional_conduct',
      'manage_professional_conduct',

      'view_subscriptions',
      'manage_subscriptions',

      // CMS / storefront
      'view_cms',
      'manage_cms',
      'view_storefront',
      'edit_storefront_branding',
      'edit_storefront_theme',
      'edit_storefront_sections',
      'edit_storefront_seo',
      'edit_storefront_content',
      'manage_storefront_domains',
      'manage_storefront_addons',

      // Boards (collaborative canvas)
      'view_boards',
      'manage_boards',
      'invite_board_members',
    ]
  },
  
  admin: {
    role: 'admin',
    level: 90,
    description: 'Administrative access with full CMS and content management permissions',
    permissions: [
      'view_dashboard',
      'view_analytics',
      
      'view_products',
      'create_products',
      'edit_products',
      'delete_products',
      'manage_product_inventory',
      'publish_products',
      
      'view_services',
      'create_services',
      'edit_services',
      'delete_services',
      'approve_services',
      'manage_service_categories',
      
      'view_orders',
      'create_orders',
      'edit_orders',
      'delete_orders',
      'process_orders',
      'cancel_orders',
      'refund_orders',
      
      'view_users',
      'create_users',
      'edit_users',
      'ban_users',
      
      'view_providers',
      'create_providers',
      'edit_providers',
      'approve_providers',
      'verify_providers',
      
      'view_bookings',
      'create_bookings',
      'edit_bookings',
      'manage_bookings',
      
      'view_quotes',
      'edit_quotes',
      'approve_quotes',
      
      'view_categories',
      'create_categories',
      'edit_categories',
      
      'view_settings',
      'edit_settings',
      'manage_system_settings',

      // CMS / storefront content (role description: "full CMS and content management")
      'view_cms',
      'manage_cms',
      'view_storefront',
      'edit_storefront_branding',
      'edit_storefront_theme',
      'edit_storefront_sections',
      'edit_storefront_seo',
      'edit_storefront_content',
      'manage_storefront_domains',
      'manage_storefront_addons',
      
      'view_reports',
      'export_reports',
      'generate_reports',
      
      // Payments
      'view_payments',
      'create_payments',
      'refund_payments',
      'export_payments',
      
      'view_messages',
      'send_messages',
      
      // Notifications
      'view_notifications',
      
      // Coupons
      'view_coupons',
      'create_coupons',
      'edit_coupons',
      'delete_coupons',
      'manage_coupons',
      
      // Referrals
      'view_referrals',
      'create_referrals',
      'edit_referrals',
      'delete_referrals',
      'manage_referrals',

      'view_crm',
      'manage_crm',

      'view_team_tasks',
      'manage_team_tasks',
      'manage_team_projects',

      'view_finance',
      'manage_finance',

      'view_amc',
      'manage_amc',

      'view_rate_cards',
      'manage_rate_cards',

      'view_company_documents',
      'manage_company_documents',

      'view_operating_terms',
      'manage_operating_terms',

      'view_provider_assets',
      'manage_provider_assets',

      'view_professional_conduct',
      'manage_professional_conduct',

      'view_subscriptions',
      'manage_subscriptions',

      // Boards (collaborative canvas)
      'view_boards',
      'manage_boards',
      'invite_board_members',
    ]
  },
  
  manager: {
    role: 'manager',
    level: 70,
    description: 'Manager with operational permissions',
    permissions: [
      'view_dashboard',
      'view_analytics',
      
      'view_products',
      'create_products',
      'edit_products',
      'manage_product_inventory',
      
      'view_services',
      'create_services',
      'edit_services',
      
      'view_orders',
      'edit_orders',
      'process_orders',
      'cancel_orders',
      
      'view_users',
      'edit_users',
      
      'view_providers',
      'edit_providers',
      
      'view_bookings',
      'create_bookings',
      'edit_bookings',
      'manage_bookings',
      
      'view_quotes',
      'edit_quotes',
      
      'view_categories',
      
      'view_reports',
      'export_reports',
      
      'view_messages',
      'send_messages',
      
      // Notifications
      'view_notifications',

      'view_crm',
      'manage_crm',

      'view_team_tasks',
      'manage_team_tasks',
      'manage_team_projects',

      'view_finance',
      'manage_finance',

      'view_amc',
      'manage_amc',

      'view_rate_cards',
      'manage_rate_cards',

      'view_company_documents',
      'manage_company_documents',

      'view_operating_terms',
      'manage_operating_terms',

      'view_provider_assets',
      'manage_provider_assets',

      'view_professional_conduct',
      'manage_professional_conduct',

      'view_subscriptions',
      'manage_subscriptions',

      'view_coupons',
      'edit_coupons',
      'manage_coupons',
      'view_referrals',
      'edit_referrals',
      'manage_referrals',

      // CMS / storefront content (managers run the public storefront)
      'view_cms',
      'manage_cms',
      'view_storefront',
      'edit_storefront_branding',
      'edit_storefront_theme',
      'edit_storefront_sections',
      'edit_storefront_seo',
      'edit_storefront_content',
      'manage_storefront_domains',
      'manage_storefront_addons',

      // Boards
      'view_boards',
      'invite_board_members',
    ]
  },

  staff: {
    role: 'staff',
    level: 50,
    description: 'Staff member with basic operational access',
    permissions: [
      'view_dashboard',
      
      'view_products',
      'edit_products',
      
      'view_services',
      
      'view_orders',
      'edit_orders',
      'process_orders',
      
      'view_users',
      
      'view_providers',
      
      'view_bookings',
      'create_bookings',
      'edit_bookings',
      
      'view_quotes',
      
      'view_categories',
      
      'view_messages',
      'send_messages',
      
      // Notifications
      'view_notifications',

      'view_crm',

      'view_team_tasks',
      'manage_team_tasks',

      'view_finance',

      'view_amc',

      'view_rate_cards',

      'view_company_documents',

      'view_operating_terms',

      'view_provider_assets',

      'view_professional_conduct',

      'view_subscriptions',

      'view_coupons',
      'edit_coupons',
      'view_referrals',
      'edit_referrals',

      // Storefront (view-only for staff)
      'view_cms',
      'view_storefront',

      // Boards
      'view_boards',
    ]
  },

  provider: {
    role: 'provider',
    level: 30,
    description: 'Service provider with limited access to their own data',
    permissions: [
      'view_dashboard',
      
      'view_services',
      'create_services',
      'edit_services',
      
      'view_bookings',
      'edit_bookings',
      
      'view_quotes',
      'create_quotes',
      'edit_quotes',
      
      'view_messages',
      'send_messages',
      
      // Notifications
      'view_notifications',
    ]
  },
  
  professional: {
    role: 'professional',
    level: 30,
    description: 'Professional/technician with access to their own bookings and profile',
    permissions: [
      'view_dashboard',
      
      'view_bookings',
      'edit_bookings',
      
      'view_orders',  // Can view their own service orders
      
      'view_messages',
      'send_messages',
      
      // Notifications
      'view_notifications',
    ]
  },
  
  customer: {
    role: 'customer',
    level: 10,
    description: 'Customer with view-only access',
    permissions: [
      'view_products',
      'view_services',
      'view_orders',
      'view_bookings',
      'view_messages',
      'send_messages',
      
      // Notifications
      'view_notifications',
    ]
  }
}

// Route-based permissions
export const routePermissions: RoutePermission[] = [
  // Dashboard
  {
    path: '/',
    requiredPermissions: ['view_dashboard'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'provider', 'professional']
  },
  {
    path: '/analytics',
    requiredPermissions: ['view_analytics'],
    allowedRoles: ['super_admin', 'admin', 'manager']
  },
  {
    path: '/analytics/funnels',
    requiredPermissions: ['view_analytics'],
    allowedRoles: ['super_admin', 'admin', 'manager']
  },

  /** Industry operations — longest paths must win in `matchRouteConfig` */
  {
    path: '/operations/command-center',
    requiredPermissions: ['view_bookings', 'manage_bookings'],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/operations/trust',
    requiredPermissions: ['view_bookings', 'manage_bookings'],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/operations/supply-quality',
    requiredPermissions: ['view_providers', 'edit_providers', 'approve_providers'],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/operations/payouts-playbook',
    requiredPermissions: ['view_payments', 'create_payments', 'refund_payments'],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/operations/dispute-cases',
    requiredPermissions: ['view_bookings', 'manage_bookings', 'edit_bookings'],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/operations/pos',
    requiredPermissions: ['create_bookings', 'manage_bookings'],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/operations/commercial',
    requiredPermissions: ['view_operating_terms'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/operations/provider-assets',
    requiredPermissions: ['view_provider_assets'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/operations/professional-conduct',
    requiredPermissions: ['view_professional_conduct'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/operations',
    requiredPermissions: [
      'view_bookings',
      'manage_bookings',
      'view_providers',
      'edit_providers',
      'approve_providers',
      'view_analytics',
      'view_payments',
      'create_payments',
      'refund_payments',
      'view_dashboard'
    ],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  
  // Products
  {
    path: '/products',
    requiredPermissions: ['view_products'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'customer']
  },
  {
    path: '/products/add',
    requiredPermissions: ['create_products'],
    allowedRoles: ['super_admin', 'admin', 'manager']
  },
  
  // Services
  {
    path: '/services',
    requiredPermissions: ['view_services'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'provider', 'customer']
  },
  
  // Orders
  {
    path: '/orders',
    requiredPermissions: ['view_orders'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'customer', 'professional']
  },
  
  // Users
  {
    path: '/users',
    requiredPermissions: ['view_users'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/users/customers',
    requiredPermissions: ['view_users'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/users/members',
    requiredPermissions: ['view_users'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  
  // Providers
  {
    path: '/providers',
    requiredPermissions: ['view_providers'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  
  // Bookings
  {
    path: '/bookings',
    requiredPermissions: ['view_bookings'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'provider', 'professional', 'customer']
  },
  
  // Quotes
  {
    path: '/quotes',
    requiredPermissions: ['view_quotes'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'provider']
  },
  
  // Categories (hub, scoped lists, and create/edit under /categories/...)
  {
    path: '/categories',
    requiredPermissions: ['view_categories'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/categories/products',
    requiredPermissions: ['view_categories'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/categories/services',
    requiredPermissions: ['view_categories'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  // Payments
  {
    path: '/payments',
    requiredPermissions: ['view_payments'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/invoices',
    requiredPermissions: ['view_payments'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  
  // Settings
  {
    path: '/settings/tenants',
    requiredPermissions: ['manage_system_settings'],
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    path: '/settings/access',
    requiredPermissions: ['view_settings', 'manage_system_settings', 'manage_user_roles'],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff'],
  },
  {
    // Tenant self-serve storefront customization. Gated on CMS/settings perms
    // (not just system settings) so org admins + managers can run their own
    // public site. Explicit rule prevents inheriting the generic `/settings`
    // guard, which required `view_settings` and locked managers out.
    path: '/settings/storefront',
    requiredPermissions: [
      'view_storefront',
      'manage_cms',
      'view_cms',
      'view_settings',
      'manage_system_settings',
    ],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff'],
  },
  {
    path: '/settings',
    requiredPermissions: ['view_settings'],
    allowedRoles: ['super_admin', 'admin', 'manager']
  },

  // Messages
  {
    path: '/messages',
    requiredPermissions: ['view_messages'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'provider', 'professional', 'customer']
  },
  
  // Coupons (align with sidebar manage_marketing — any coupon permission grants route access)
  {
    path: '/coupons',
    requiredPermissions: [
      'manage_coupons',
      'edit_coupons',
      'create_coupons',
      'view_coupons',
    ],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  
  // Referrals
  {
    path: '/referrals',
    requiredPermissions: [
      'manage_referrals',
      'edit_referrals',
      'create_referrals',
      'view_referrals',
    ],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  // CRM
  {
    path: '/crm',
    requiredPermissions: ['view_crm'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/crm/leads',
    requiredPermissions: ['view_crm'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/crm/contacts',
    requiredPermissions: ['view_crm'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/crm/companies',
    requiredPermissions: ['view_crm'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/crm/deals',
    requiredPermissions: ['view_crm'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/crm/activities',
    requiredPermissions: ['view_crm'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/crm/settings',
    requiredPermissions: ['view_crm'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/team-work',
    requiredPermissions: ['view_team_tasks'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  // Boards (collaborative canvas)
  {
    path: '/boards',
    requiredPermissions: ['view_boards'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff'],
  },

  {
    path: '/finance',
    requiredPermissions: ['view_finance'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/amc',
    requiredPermissions: ['view_amc'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/subscriptions',
    requiredPermissions: ['view_subscriptions'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/company-documents',
    requiredPermissions: ['view_company_documents'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/rate-cards',
    requiredPermissions: ['view_rate_cards'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  // Service requests (operations — aligns with ServiceRequest APIs)
  {
    path: '/requests',
    requiredPermissions: ['view_services'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'provider', 'professional']
  },

  {
    path: '/platform-services',
    requiredPermissions: ['view_services'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  // Product nested paths (longer prefix wins over /products)
  {
    path: '/products/edit',
    requiredPermissions: ['edit_products'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/products/view',
    requiredPermissions: ['view_products'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'customer']
  },

  // Platform services
  {
    path: '/platform-services/create',
    requiredPermissions: ['create_services'],
    allowedRoles: ['super_admin', 'admin', 'manager']
  },
  {
    path: '/platform-services/edit',
    requiredPermissions: ['edit_services'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  // Ops hubs (OR semantics — matches RoleBasedRoute defaults)
  {
    path: '/marketplace',
    requiredPermissions: [
      'view_services',
      'view_categories',
      'view_bookings',
      'view_providers',
      'view_payments',
      'manage_coupons',
      'manage_system_settings'
    ],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/ecommerce',
    requiredPermissions: [
      'view_products',
      'create_products',
      'view_categories',
      'view_orders',
      'manage_coupons',
      'manage_system_settings',
      'view_settings'
    ],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/bazaar',
    requiredPermissions: [
      'view_products',
      'create_products',
      'view_categories',
      'view_orders',
      'manage_coupons',
      'manage_system_settings',
      'view_settings'
    ],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/inventory',
    requiredPermissions: ['view_products', 'edit_products', 'manage_product_inventory'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/payouts',
    requiredPermissions: ['view_payments'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/invoices/create',
    requiredPermissions: ['view_payments'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/professionals',
    requiredPermissions: ['view_providers'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/professionals/create',
    requiredPermissions: ['create_providers'],
    allowedRoles: ['super_admin', 'admin', 'manager']
  },
  {
    path: '/professionals/edit',
    requiredPermissions: ['edit_providers'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },
  {
    path: '/provider-applications',
    requiredPermissions: ['view_providers'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/providers/create',
    requiredPermissions: ['create_providers'],
    allowedRoles: ['super_admin', 'admin', 'manager']
  },
  {
    path: '/providers/edit',
    requiredPermissions: ['edit_providers'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/sliders',
    requiredPermissions: ['view_settings', 'manage_system_settings'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/reports',
    requiredPermissions: ['view_reports'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/system-status',
    requiredPermissions: ['manage_system_settings'],
    allowedRoles: ['super_admin', 'admin']
  },

  {
    path: '/cms',
    requiredPermissions: ['manage_system_settings'],
    allowedRoles: ['super_admin', 'admin', 'manager']
  },
  {
    path: '/cms/email-templates',
    requiredPermissions: ['view_cms', 'manage_cms', 'edit_settings', 'manage_system_settings'],
    requireAll: false,
    allowedRoles: ['super_admin', 'admin', 'manager']
  },

  /** Marketing planning hub (local workspace until API exists) */
  {
    path: '/marketing',
    requiredPermissions: [
      'manage_system_settings',
      'manage_coupons',
      'manage_referrals',
      'edit_coupons',
      'edit_referrals',
      'create_coupons',
      'create_referrals',
    ],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff'],
  },

  {
    path: '/notifications',
    requiredPermissions: ['view_notifications'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/support',
    requiredPermissions: ['view_dashboard'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'provider', 'professional']
  },

  {
    path: '/support/refund-requests',
    requiredPermissions: ['refund_payments'],
    allowedRoles: ['super_admin', 'admin']
  },

  {
    path: '/chat',
    requiredPermissions: ['view_messages'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff', 'provider', 'professional', 'customer']
  },

  /** Provider portal — role-only gate (matches ProtectedRoute usage). */
  {
    path: '/provider',
    requiredPermissions: [],
    allowedRoles: ['provider']
  },

  /** Professional portal — role-only gate. */
  {
    path: '/professional',
    requiredPermissions: [],
    allowedRoles: ['professional']
  }
]

// Helper functions
export const getRolePermissions = (role: UserRole): Permission[] => {
  return rolePermissionsMap[role]?.permissions || []
}

export const getRoleLevel = (role: UserRole): number => {
  return rolePermissionsMap[role]?.level || 0
}

export type PermissionCheckOptions = {
  /** If true, only `customPermissions` grant access (for scoped dashboard users). */
  explicitOnly?: boolean
}

const matchRouteConfig = (routePath: string): RoutePermission | undefined => {
  const matches = routePermissions.filter(
    (r) => routePath === r.path || routePath.startsWith(`${r.path}/`),
  )
  if (matches.length === 0) return undefined
  return matches.sort((a, b) => b.path.length - a.path.length)[0]
}

export const canAccessRoute = (
  userRole: UserRole,
  routePath: string,
  customPermissions?: Permission[],
  opts?: PermissionCheckOptions,
): boolean => {
  const route = matchRouteConfig(routePath)
  if (!route) return true

  const roleAllowed = !route.allowedRoles?.length || route.allowedRoles.includes(userRole)
  if (!roleAllowed) return false

  if (!route.requiredPermissions?.length) {
    return true
  }

  const needAll = route.requireAll === true
  if (needAll) {
    return hasAllPermissions(userRole, route.requiredPermissions, customPermissions, opts)
  }
  return hasAnyPermission(userRole, route.requiredPermissions, customPermissions, opts)
}

export const hasPermission = (
  userRole: UserRole,
  permission: Permission,
  customPermissions?: Permission[],
  opts?: PermissionCheckOptions,
): boolean => {
  if (userRole === 'super_admin') {
    return true
  }

  const held = opts?.explicitOnly
    ? (customPermissions ?? [])
    : Array.from(new Set([...getRolePermissions(userRole), ...(customPermissions ?? [])]))

  const requiredKeys = expandStorefrontRequirement(permission)
  return requiredKeys.some((req) =>
    held.some((h) => h === req || storefrontPermissionSatisfied(h, req)),
  )
}

export const hasAnyPermission = (
  userRole: UserRole,
  permissions: Permission[],
  customPermissions?: Permission[],
  opts?: PermissionCheckOptions,
): boolean => {
  return permissions.some((permission) => hasPermission(userRole, permission, customPermissions, opts))
}

export const hasAllPermissions = (
  userRole: UserRole,
  permissions: Permission[],
  customPermissions?: Permission[],
  opts?: PermissionCheckOptions,
): boolean => {
  return permissions.every((permission) => hasPermission(userRole, permission, customPermissions, opts))
}
