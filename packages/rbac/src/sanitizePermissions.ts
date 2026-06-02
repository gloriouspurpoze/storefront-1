import { getRolePermissions } from './rbac.config'
import type { Permission } from '../../types/src/rbac.types'

const ALL = new Set(getRolePermissions('super_admin'))

export function sanitizePermissions(input: (string | Permission)[] | undefined | null): Permission[] {
  if (!input?.length) return []
  const out: Permission[] = []
  for (const p of input) {
    if (ALL.has(p as Permission)) {
      out.push(p as Permission)
    }
  }
  return Array.from(new Set(out))
}
