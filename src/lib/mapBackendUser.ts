import type { User } from '../types'
import type { UserRole, RbacPermissionMode } from '../types/rbac.types'
import { sanitizePermissions } from './sanitizePermissions'
import type { TenantRef } from '../types'

export function mapBackendUserToAppUser(backendUser: any, tenantRef?: TenantRef | null): User {
  const perms = sanitizePermissions(backendUser.permissions as string[] | undefined)
  const rbacRole = (backendUser.rbac_role || backendUser.rbacRole) as UserRole | undefined
  const rbacPermissionMode = (backendUser.rbac_permission_mode ||
    backendUser.rbacPermissionMode) as RbacPermissionMode | undefined

  return {
    id: String(backendUser.id),
    email: backendUser.email,
    firstName: backendUser.first_name || backendUser.firstName,
    lastName: backendUser.last_name || backendUser.lastName,
    phone: backendUser.phone,
    userType: backendUser.user_type || backendUser.userType,
    isVerified: Boolean(backendUser.is_verified ?? backendUser.isVerified),
    isActive: backendUser.is_active ?? backendUser.isActive,
    profilePicture: backendUser.profile_picture || backendUser.profilePicture,
    createdAt: backendUser.created_at || backendUser.createdAt || new Date().toISOString(),
    updatedAt: backendUser.updated_at || backendUser.updatedAt,
    ...(tenantRef ? { tenant: tenantRef } : {}),
    ...(rbacRole ? { rbacRole } : {}),
    ...(rbacPermissionMode ? { rbacPermissionMode } : {}),
    ...(perms.length ? { permissions: perms } : {}),
  }
}
