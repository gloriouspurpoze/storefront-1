import type { LucideIcon } from 'lucide-react'
import { coreSidebarGroups } from '../verticals/core/sidebarManifest'
import { resolveVerticalIcon } from '../verticals/core/iconRegistry'
import type {
  SidebarNavGroupDef,
  SidebarNavItemDef,
  SidebarNavSubItemDef,
  VerticalKey,
} from '../verticals/core/types'
import { getVerticalPack } from '../verticals/registry'

/** Matches backend `TENANT_FEATURE_KEYS` + forward-compatible keys. */
export const TENANT_MODULE_KEYS = [
  'cms',
  'crm',
  'finance',
  'marketing_workspace',
  'team_work',
  'bazaar',
  'ecommerce',
] as const

export type TenantModuleKey = (typeof TENANT_MODULE_KEYS)[number]

export interface RuntimeSidebarSubItem {
  name: string
  href: string
  icon: LucideIcon
  permissions?: string[]
}

export interface RuntimeSidebarItem {
  name: string
  href?: string
  icon: LucideIcon
  permissions?: string[]
  hasSubmenu?: boolean
  subItems?: RuntimeSidebarSubItem[]
  badge?: string | number | null
}

export interface RuntimeSidebarGroup {
  title: string
  icon?: LucideIcon
  items: RuntimeSidebarItem[]
}

function mapSubItem(sub: SidebarNavSubItemDef): RuntimeSidebarSubItem {
  return {
    name: sub.name,
    href: sub.href,
    icon: resolveVerticalIcon(sub.icon),
    permissions: sub.permissions,
  }
}

function mapItem(item: SidebarNavItemDef): RuntimeSidebarItem {
  return {
    name: item.name,
    href: item.href,
    icon: resolveVerticalIcon(item.icon),
    permissions: item.permissions,
    hasSubmenu: item.hasSubmenu,
    subItems: item.subItems?.map(mapSubItem),
    badge: item.badge ?? null,
  }
}

function mapGroup(group: SidebarNavGroupDef): RuntimeSidebarGroup {
  return {
    title: group.title,
    icon: group.icon ? resolveVerticalIcon(group.icon) : undefined,
    items: group.items.map(mapItem),
  }
}

function mergeSidebarGroups(core: SidebarNavGroupDef[], vertical: SidebarNavGroupDef[]): SidebarNavGroupDef[] {
  return [...core, ...vertical].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

/**
 * Build admin sidebar groups for a tenant vertical (before RBAC / module filters).
 */
export function buildAdminNavigationDefs(verticalKey: VerticalKey): SidebarNavGroupDef[] {
  const pack = getVerticalPack(verticalKey)
  return mergeSidebarGroups(coreSidebarGroups, pack.sidebarGroups)
}

export function buildAdminNavigationGroups(verticalKey: VerticalKey): RuntimeSidebarGroup[] {
  return buildAdminNavigationDefs(verticalKey).map(mapGroup)
}

function moduleAllowed(module: string | undefined, featureModules: string[] | null | undefined): boolean {
  if (!module) return true
  if (featureModules === null || featureModules === undefined) return true
  if (featureModules.length === 0) return false
  return featureModules.includes(module)
}

function itemPassesPlatformGate(
  platformOnly: boolean | undefined,
  isPlatformOperator: boolean,
): boolean {
  if (!platformOnly) return true
  return isPlatformOperator
}

/** Filter using manifest metadata (platform-only + modules) before icon mapping. */
export function filterSidebarDefsByTenantEntitlements(
  groups: SidebarNavGroupDef[],
  opts: {
    featureModules?: string[] | null
    isPlatformOperator: boolean
  },
): SidebarNavGroupDef[] {
  const { featureModules, isPlatformOperator } = opts

  return groups
    .map((group) => {
      const items = group.items
        .map((item): SidebarNavItemDef | null => {
          if (!itemPassesPlatformGate(item.platformOnly, isPlatformOperator)) return null

          if (item.hasSubmenu && item.subItems?.length) {
            const subItems = item.subItems.filter(
              (sub) =>
                itemPassesPlatformGate(sub.platformOnly, isPlatformOperator) &&
                moduleAllowed(sub.module, featureModules),
            )
            if (subItems.length === 0) return null
            return { ...item, subItems }
          }

          if (!moduleAllowed(item.module, featureModules)) return null
          return item
        })
        .filter((item): item is SidebarNavItemDef => item !== null)
      return { ...group, items }
    })
    .filter((g) => g.items.length > 0)
}

export function buildFilteredAdminNavigationGroups(opts: {
  verticalKey: VerticalKey
  featureModules?: string[] | null
  isPlatformOperator: boolean
}): RuntimeSidebarGroup[] {
  const defs = buildAdminNavigationDefs(opts.verticalKey)
  const filtered = filterSidebarDefsByTenantEntitlements(defs, {
    featureModules: opts.featureModules,
    isPlatformOperator: opts.isPlatformOperator,
  })
  return filtered.map(mapGroup)
}
