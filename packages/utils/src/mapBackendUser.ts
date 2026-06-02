import { sanitizePermissions } from '../../rbac/src/sanitizePermissions'
import type { AppUser, TenantRef } from '../../types/src/rbac.types'
import type { RbacPermissionMode, UserRole } from '../../types/src/rbac.types'

export function mapBackendUserToAppUser(backendUser: Record<string, unknown>, tenantRef?: TenantRef | null): AppUser {
  const rawPermissions = backendUser.permissions
  const perms = Array.isArray(rawPermissions)
    ? sanitizePermissions(rawPermissions as string[])
    : sanitizePermissions(undefined)
  const rbacRole = (backendUser.rbac_role || backendUser.rbacRole) as UserRole | undefined
  const rbacPermissionMode = (backendUser.rbac_permission_mode ||
    backendUser.rbacPermissionMode) as RbacPermissionMode | undefined

  const registrationSource = (backendUser.registration_source ||
    backendUser.registrationSource) as AppUser['registrationSource'] | undefined

  const displayName = backendUser.display_name || backendUser.displayName
  const username = backendUser.username || backendUser.user_name

  return {
    id: String(backendUser.id ?? backendUser._id ?? ''),
    email: String(backendUser.email ?? ''),
    firstName: (backendUser.first_name || backendUser.firstName) as string | undefined,
    lastName: (backendUser.last_name || backendUser.lastName) as string | undefined,
    ...(displayName ? { displayName: String(displayName) } : {}),
    ...(username ? { username: String(username) } : {}),
    phone: backendUser.phone as string | undefined,
    userType: String(backendUser.user_type || backendUser.userType || 'admin'),
    isVerified: Boolean(backendUser.is_verified ?? backendUser.isVerified),
    isActive: (backendUser.is_active ?? backendUser.isActive) as boolean | undefined,
    profilePicture: (backendUser.profile_picture || backendUser.profilePicture) as string | undefined,
    isDashboardMember: Boolean(backendUser.is_dashboard_member ?? backendUser.isDashboardMember),
    ...(registrationSource ? { registrationSource } : {}),
    createdAt: String(backendUser.created_at || backendUser.createdAt || new Date().toISOString()),
    updatedAt: (backendUser.updated_at || backendUser.updatedAt) as string | undefined,
    ...(tenantRef ? { tenant: tenantRef } : {}),
    ...(rbacRole ? { rbacRole } : {}),
    ...(rbacPermissionMode ? { rbacPermissionMode } : {}),
    ...(Array.isArray(rawPermissions) ? { permissions: perms } : {}),
  }
}
