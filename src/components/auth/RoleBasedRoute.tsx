import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission, UserRole } from '../../types/rbac.types'

interface RoleBasedRouteProps {
  children: React.ReactNode
  permissions?: Permission[]
  roles?: UserRole[]
  requireAll?: boolean
  redirectTo?: string
}

/**
 * Route wrapper that checks permissions before rendering
 * Use this to protect entire routes/pages
 * 
 * @example
 * <Route 
 *   path="/users" 
 *   element={
 *     <RoleBasedRoute permissions={['view_users']}>
 *       <Users />
 *     </RoleBasedRoute>
 *   } 
 * />
 */
export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  redirectTo = '/unauthorized'
}) => {
  const location = useLocation()
  const {
    checkAnyPermission,
    checkAllPermissions,
    isAnyRole,
    userRole
  } = usePermissions()

  // Check role-based access
  const hasRoleAccess = roles.length === 0 || isAnyRole(roles)

  // Check permission-based access
  let hasPermissionAccess = true
  if (permissions.length > 0) {
    if (requireAll) {
      hasPermissionAccess = checkAllPermissions(permissions)
    } else {
      hasPermissionAccess = checkAnyPermission(permissions)
    }
  }

  // User has access if both role and permission checks pass
  const hasAccess = hasRoleAccess && hasPermissionAccess

  if (!hasAccess) {
    // Redirect to unauthorized page or login, saving the attempted location
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location, requiredPermissions: permissions, userRole }}
        replace
      />
    )
  }

  return <>{children}</>
}
