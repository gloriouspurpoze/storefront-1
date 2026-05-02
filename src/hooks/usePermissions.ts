import { useCallback, useMemo } from 'react'
import { useAppSelector } from '../store/hooks'
import type { Permission, UserRole } from '../types/rbac.types'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  type PermissionCheckOptions,
} from '../config/rbac.config'
import { sanitizePermissions } from '../lib/sanitizePermissions'

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const currentUser = useAppSelector((state) => state.auth.user)

  const rbacRole = useMemo((): UserRole => {
    if (!currentUser) return 'admin'
    const r = currentUser.rbacRole
    if (r) return r
    const ut = currentUser.userType
    if (ut === 'super_admin') return 'super_admin'
    if (ut === 'admin') return 'admin'
    if (ut === 'provider') return 'provider'
    if (ut === 'customer') return 'customer'
    return 'admin'
  }, [currentUser])

  const explicitOnly = currentUser?.rbacPermissionMode === 'explicit'

  const customPermissions = useMemo(
    () => sanitizePermissions(currentUser?.permissions),
    [currentUser?.permissions],
  )

  const checkOpts = useMemo((): PermissionCheckOptions => ({ explicitOnly }), [explicitOnly])

  const checkPermission = useCallback(
    (permission: Permission): boolean => {
      if (!currentUser) return false
      return hasPermission(rbacRole, permission, customPermissions, checkOpts)
    },
    [currentUser, rbacRole, customPermissions, checkOpts],
  )

  const checkAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (!currentUser) return false
      return hasAnyPermission(rbacRole, permissions, customPermissions, checkOpts)
    },
    [currentUser, rbacRole, customPermissions, checkOpts],
  )

  const checkAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (!currentUser) return false
      return hasAllPermissions(rbacRole, permissions, customPermissions, checkOpts)
    },
    [currentUser, rbacRole, customPermissions, checkOpts],
  )

  const checkRouteAccess = useCallback(
    (routePath: string): boolean => {
      if (!currentUser) return false
      return canAccessRoute(rbacRole, routePath, customPermissions, checkOpts)
    },
    [currentUser, rbacRole, customPermissions, checkOpts],
  )

  const isRole = useCallback(
    (role: UserRole): boolean => {
      return rbacRole === role
    },
    [rbacRole],
  )

  const isAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      return roles.includes(rbacRole)
    },
    [rbacRole],
  )

  const isSuperAdmin = useCallback((): boolean => {
    return rbacRole === 'super_admin'
  }, [rbacRole])

  const isAdmin = useCallback((): boolean => {
    return rbacRole === 'super_admin' || rbacRole === 'admin'
  }, [rbacRole])

  const isManager = useCallback((): boolean => {
    return ['super_admin', 'admin', 'manager'].includes(rbacRole)
  }, [rbacRole])

  return {
    userRole: rbacRole,
    customPermissions,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkRouteAccess,
    isRole,
    isAnyRole,
    isSuperAdmin,
    isAdmin,
    isManager,
    explicitOnly,
  }
}
