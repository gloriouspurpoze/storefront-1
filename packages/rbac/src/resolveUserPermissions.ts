import type { Permission, UserRole } from '../../types/src/rbac.types'
import { getRolePermissions } from './rbac.config'

export type ResolveUserPermissionsOptions = {
  /** If true, only `customPermissions` are returned (scoped dashboard users). */
  explicitOnly: boolean
}

/**
 * Resolves the effective permission set for a user — shared by web hooks and mobile navigators.
 */
export function resolveUserPermissions(
  rbacRole: UserRole,
  customPermissions: Permission[],
  opts: ResolveUserPermissionsOptions,
): Permission[] {
  if (opts.explicitOnly) {
    return [...customPermissions]
  }
  const rolePerms = getRolePermissions(rbacRole)
  return Array.from(new Set([...rolePerms, ...customPermissions]))
}
