import React from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { FileSignature } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PageHeader } from '../../components/common'

const tabs = [
  { to: '/company-documents/overview', label: 'Overview' },
  { to: '/company-documents/templates', label: 'Templates' },
  { to: '/company-documents/envelopes', label: 'Signatures' },
] as const

export function CompanyDocumentsLayout() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Company documents & acknowledgements"
        subtitle="Policies, onboarding and hiring packs, provider agreements, and customer terms for ProFixer — versioned templates, PDF attachments, and email links for typed digital acknowledgement."
        icon={<FileSignature className="h-7 w-7 text-primary sm:h-8 sm:w-8" />}
      />
      <nav className="flex flex-wrap gap-1 border-b border-border pb-px" aria-label="Company documents sections">
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

export function CompanyDocumentsIndexRedirect() {
  return <Navigate to="/company-documents/overview" replace />
}
