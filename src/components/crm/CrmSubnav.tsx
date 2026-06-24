import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

/** Industry-standard home-services CRM spine: funnel → people → pipeline → tasks → config */
const CRM_TABS = [
  {
    label: 'Overview',
    path: '/crm',
    title: 'Pipeline KPIs, overdue tasks, and quick links',
  },
  {
    label: 'Leads',
    path: '/crm/leads',
    title: 'Pre-conversion: inquiry through in-progress (incl. WhatsApp)',
  },
  {
    label: 'Contacts',
    path: '/crm/contacts',
    title: 'Converted customers and active partners',
  },
  {
    label: 'B2B accounts',
    path: '/crm/companies',
    title: 'Societies, AMCs, and corporate buyers',
  },
  {
    label: 'Deals',
    path: '/crm/deals',
    title: 'Revenue pipeline: quote → scheduled → paid',
  },
  {
    label: 'Activities',
    path: '/crm/activities',
    title: 'Calls, WhatsApp, visits, and follow-up tasks',
  },
  {
    label: 'Settings',
    path: '/crm/settings',
    title: 'Field policies, platform sync, and integrations',
  },
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
              title={t.title}
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
