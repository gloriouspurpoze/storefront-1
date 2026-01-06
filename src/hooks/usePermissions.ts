import { useCallback } from 'react'
import { useAppSelector } from '../store/hooks'
import { Permission, UserRole } from '../types/rbac.types'
import { hasPermission, hasAnyPermission, hasAllPermissions, canAccessRoute } from '../config/rbac.config'

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  // Get current user from Redux store
  const currentUser = useAppSelector((state) => state.auth.user)
  console.log(currentUser, 'currentUser')
  const userRole = (currentUser?.userType || 'admin') as UserRole
  const customPermissions = (currentUser as any)?.permissions as Permission[] | undefined

  /**
   * Check if user has a specific permission
   */
  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!currentUser) return false
    return hasPermission(userRole, permission, customPermissions)
  }, [currentUser, userRole, customPermissions])

  /**
   * Check if user has any of the specified permissions
   */
  const checkAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!currentUser) return false
    return hasAnyPermission(userRole, permissions, customPermissions)
  }, [currentUser, userRole, customPermissions])

  /**
   * Check if user has all of the specified permissions
   */
  const checkAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!currentUser) return false
    return hasAllPermissions(userRole, permissions, customPermissions)
  }, [currentUser, userRole, customPermissions])

  /**
   * Check if user can access a specific route
   */
  const checkRouteAccess = useCallback((routePath: string): boolean => {
    if (!currentUser) return false
    return canAccessRoute(userRole, routePath)
  }, [currentUser, userRole])

  /**
   * Check if user is a specific role
   */
  const isRole = useCallback((role: UserRole): boolean => {
    return userRole === role
  }, [userRole])

  /**
   * Check if user is one of the specified roles
   */
  const isAnyRole = useCallback((roles: UserRole[]): boolean => {
    return roles.includes(userRole)
  }, [userRole])

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = useCallback((): boolean => {
    return userRole === 'super_admin'
  }, [userRole])

  /**
   * Check if user is admin or super admin
   */
  const isAdmin = useCallback((): boolean => {
    return userRole === 'super_admin' || userRole === 'admin'
  }, [userRole])

  /**
   * Check if user is manager or above
   */
  const isManager = useCallback((): boolean => {
    return ['super_admin', 'admin', 'manager'].includes(userRole)
  }, [userRole])

  return {
    userRole,
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
  }
}
