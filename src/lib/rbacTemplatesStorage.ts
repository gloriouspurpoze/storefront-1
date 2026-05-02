import type { Permission, RbacPermissionMode, UserRole } from '../types/rbac.types'

const STORAGE_PREFIX = 'fixer-admin.rbac-access-templates'

export type DashboardAccessPreset = 'full' | 'manager' | 'staff' | 'explicit'

export type RbacAccessTemplate = {
  id: string
  name: string
  preset: DashboardAccessPreset
  explicitKeys: string[]
  rbacRole?: UserRole
  rbacPermissionMode?: RbacPermissionMode
  permissions?: Permission[]
  updatedAt: string
}

function storageKey(tenantId: string): string {
  return `${STORAGE_PREFIX}.${tenantId}`
}

export function loadRbacTemplates(tenantId: string | undefined | null): RbacAccessTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(tenantId || '_global'))
    if (!raw) return []
    const parsed = JSON.parse(raw) as RbacAccessTemplate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRbacTemplates(
  tenantId: string | undefined | null,
  templates: RbacAccessTemplate[],
): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(tenantId || '_global'), JSON.stringify(templates))
  } catch {
    /* quota / private mode */
  }
}

export function upsertRbacTemplate(
  tenantId: string | undefined | null,
  template: Omit<RbacAccessTemplate, 'id' | 'updatedAt'> & { id?: string },
): RbacAccessTemplate[] {
  const list = loadRbacTemplates(tenantId)
  const id =
    template.id ||
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `tpl_${Date.now()}`)
  const row: RbacAccessTemplate = {
    id,
    name: template.name.trim(),
    preset: template.preset,
    explicitKeys: template.explicitKeys,
    rbacRole: template.rbacRole,
    rbacPermissionMode: template.rbacPermissionMode,
    permissions: template.permissions,
    updatedAt: new Date().toISOString(),
  }
  const next = list.filter((t) => t.id !== id)
  next.push(row)
  next.sort((a, b) => a.name.localeCompare(b.name))
  saveRbacTemplates(tenantId, next)
  return next
}

export function deleteRbacTemplate(
  tenantId: string | undefined | null,
  id: string,
): RbacAccessTemplate[] {
  const next = loadRbacTemplates(tenantId).filter((t) => t.id !== id)
  saveRbacTemplates(tenantId, next)
  return next
}
