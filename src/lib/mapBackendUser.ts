import type { User } from '../types'
import type { UserRole, RbacPermissionMode } from '../types/rbac.types'
import { sanitizePermissions } from './sanitizePermissions'
import type { TenantRef } from '../types'

export function mapBackendUserToAppUser(backendUser: any, tenantRef?: TenantRef | null): User {
  const rawPermissions = backendUser.permissions
  const perms = Array.isArray(rawPermissions)
    ? sanitizePermissions(rawPermissions as string[])
    : sanitizePermissions(undefined)
  const rbacRole = (backendUser.rbac_role || backendUser.rbacRole) as UserRole | undefined
  const rbacPermissionMode = (backendUser.rbac_permission_mode ||
    backendUser.rbacPermissionMode) as RbacPermissionMode | undefined

  const registrationSource = (backendUser.registration_source ||
    backendUser.registrationSource) as User['registrationSource'] | undefined

  const displayName = backendUser.display_name || backendUser.displayName
  const username = backendUser.username || backendUser.user_name

  return {
    id: String(backendUser.id),
    email: backendUser.email,
    firstName: backendUser.first_name || backendUser.firstName,
    lastName: backendUser.last_name || backendUser.lastName,
    ...(displayName ? { displayName: String(displayName) } : {}),
    ...(username ? { username: String(username) } : {}),
    phone: backendUser.phone,
    userType: backendUser.user_type || backendUser.userType,
    isVerified: Boolean(backendUser.is_verified ?? backendUser.isVerified),
    isActive: backendUser.is_active ?? backendUser.isActive,
    profilePicture: backendUser.profile_picture || backendUser.profilePicture,
    isDashboardMember: Boolean(backendUser.is_dashboard_member ?? backendUser.isDashboardMember),
    ...(registrationSource ? { registrationSource } : {}),
    createdAt: backendUser.created_at || backendUser.createdAt || new Date().toISOString(),
    updatedAt: backendUser.updated_at || backendUser.updatedAt,
    ...(tenantRef ? { tenant: tenantRef } : {}),
    ...(rbacRole ? { rbacRole } : {}),
    ...(rbacPermissionMode ? { rbacPermissionMode } : {}),
    ...(Array.isArray(rawPermissions) ? { permissions: perms } : {}),
  }
}
