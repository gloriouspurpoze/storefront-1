import { RolePermissions, UserRole, Permission, RoutePermission } from '../types/rbac.types'

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
      'edit_bookings',
      
      'view_quotes',
      
      'view_categories',
      
      'view_messages',
      'send_messages',
      
      // Notifications
      'view_notifications',
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
  
  // Categories
  {
    path: '/categories',
    requiredPermissions: ['view_categories'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  // Marketplace hub (card links enforce finer permissions)
  {
    path: '/marketplace',
    requiredPermissions: ['view_services'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  // E-commerce hub (products & orders)
  {
    path: '/ecommerce',
    requiredPermissions: ['view_products'],
    allowedRoles: ['super_admin', 'admin', 'manager', 'staff']
  },

  {
    path: '/inventory',
    requiredPermissions: ['view_products'],
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
  
  // Coupons
  {
    path: '/coupons',
    requiredPermissions: ['view_coupons'],
    allowedRoles: ['super_admin', 'admin']
  },
  
  // Referrals
  {
    path: '/referrals',
    requiredPermissions: ['view_referrals'],
    allowedRoles: ['super_admin', 'admin']
  }
]

// Helper functions
export const getRolePermissions = (role: UserRole): Permission[] => {
  return rolePermissionsMap[role]?.permissions || []
}

export const getRoleLevel = (role: UserRole): number => {
  return rolePermissionsMap[role]?.level || 0
}

export const canAccessRoute = (userRole: UserRole, routePath: string): boolean => {
  const route = routePermissions.find(r => r.path === routePath)
  if (!route) return true // If route not configured, allow access
  
  return route.allowedRoles?.includes(userRole) || false
}

export const hasPermission = (userRole: UserRole, permission: Permission, customPermissions?: Permission[]): boolean => {
  // Check custom permissions first
  if (customPermissions?.includes(permission)) {
    return true
  }
  
  // Check role permissions
  const rolePerms = getRolePermissions(userRole)
  return rolePerms.includes(permission)
}

export const hasAnyPermission = (userRole: UserRole, permissions: Permission[], customPermissions?: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission, customPermissions))
}

export const hasAllPermissions = (userRole: UserRole, permissions: Permission[], customPermissions?: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission, customPermissions))
}
