import type { Permission, RbacPermissionMode, UserRole } from './rbac.types'

export interface TenantRef {
  id: string
  name?: string
  slug?: string
  verticalKey?: string
  featureModules?: string[] | null
  planKey?: string
  billingStatus?: string
}

export type AppUserType =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'staff'
  | 'provider'
  | 'professional'
  | 'customer'

export interface AppUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  username?: string
  phone?: string
  userType: AppUserType | string
  isVerified?: boolean
  isActive?: boolean
  profilePicture?: string
  isDashboardMember?: boolean
  registrationSource?: string
  createdAt: string
  updatedAt?: string
  tenant?: TenantRef
  rbacRole?: UserRole
  rbacPermissionMode?: RbacPermissionMode
  permissions?: Permission[]
}
