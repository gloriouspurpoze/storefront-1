import type { EngagementTypeDef } from './engagement'
import type { DashboardLayoutDef } from './dashboardWidgets'
import type { VerticalPlanDef } from './billingPlans'
import type { CatalogKindDef } from './catalog'
import type { WorkforceRoleDef } from './workforce'
import type { TaxStrategyDef } from './tax'
import type { ComplianceFieldDef } from './compliance'
import type { IntegrationDef } from './integrations'
import type { ReportDef } from './reports'

/** Supported industry packs. Extend as new verticals ship. */
export type VerticalKey =  | 'home_services'
  | 'restaurant'
  | 'salon'
  | 'clinic'
  | 'fitness'
  | 'auto_repair'
  | 'tutoring'
  | 'custom'

export const DEFAULT_VERTICAL_KEY: VerticalKey = 'home_services'

export function normalizeVerticalKey(raw: unknown): VerticalKey {
  if (typeof raw !== 'string' || !raw.trim()) return DEFAULT_VERTICAL_KEY
  const k = raw.trim() as VerticalKey
  const known: VerticalKey[] = [
    'home_services',
    'restaurant',
    'salon',
    'clinic',
    'fitness',
    'auto_repair',
    'tutoring',
    'custom',
  ]
  return known.includes(k) ? k : DEFAULT_VERTICAL_KEY
}

/** Lucide icon name — resolved via `verticalIconRegistry`. */
export type VerticalIconName = string

export interface SidebarNavItemDef {
  id: string
  name: string
  href?: string
  icon: VerticalIconName
  permissions?: string[]
  /** Tenant `featureModules` gate (see TENANT_FEATURE_KEYS on backend). */
  module?: string
  /** Hide for tenant-scoped users; platform operators (`tenantId` null) only. */
  platformOnly?: boolean
  hasSubmenu?: boolean
  subItems?: SidebarNavSubItemDef[]
  badge?: string | number | null
}

export interface SidebarNavSubItemDef {
  id: string
  name: string
  href: string
  icon: VerticalIconName
  permissions?: string[]
  module?: string
  platformOnly?: boolean
}

export interface SidebarNavGroupDef {
  id: string
  title: string
  icon?: VerticalIconName
  order?: number
  items: SidebarNavItemDef[]
}

export interface VerticalPackMeta {  key: VerticalKey
  label: string
  description: string
  version: string
  defaultModules: string[]
}

export interface VerticalPackDefinition extends VerticalPackMeta {
  sidebarGroups: SidebarNavGroupDef[]
  /** Primary engagement type for this vertical (e.g. booking, reservation). */
  engagementTypes?: EngagementTypeDef[]
  /** KPI cards and dashboard sections for the admin home screen. */
  dashboardLayout?: DashboardLayoutDef
  /** SaaS plans offered for this vertical (`Tenant.planKey`). */
  billingPlans?: VerticalPlanDef[]
  catalogKinds?: CatalogKindDef[]
  workforceRoles?: WorkforceRoleDef[]
  taxStrategy?: TaxStrategyDef
  compliance?: ComplianceFieldDef[]
  integrations?: IntegrationDef[]
  reports?: ReportDef[]
  /** Marketing / signup path segment (e.g. `for-restaurants`). */
  marketingSlug?: string
}
