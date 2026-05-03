import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

const CRM_TABS = [
  { label: 'Overview', path: '/crm' },
  { label: 'Leads', path: '/crm/leads' },
  { label: 'Contacts', path: '/crm/contacts' },
  { label: 'B2B accounts', path: '/crm/companies' },
  { label: 'Deals', path: '/crm/deals' },
  { label: 'Activities', path: '/crm/activities' },
  { label: 'Settings', path: '/crm/settings' },
] as const

export function CrmSubnav() {
  const { pathname } = useLocation()

  return (
    <nav className="mb-6 border-b" aria-label="CRM sections">
      <div className="flex min-h-11 flex-nowrap gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CRM_TABS.map((t) => {
          const isActive = t.path === '/crm' ? pathname === '/crm' : pathname.startsWith(t.path)
          return (
            <Link
              key={t.path}
              to={t.path}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-semibold no-underline transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
