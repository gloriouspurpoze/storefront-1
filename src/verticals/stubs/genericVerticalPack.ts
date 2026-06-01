import type { VerticalKey, VerticalPackDefinition } from '../core/types'
import { homeServicesPack } from '../home_services/sidebarManifest'

/**
 * Thin packs for verticals not yet fully productized — inherit home_services
 * navigation until a dedicated manifest ships.
 */
export function buildGenericVerticalPack(
  key: VerticalKey,
  label: string,
  description: string,
  marketingSlug: string,
): VerticalPackDefinition {
  return {
    ...homeServicesPack,
    key,
    label,
    description,
    version: '0.1.0',
    marketingSlug,
    defaultModules: homeServicesPack.defaultModules,
    sidebarGroups: homeServicesPack.sidebarGroups,
    engagementTypes: homeServicesPack.engagementTypes,
    dashboardLayout: homeServicesPack.dashboardLayout,
    billingPlans: homeServicesPack.billingPlans,
    catalogKinds: homeServicesPack.catalogKinds,
    workforceRoles: homeServicesPack.workforceRoles,
    taxStrategy: homeServicesPack.taxStrategy,
    compliance: homeServicesPack.compliance,
    integrations: homeServicesPack.integrations,
    reports: homeServicesPack.reports,
  }
}
