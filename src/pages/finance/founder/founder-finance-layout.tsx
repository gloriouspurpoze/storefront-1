import React from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { cn } from '../../../lib/utils'

const tabs = [
  { to: '/finance/founder/dashboard', label: 'Dashboard' },
  { to: '/finance/founder/simulator', label: 'Pricing Simulator' },
  { to: '/finance/founder/city-pnl', label: 'City P&L' },
  { to: '/finance/founder/cac', label: 'CAC' },
  { to: '/finance/founder/provider-cost', label: 'Provider Cost' },
  { to: '/finance/founder/leaderboard', label: 'Leaderboard' },
] as const

export function FounderFinanceLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Founder Finance</h2>
        <p className="text-sm text-muted-foreground">
          Unit economics, slab commission, city P&amp;L, CAC, provider reconciliation, and leaderboard — replaces the
          founder spreadsheet.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b border-border pb-px" aria-label="Founder finance sections">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                'rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
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

export function FounderFinanceIndexRedirect() {
  return <Navigate to="/finance/founder/dashboard" replace />
}
