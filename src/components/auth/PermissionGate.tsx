import React from 'react'
import { Navigate } from 'react-router-dom'
import { Home, Lock } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission, UserRole } from '../../types/rbac.types'

interface PermissionGateProps {
  children: React.ReactNode
  permissions?: Permission[]
  roles?: UserRole[]
  requireAll?: boolean
  fallback?: React.ReactNode
  redirectTo?: string
  showUnauthorized?: boolean
}

/**
 * Component that controls access based on permissions and roles
 *
 * @example
 * // Require specific permission
 * <PermissionGate permissions={['edit_products']}>
 *   <EditButton />
 * </PermissionGate>
 *
 * @example
 * // Require any of multiple permissions
 * <PermissionGate permissions={['edit_products', 'delete_products']}>
 *   <ManageProductsButton />
 * </PermissionGate>
 *
 * @example
 * // Require all permissions
 * <PermissionGate permissions={['edit_products', 'publish_products']} requireAll>
 *   <PublishButton />
 * </PermissionGate>
 *
 * @example
 * // Require specific role
 * <PermissionGate roles={['super_admin', 'admin']}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null,
  redirectTo,
  showUnauthorized = false,
}) => {
  const { checkAnyPermission, checkAllPermissions, isAnyRole } = usePermissions()

  const hasRoleAccess = roles.length === 0 || isAnyRole(roles)

  let hasPermissionAccess = true
  if (permissions.length > 0) {
    if (requireAll) {
      hasPermissionAccess = checkAllPermissions(permissions)
    } else {
      hasPermissionAccess = checkAnyPermission(permissions)
    }
  }

  const hasAccess = hasRoleAccess && hasPermissionAccess

  if (hasAccess) {
    return <>{children}</>
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUnauthorized) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-3">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="mb-2 flex justify-center" aria-hidden>
              <Lock className="h-20 w-20 text-destructive" strokeWidth={1.25} />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Access Denied</h2>
            <p className="mb-6 text-muted-foreground">
              You don't have permission to access this feature. Please contact your administrator
              if you believe this is an error.
            </p>
            <Button asChild>
              <a href="/" className="no-underline">
                <Home className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
                Go to Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

/**
 * HOC version of PermissionGate
 */
export const withPermission = (
  Component: React.ComponentType<any>,
  permissions: Permission[],
  options?: {
    requireAll?: boolean
    fallback?: React.ReactNode
    redirectTo?: string
  }
) => {
  return (props: any) => (
    <PermissionGate
      permissions={permissions}
      requireAll={options?.requireAll}
      fallback={options?.fallback}
      redirectTo={options?.redirectTo}
    >
      <Component {...props} />
    </PermissionGate>
  )
}
