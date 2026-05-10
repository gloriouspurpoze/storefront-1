import React from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { PageHeader } from '../../components/common'
import { ListOrdered } from 'lucide-react'

const tabs = [
  { to: '/rate-cards/overview', label: 'Overview' },
  { to: '/rate-cards/customer', label: 'Customer rates' },
  { to: '/rate-cards/provider', label: 'Provider playbook' },
  { to: '/rate-cards/catalog', label: 'Catalog pricing' },
] as const

export function RateCardsLayout() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Rate card management"
        subtitle="ProFixer POS pricing spine — published customer matrix, partner economics, and live platform-service / SKU tariffs."
        icon={<ListOrdered className="h-7 w-7 text-primary sm:h-8 sm:w-8" />}
      />
      <nav className="flex flex-wrap gap-1 border-b border-border pb-px" aria-label="Rate card sections">
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

export function RateCardsIndexRedirect() {
  return <Navigate to="/rate-cards/overview" replace />
}
