import type { TenantRef } from '../types'

/**
 * Maps common backend shapes to a tenant ref for Redux + API headers.
 * Extend here as your API stabilizes (snake_case vs nested `tenant`).
 */
export function extractTenantFromAuthPayload(payload: unknown): TenantRef | null {
  if (payload === null || payload === undefined || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>

  const topTenant = root.tenant
  if (topTenant && typeof topTenant === 'object') {
    const t = topTenant as Record<string, unknown>
    const id = t.id
    if (typeof id === 'string' && id.length > 0) {
      return {
        id,
        name: typeof t.name === 'string' ? t.name : undefined,
        slug: typeof t.slug === 'string' ? t.slug : undefined,
      }
    }
  }

  const user = (root.user ?? root) as Record<string, unknown>
  if (!user || typeof user !== 'object') return null

  const nested = user.tenant
  if (nested && typeof nested === 'object') {
    const t = nested as Record<string, unknown>
    const id = t.id
    if (typeof id === 'string' && id.length > 0) {
      return {
        id,
        name: typeof t.name === 'string' ? t.name : undefined,
        slug: typeof t.slug === 'string' ? t.slug : undefined,
      }
    }
  }

  const flatId =
    (typeof user.tenant_id === 'string' && user.tenant_id) ||
    (typeof user.organization_id === 'string' && user.organization_id) ||
    (typeof user.org_id === 'string' && user.org_id) ||
    (typeof user.workspace_id === 'string' && user.workspace_id)

  if (flatId && flatId.length > 0) {
    return {
      id: flatId,
      name: typeof user.tenant_name === 'string' ? user.tenant_name : undefined,
      slug: typeof user.tenant_slug === 'string' ? user.tenant_slug : undefined,
    }
  }

  return null
}
