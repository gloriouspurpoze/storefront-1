// Role-Based Access Control Types

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'provider' | 'professional' | 'customer'

export type Permission = 
  // Dashboard permissions
  | 'view_dashboard'
  | 'view_analytics'
  
  // Product permissions
  | 'view_products'
  | 'create_products'
  | 'edit_products'
  | 'delete_products'
  | 'manage_product_inventory'
  | 'publish_products'
  
  // Service permissions
  | 'view_services'
  | 'create_services'
  | 'edit_services'
  | 'delete_services'
  | 'approve_services'
  | 'manage_service_categories'
  
  // Order permissions
  | 'view_orders'
  | 'create_orders'
  | 'edit_orders'
  | 'delete_orders'
  | 'process_orders'
  | 'cancel_orders'
  | 'refund_orders'
  
  // User permissions
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'manage_user_roles'
  | 'ban_users'
  
  // Provider permissions
  | 'view_providers'
  | 'create_providers'
  | 'edit_providers'
  | 'delete_providers'
  | 'approve_providers'
  | 'verify_providers'
  
  // Booking permissions
  | 'view_bookings'
  | 'create_bookings'
  | 'edit_bookings'
  | 'delete_bookings'
  | 'manage_bookings'
  
  // Quote permissions
  | 'view_quotes'
  | 'create_quotes'
  | 'edit_quotes'
  | 'delete_quotes'
  | 'approve_quotes'
  
  // Category permissions
  | 'view_categories'
  | 'create_categories'
  | 'edit_categories'
  | 'delete_categories'
  
  // Settings permissions
  | 'view_settings'
  | 'edit_settings'
  | 'manage_system_settings'

  // CMS / storefront content permissions (sidebar "Content & Marketing", Storefront Studio)
  | 'view_cms'
  | 'manage_cms'

  // Storefront Studio — granular (manage_cms / view_cms still grant full or read access)
  | 'view_storefront'
  | 'edit_storefront_branding'
  | 'edit_storefront_theme'
  | 'edit_storefront_sections'
  | 'edit_storefront_seo'
  | 'edit_storefront_content'
  | 'manage_storefront_domains'
  | 'manage_storefront_addons'
  
  // Report permissions
  | 'view_reports'
  | 'export_reports'
  | 'generate_reports'

  // Payment permissions
  | 'view_payments'
  | 'create_payments'
  | 'refund_payments'
  | 'export_payments'

  // Company finance (expenses, budgets, vendors — fixer-admin /api/finance)
  | 'view_finance'
  | 'manage_finance'
  
  // Message permissions
  | 'view_messages'
  | 'send_messages'
  | 'delete_messages'
  
  // Notification permissions
  | 'view_notifications'
  | 'manage_notifications'
  
  // Coupon permissions
  | 'view_coupons'
  | 'create_coupons'
  | 'edit_coupons'
  | 'delete_coupons'
  | 'manage_coupons'
  
  // Referral permissions
  | 'view_referrals'
  | 'create_referrals'
  | 'edit_referrals'
  | 'delete_referrals'
  | 'manage_referrals'

  // CRM permissions
  | 'view_crm'
  | 'manage_crm'

  // Team work (internal tasks / Jira-style)
  | 'view_team_tasks'
  | 'manage_team_tasks'
  /** Create boards, archive, set per-board member roster (who sees which project). */
  | 'manage_team_projects'

  // Collaborative boards (canvas / whiteboard)
  | 'view_boards'
  | 'manage_boards'
  | 'invite_board_members'

  /** Annual Maintenance Contracts (home-service AMC ledger) */
  | 'view_amc'
  | 'manage_amc'

  /** Published + partner pricing playbooks (`/cms/admin/static-content/*rate-card*`) */
  | 'view_rate_cards'
  | 'manage_rate_cards'

  /** Policies, onboarding packs, agreements — templates & email signing envelopes */
  | 'view_company_documents'
  | 'manage_company_documents'

  /** Fees, commissions, operating cities — home-service POS economics */
  | 'view_operating_terms'
  | 'manage_operating_terms'

  /** Provider fleet / toolkit — tools, vans, spare stock, PPE; links to catalog product & platform service */
  | 'view_provider_assets'
  | 'manage_provider_assets'

  /** Workforce conduct ledger — penalties, warnings, fines, rewards (HR / ops audit trail) */
  | 'view_professional_conduct'
  | 'manage_professional_conduct'

  /** Recurring revenue plans & subscriber lifecycle (`/api/admin/subscriptions`) */
  | 'view_subscriptions'
  | 'manage_subscriptions'

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
  description: string
  level: number // Higher number = more privileges
}

export interface UserWithRole {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  permissions?: Permission[] // Custom permissions that override role defaults
  isActive: boolean
  createdAt: string
}

export interface PermissionCheck {
  permission: Permission
  fallbackUrl?: string
  showUnauthorizedMessage?: boolean
}

export interface RoutePermission {
  path: string
  requiredPermissions: Permission[]
  requireAll?: boolean // If true, user needs all permissions; if false, needs at least one
  allowedRoles?: UserRole[]
}

/** When `explicit`, only `permissions` on the user account apply (no role template merge). */
export type RbacPermissionMode = 'role_plus' | 'explicit'
