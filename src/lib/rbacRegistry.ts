/**
 * Dynamic RBAC introspection — single source of truth is `config/rbac.config.ts`.
 * Used by Settings → Roles & access explorer (no duplicate permission lists in UI).
 */

import {
  rolePermissionsMap,
  routePermissions,
} from '../config/rbac.config'
import type { Permission, RolePermissions, RoutePermission, UserRole } from '../types/rbac.types'

const VERBS = new Set([
  'view',
  'create',
  'edit',
  'delete',
  'manage',
  'approve',
  'verify',
  'publish',
  'process',
  'cancel',
  'refund',
  'export',
  'generate',
  'send',
  'ban',
  'invite',
])

/** Resource bucket after stripping a leading verb (e.g. view_bookings → bookings). */
export function inferPermissionDomain(p: Permission): string {
  const parts = p.split('_')
  if (parts.length < 2) return 'general'
  const verb = parts[0]
  if (verb && VERBS.has(verb)) {
    const rest = parts.slice(1).join('_')
    return rest || 'general'
  }
  return p
}

export function humanizePermission(p: Permission): string {
  return p
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function permissionVerb(p: Permission): string | null {
  const parts = p.split('_')
  const v = parts[0]
  return v && VERBS.has(v) ? v : null
}

/** Every permission referenced by role templates or route guards. */
export function getAllDefinedPermissions(): Permission[] {
  const set = new Set<Permission>()
  for (const rp of Object.values(rolePermissionsMap)) {
    for (const x of rp.permissions) set.add(x)
  }
  for (const route of routePermissions) {
    for (const x of route.requiredPermissions) set.add(x)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export function getPermissionsGroupedByDomain(): { domain: string; permissions: Permission[] }[] {
  const map = new Map<string, Permission[]>()
  for (const p of getAllDefinedPermissions()) {
    const d = inferPermissionDomain(p)
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(p)
  }
  Array.from(map.values()).forEach((arr) => arr.sort((a, b) => a.localeCompare(b)))
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([domain, permissions]) => ({ domain, permissions }))
}

export type RoleSummary = {
  role: UserRole
  level: number
  description: string
  permissionCount: number
}

export function getRolesSummary(): RoleSummary[] {
  return (Object.keys(rolePermissionsMap) as UserRole[])
    .map((role) => {
      const meta = rolePermissionsMap[role]
      return {
        role,
        level: meta.level,
        description: meta.description,
        permissionCount: meta.permissions.length,
      }
    })
    .sort((a, b) => b.level - a.level)
}

/** Roles whose template includes this permission. Super admin is listed for every permission. */
export function rolesWithPermissionInTemplate(p: Permission): UserRole[] {
  const out: UserRole[] = []
  for (const role of Object.keys(rolePermissionsMap) as UserRole[]) {
    if (role === 'super_admin') {
      out.push(role)
      continue
    }
    if (rolePermissionsMap[role].permissions.includes(p)) out.push(role)
  }
  return out
}

export function routesRequiringPermission(p: Permission): RoutePermission[] {
  return routePermissions.filter((r) => r.requiredPermissions.includes(p))
}

export function getRouteGuardStats(): {
  totalRoutes: number
  openGuards: number
  strictAllMode: number
} {
  let open = 0
  let strict = 0
  for (const r of routePermissions) {
    if (!r.requiredPermissions?.length) open++
    if (r.requireAll) strict++
  }
  return { totalRoutes: routePermissions.length, openGuards: open, strictAllMode: strict }
}

/** Longest-prefix match — mirrors rbac.config route matching order conceptually. */
export function matchRouteGuard(pathname: string): RoutePermission | undefined {
  const matches = routePermissions.filter(
    (r) => pathname === r.path || pathname.startsWith(`${r.path}/`),
  )
  if (matches.length === 0) return undefined
  return matches.sort((a, b) => b.path.length - a.path.length)[0]
}

export function getRoleDefinition(role: UserRole): RolePermissions | undefined {
  return rolePermissionsMap[role]
}

export function isKnownUserRole(role: string): role is UserRole {
  return role in rolePermissionsMap
}

/** Permissions for one role, grouped by inferred domain (same keys as catalog). */
export function getRolePermissionsGrouped(role: UserRole): { domain: string; permissions: Permission[] }[] {
  const def = rolePermissionsMap[role]
  const list =
    role === 'super_admin' ? getAllDefinedPermissions() : [...def.permissions].sort((a, b) => a.localeCompare(b))
  const map = new Map<string, Permission[]>()
  for (const p of list) {
    const d = inferPermissionDomain(p)
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(p)
  }
  Array.from(map.values()).forEach((arr) => arr.sort((a, b) => a.localeCompare(b)))
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([domain, permissions]) => ({ domain, permissions }))
}
