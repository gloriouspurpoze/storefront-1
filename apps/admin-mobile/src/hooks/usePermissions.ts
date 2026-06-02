import { useCallback, useMemo } from 'react'
import type { Permission, UserRole } from '@profixer/types'
import {
  canAccessRoute,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  sanitizePermissions,
  type PermissionCheckOptions,
} from '@profixer/rbac'
import { useAppSelector } from '@/store/hooks'

export function usePermissions() {
  const currentUser = useAppSelector((state) => state.auth.user)

  const rbacRole = useMemo((): UserRole => {
    if (!currentUser) return 'admin'
    if (currentUser.rbacRole) return currentUser.rbacRole
    const ut = currentUser.userType
    if (ut === 'super_admin') return 'super_admin'
    if (ut === 'admin') return 'admin'
    if (ut === 'provider') return 'provider'
    if (ut === 'customer') return 'customer'
    return 'admin'
  }, [currentUser])

  const legacyRolePlusScoped =
    currentUser?.userType === 'admin' &&
    currentUser?.rbacPermissionMode === 'role_plus' &&
    (currentUser?.rbacRole === 'staff' || currentUser?.rbacRole === 'manager') &&
    (currentUser?.permissions?.length ?? 0) > 0

  const explicitOnly =
    currentUser?.rbacPermissionMode === 'explicit' || Boolean(legacyRolePlusScoped)

  const customPermissions = useMemo(
    () => sanitizePermissions(currentUser?.permissions),
    [currentUser?.permissions],
  )

  const checkOpts = useMemo((): PermissionCheckOptions => ({ explicitOnly }), [explicitOnly])

  const checkPermission = useCallback(
    (permission: Permission) => {
      if (!currentUser) return false
      return hasPermission(rbacRole, permission, customPermissions, checkOpts)
    },
    [currentUser, rbacRole, customPermissions, checkOpts],
  )

  const checkAnyPermission = useCallback(
    (permissions: Permission[]) => {
      if (!currentUser) return false
      return hasAnyPermission(rbacRole, permissions, customPermissions, checkOpts)
    },
    [currentUser, rbacRole, customPermissions, checkOpts],
  )

  const checkAllPermissions = useCallback(
    (permissions: Permission[]) => {
      if (!currentUser) return false
      return hasAllPermissions(rbacRole, permissions, customPermissions, checkOpts)
    },
    [currentUser, rbacRole, customPermissions, checkOpts],
  )

  const checkRouteAccess = useCallback(
    (routePath: string) => {
      if (!currentUser) return false
      return canAccessRoute(rbacRole, routePath, customPermissions, checkOpts)
    },
    [currentUser, rbacRole, customPermissions, checkOpts],
  )

  return {
    userRole: rbacRole,
    customPermissions,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkRouteAccess,
    explicitOnly,
  }
}
