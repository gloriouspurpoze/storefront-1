import { useMemo } from 'react'
import { dashboardHasSection, getDashboardLayout } from '../lib/verticalDashboard'
import { useVerticalPack } from './useVerticalPack'

export function useVerticalDashboard() {
  const { verticalKey, pack } = useVerticalPack()
  const layout = useMemo(() => getDashboardLayout(verticalKey), [verticalKey])

  return {
    verticalKey,
    pack,
    layout,
    tagline: layout.tagline,
    kpis: layout.kpis,
    hasSection: (section: Parameters<typeof dashboardHasSection>[1]) =>
      dashboardHasSection(layout, section),
  }
}
