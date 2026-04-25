import React from 'react'
import { Building2 } from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
import { SAAS_MODE } from '../../lib/saasEnv'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

function formatTenantLabel(
  tenantId: string | null,
  name: string | null,
  slug: string | null
): { primary: string; hint: string | null } {
  if (!tenantId && !name && !slug) {
    return { primary: 'No organization', hint: 'Complete login or set a default tenant.' }
  }
  const primary = name?.trim() || slug?.trim() || (tenantId ? `Tenant ${tenantId.slice(0, 8)}…` : 'Organization')
  const hint =
    tenantId && (name || slug) ? tenantId : tenantId && !name && !slug ? tenantId : null
  return { primary, hint }
}

/** Shown when `REACT_APP_SAAS_MODE=true` — current tenant / org context for multi-tenant admins. */
export function SaasTenantIndicator(props: {
  variant: 'header' | 'sidebar'
  sidebarOpen?: boolean
}) {
  const { variant, sidebarOpen = true } = props
  const tenant = useAppSelector((s) => s.tenant)
  const { tenantId, name, slug } = tenant ?? {}

  if (!SAAS_MODE) return null

  const { primary, hint } = formatTenantLabel(tenantId, name, slug)
  const titleAttr = hint ? `Tenant id: ${hint}` : primary

  if (variant === 'header') {
    return (
      <span title={titleAttr} className="inline-block max-w-[140px] sm:max-w-[220px]">
        <Badge variant="outline" className="w-full max-w-full gap-1 border-primary/30 py-0.5 pl-1 pr-2 text-xs">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate font-normal">{primary}</span>
        </Badge>
      </span>
    )
  }

  const inner = (
    <div
      className={cn(
        'mb-1 flex items-center gap-1 rounded-md border border-border/40 bg-primary/[0.04] py-2',
        sidebarOpen ? 'mx-1.5 px-2' : 'mx-1.5 justify-center px-0'
      )}
    >
      <Building2 className="h-5 w-5 shrink-0 text-primary" />
      {sidebarOpen && (
        <div className="min-w-0 flex-1 text-left">
          <span
            className="block text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Organization
          </span>
          <span className="line-clamp-2 break-words text-sm font-semibold leading-tight">
            {primary}
          </span>
          {hint && hint !== primary && (
            <span className="mt-0.5 block max-w-full truncate font-mono text-[0.7rem] text-muted-foreground">
              {hint.length > 36 ? `${hint.slice(0, 8)}…${hint.slice(-6)}` : hint}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (!sidebarOpen) {
    return (
      <div title={hint ? `${primary} — ${hint}` : primary} className="mx-1.5">
        {inner}
      </div>
    )
  }

  return inner
}
