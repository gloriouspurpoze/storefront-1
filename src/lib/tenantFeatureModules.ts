/**
 * Tenant API module keys — must stay in sync with fixer-backend
 * `src/core/tenant/tenantFeatures.ts` → `TENANT_FEATURE_KEYS`.
 */
export const TENANT_FEATURE_MODULES = [
  {
    key: 'cms',
    label: 'CMS & website',
    description: 'Pages, blogs, menus, media, and public site appearance.',
  },
  {
    key: 'crm',
    label: 'CRM',
    description: 'Contacts, companies, deals, and sales activities.',
  },
  {
    key: 'finance',
    label: 'Finance',
    description: 'Expenses, vendors, budgets, and company P&L.',
  },
  {
    key: 'marketing_workspace',
    label: 'Marketing',
    description: 'Campaigns, calendar, social posts, and marketing tasks.',
  },
  {
    key: 'team_work',
    label: 'Team work',
    description: 'Boards, sprints, ceremonies, and team calendar.',
  },
  {
    key: 'bazaar',
    label: 'Bazaar',
    description: 'Marketplace listings and bazaar admin.',
  },
  {
    key: 'ecommerce',
    label: 'E-commerce',
    description: 'Products, orders, and storefront catalog admin.',
  },
] as const

export type TenantFeatureModuleKey = (typeof TENANT_FEATURE_MODULES)[number]['key']

const KEY_SET = new Set<string>(TENANT_FEATURE_MODULES.map((m) => m.key))

export function isTenantFeatureModuleKey(k: string): k is TenantFeatureModuleKey {
  return KEY_SET.has(k)
}

export function tenantModuleLabel(key: string): string {
  return TENANT_FEATURE_MODULES.find((m) => m.key === key)?.label ?? key
}

/**
 * Human-readable summary for tables and badges.
 * `null` / `undefined` = full access (no allowlist on tenant).
 */
export function summarizeTenantModules(featureModules?: string[] | null): {
  mode: 'all' | 'restricted' | 'none'
  label: string
  keys: string[]
} {
  if (featureModules === undefined || featureModules === null) {
    return { mode: 'all', label: 'All modules', keys: [...TENANT_FEATURE_MODULES.map((m) => m.key)] }
  }
  if (featureModules.length === 0) {
    return { mode: 'none', label: 'No modules', keys: [] }
  }
  return {
    mode: 'restricted',
    label: `${featureModules.length} of ${TENANT_FEATURE_MODULES.length}`,
    keys: featureModules.filter((k) => KEY_SET.has(k)),
  }
}
