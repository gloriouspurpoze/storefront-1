import React from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { BadgePercent } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PageHeader } from '../../components/common'

const tabs = [
  { to: '/operations/commercial/terms', label: 'Fees & commissions' },
  { to: '/operations/commercial/cities', label: 'Operating cities' },
] as const

export function OperationsCommercialLayout() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Commercial terms & cities"
        subtitle="Industry POS controls for ProFixer — customer convenience fees, professional training charges, provider commission, GST posture on platform fees, and city-level pricing zones."
        icon={<BadgePercent className="h-7 w-7 text-primary sm:h-8 sm:w-8" />}
      />
      <nav className="flex flex-wrap gap-1 border-b border-border pb-px" aria-label="Commercial operations">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                'rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-muted text-foreground border border-b-0 border-border -mb-px'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

export function OperationsCommercialIndexRedirect() {
  return <Navigate to="/operations/commercial/terms" replace />
}
