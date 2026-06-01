import type { TenantRef } from '../types'
import { normalizeVerticalKey } from '../verticals/core/types'

/**
 * Maps common backend shapes to a tenant ref for Redux + API headers.
 * Extend here as your API stabilizes (snake_case vs nested `tenant`).
 */
function readVerticalKey(t: Record<string, unknown>): string | undefined {
  const raw =
    t.verticalKey ??
    t.vertical_key ??
    t.industryKey ??
    t.industry_key
  return typeof raw === 'string' ? normalizeVerticalKey(raw) : undefined
}

function readFeatureModules(t: Record<string, unknown>): string[] | null | undefined {
  const raw = t.featureModules ?? t.feature_modules
  if (raw === null) return null
  if (!Array.isArray(raw)) return undefined
  return raw.filter((m): m is string => typeof m === 'string')
}

function readPlanKey(t: Record<string, unknown>): string | undefined {
  const raw = t.planKey ?? t.plan_key
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}

function readBillingStatus(t: Record<string, unknown>): string | undefined {
  const raw = t.billingStatus ?? t.billing_status
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}

function tenantRefFromRecord(t: Record<string, unknown>): TenantRef | null {
  const id = t.id ?? t._id
  if (typeof id !== 'string' || id.length === 0) return null
  return {
    id,
    name: typeof t.name === 'string' ? t.name : undefined,
    slug: typeof t.slug === 'string' ? t.slug : undefined,
    verticalKey: readVerticalKey(t),
    featureModules: readFeatureModules(t),
    planKey: readPlanKey(t),
    billingStatus: readBillingStatus(t),
  }
}

export function extractTenantFromAuthPayload(payload: unknown): TenantRef | null {
  if (payload === null || payload === undefined || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>

  const topTenant = root.tenant
  if (topTenant && typeof topTenant === 'object') {
    const ref = tenantRefFromRecord(topTenant as Record<string, unknown>)
    if (ref) return ref
  }

  const user = (root.user ?? root) as Record<string, unknown>
  if (!user || typeof user !== 'object') return null

  const nested = user.tenant
  if (nested && typeof nested === 'object') {
    const ref = tenantRefFromRecord(nested as Record<string, unknown>)
    if (ref) return ref
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
      verticalKey: readVerticalKey(user),
      featureModules: readFeatureModules(user),
    }
  }

  return null
}
