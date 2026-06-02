import type { TenantRef } from '../../types/src/user.types'

/**
 * Pull entitlement fields the backend already serializes on the login payload's
 * `tenant` object (`sanitizeUser` in `AuthServiceMongo.ts`). The Redux store
 * needs these for the sidebar module gate and billing nudges.
 *
 * - `featureModules`: explicit allowlist; `null` = full access; `[]` = no API
 *   access (the sidebar filter treats `null`/`undefined` as full access, so we
 *   must NOT drop `null` here — distinguish from "field absent").
 */
function tenantRefFromRecord(t: Record<string, unknown>): TenantRef | null {
  const id = t.id ?? t._id
  if (typeof id !== 'string' || id.length === 0) return null

  // Pick whichever key is present (cannot use `??` — it collapses an explicit
  // `null` from the backend, which means "full access", into "field absent").
  const hasModulesKey = 'featureModules' in t || 'feature_modules' in t
  const rawModules = 'featureModules' in t ? t.featureModules : t.feature_modules
  let featureModules: string[] | null | undefined
  if (!hasModulesKey) {
    featureModules = undefined
  } else if (rawModules === null) {
    featureModules = null
  } else if (Array.isArray(rawModules)) {
    featureModules = rawModules.filter((m): m is string => typeof m === 'string')
  } else {
    featureModules = undefined
  }

  const verticalKey =
    typeof t.verticalKey === 'string'
      ? t.verticalKey
      : typeof t.vertical_key === 'string'
        ? (t.vertical_key as string)
        : undefined

  const planKey =
    typeof t.planKey === 'string'
      ? t.planKey
      : typeof t.plan_key === 'string'
        ? (t.plan_key as string)
        : undefined

  const billingStatus =
    typeof t.billingStatus === 'string'
      ? t.billingStatus
      : typeof t.billing_status === 'string'
        ? (t.billing_status as string)
        : undefined

  return {
    id,
    name: typeof t.name === 'string' ? t.name : undefined,
    slug: typeof t.slug === 'string' ? t.slug : undefined,
    ...(featureModules !== undefined ? { featureModules } : {}),
    ...(verticalKey ? { verticalKey } : {}),
    ...(planKey ? { planKey } : {}),
    ...(billingStatus ? { billingStatus } : {}),
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
    }
  }

  return null
}
