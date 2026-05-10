import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { PageHeader } from '../../../components/common/PageHeader'
import { cn } from '../../../lib/utils'

const tabs: { to: string; label: string; end?: boolean }[] = [
  { to: '/settings/access', label: 'Overview', end: true },
  { to: '/settings/access/assign', label: 'Assign access' },
  { to: '/settings/access/roles', label: 'Roles' },
  { to: '/settings/access/permissions', label: 'Permissions' },
  { to: '/settings/access/routes', label: 'Route guards' },
]

export function AccessLayout() {
  return (
    <div className="min-h-0 flex-1 p-4 sm:p-6">
      <PageHeader
        title="Roles & access"
        subtitle="Live view of dashboard RBAC: roles, permission catalog, and route guards are derived from code — no duplicate lists to drift."
        icon={<KeyRound className="h-8 w-8 shrink-0 text-primary" aria-hidden />}
      />

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3" aria-label="Access sections">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
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
