import React from 'react'
import { Navigate } from 'react-router-dom'
import { Box, Typography, Button, Paper } from '@mui/material'
import { Lock as LockIcon, Home as HomeIcon } from '@mui/icons-material'
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
  showUnauthorized = false
}) => {
  const {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    isAnyRole
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

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>
  }

  // If redirect is specified, navigate to that route
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  // If custom fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>
  }

  // If showUnauthorized is true, show unauthorized message
  if (showUnauthorized) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          p: 3
        }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 500
          }}
        >
          <LockIcon
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2
            }}
          />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don't have permission to access this feature. Please contact your administrator if you believe this is an error.
          </Typography>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            href="/"
            sx={{ mt: 2 }}
          >
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    )
  }

  // Default: render nothing
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
