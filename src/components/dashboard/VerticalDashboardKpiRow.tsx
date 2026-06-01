import {
  IndianRupee,
  ShoppingCart,
  Wrench,
  Star,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  UtensilsCrossed,
  Scissors,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { CHART_PALETTE } from '../../lib/chartPalette'
import type { DashboardKpiGradient, DashboardKpiWidgetDef } from '../../verticals/core/dashboardWidgets'
import type { DashboardStats } from '../../services/api/dashboard.service'
import { formatCurrency } from '../../lib/utils'
import { cn } from '../../lib/utils'

const GRADIENTS: Record<DashboardKpiGradient, string> = {
  primary: `linear-gradient(135deg, ${CHART_PALETTE.primary} 0%, ${CHART_PALETTE.primaryDeep} 100%)`,
  bloom: `linear-gradient(135deg, ${CHART_PALETTE.bloomCoral} 0%, ${CHART_PALETTE.bloomDeep} 100%)`,
  primaryBright: `linear-gradient(135deg, ${CHART_PALETTE.primaryBright} 0%, ${CHART_PALETTE.primary} 100%)`,
  storm: `linear-gradient(135deg, ${CHART_PALETTE.stormSea} 0%, ${CHART_PALETTE.stormDeep} 100%)`,
}

const ICONS: Record<string, LucideIcon> = {
  IndianRupee,
  ShoppingCart,
  Wrench,
  Star,
  Calendar,
  Users,
  UtensilsCrossed,
  Scissors,
}

function formatStatValue(widget: DashboardKpiWidgetDef, stats: DashboardStats): string {
  const raw = stats[widget.statSource]
  switch (widget.format) {
    case 'currency':
      return formatCurrency(Number(raw) || 0)
    case 'rating':
      return Number(raw || 0).toFixed(1)
    default:
      return String(Number(raw) || 0)
  }
}

function growthValue(widget: DashboardKpiWidgetDef, stats: DashboardStats): number {
  return Number(stats[widget.growthSource]) || 0
}

export function VerticalDashboardKpiRow({
  widgets,
  stats,
}: {
  widgets: DashboardKpiWidgetDef[]
  stats: DashboardStats
}) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {widgets.map((widget) => {
        const Icon = ICONS[widget.icon] ?? Star
        const growth = growthValue(widget, stats)
        return (
          <Card
            key={widget.id}
            className="relative overflow-hidden border-0 text-on-primary"
            style={{ background: GRADIENTS[widget.gradient] }}
          >
            <CardContent className="p-6">
              <div className="mb-2 flex justify-between">
                <p className="text-sm opacity-90">{widget.label}</p>
                <Icon className="h-5 w-5 opacity-80" />
              </div>
              <p className="mb-1 text-3xl font-bold">{formatStatValue(widget, stats)}</p>
              <div className="flex items-center gap-1 text-sm">
                {growth >= 0 ? (
                  <TrendingUp className={cn('h-4 w-4')} />
                ) : (
                  <TrendingDown className={cn('h-4 w-4')} />
                )}
                <span>
                  {growth >= 0 ? '+' : ''}
                  {growth.toFixed(1)}
                  {widget.format === 'rating' ? '' : '%'} from last month
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
