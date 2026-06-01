import type { DashboardLayoutDef, DashboardSectionKey } from '../verticals/core/dashboardWidgets'
import { homeServicesDashboardLayout } from '../verticals/home_services/dashboardWidgets'
import type { VerticalKey } from '../verticals/core/types'
import { getVerticalPack } from '../verticals/registry'

export function getDashboardLayout(verticalKey: VerticalKey): DashboardLayoutDef {
  return getVerticalPack(verticalKey).dashboardLayout ?? homeServicesDashboardLayout
}

export function dashboardHasSection(layout: DashboardLayoutDef, section: DashboardSectionKey): boolean {
  return layout.sections.includes(section)
}
