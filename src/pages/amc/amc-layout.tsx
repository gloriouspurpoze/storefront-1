import React from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { PageHeader } from '../../components/common'
import { ShieldCheck } from 'lucide-react'

const tabs = [
  { to: '/amc/overview', label: 'Overview' },
  { to: '/amc/packages', label: 'Packages' },
  { to: '/amc/contracts', label: 'Contracts' },
] as const

export function AmcLayout() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Annual Maintenance Contracts"
        subtitle="Home-service AMC ledger for ProFixer — covered categories, scheduled visits, renewals, and payment tracking tied to customers."
        icon={<ShieldCheck className="h-7 w-7 text-primary sm:h-8 sm:w-8" />}
      />
      <nav className="flex flex-wrap gap-1 border-b border-border pb-px" aria-label="AMC sections">
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

export function AmcIndexRedirect() {
  return <Navigate to="/amc/overview" replace />
}
