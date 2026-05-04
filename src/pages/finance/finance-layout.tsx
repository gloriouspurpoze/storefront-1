import React from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { PageHeader } from '../../components/common'

const tabs = [
  { to: '/finance/overview', label: 'Overview' },
  { to: '/finance/expenses', label: 'Expenses' },
  { to: '/finance/budgets', label: 'Budgets' },
  { to: '/finance/reconciliation', label: 'Reconciliation' },
  { to: '/finance/recurring', label: 'Recurring' },
  { to: '/finance/directory', label: 'Directory' },
] as const

export function FinanceLayout() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Finance"
        subtitle="Operating cash, expenses, budgets, and P&amp;L signals — tied to platform payments where applicable."
      />
      <nav className="flex flex-wrap gap-1 border-b border-border pb-px" aria-label="Finance sections">
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

export function FinanceIndexRedirect() {
  return <Navigate to="/finance/overview" replace />
}
