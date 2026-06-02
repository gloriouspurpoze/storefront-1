/** Shared RBAC config — source: `packages/rbac` */
export {
  rolePermissionsMap,
  routePermissions,
  getRolePermissions,
  getRoleLevel,
  canAccessRoute,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  type PermissionCheckOptions,
} from '../../packages/rbac/src/rbac.config'

export { resolveUserPermissions } from '../../packages/rbac/src/resolveUserPermissions'
