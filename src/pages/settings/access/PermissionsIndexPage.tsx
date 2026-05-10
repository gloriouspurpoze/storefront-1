import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion'
import { Badge } from '../../../components/ui/badge'
import type { Permission } from '../../../types/rbac.types'
import {
  getPermissionsGroupedByDomain,
  humanizePermission,
  permissionVerb,
  rolesWithPermissionInTemplate,
} from '../../../lib/rbacRegistry'

export function PermissionsIndexPage() {
  const [q, setQ] = useState('')
  const grouped = useMemo(() => getPermissionsGroupedByDomain(), [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return grouped
    return grouped
      .map(({ domain, permissions }) => ({
        domain,
        permissions: permissions.filter((p) => {
          const roles = rolesWithPermissionInTemplate(p)
          return (
            p.toLowerCase().includes(s) ||
            domain.toLowerCase().includes(s) ||
            humanizePermission(p).toLowerCase().includes(s) ||
            roles.some((r) => r.includes(s))
          )
        }),
      }))
      .filter((g) => g.permissions.length > 0)
  }, [grouped, q])

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Catalog is generated from role templates and route guards. Click a row for routes and roles that
        reference it.
      </p>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search permission, domain, or role…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search permissions"
        />
      </div>

      <Accordion type="multiple" className="rounded-lg border bg-card">
        {filtered.map(({ domain, permissions }) => (
          <AccordionItem key={domain} value={domain}>
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="capitalize">{domain.replace(/_/g, ' ')}</span>
              <Badge variant="outline" className="ml-2">
                {permissions.length}
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="divide-y rounded-md border">
                {permissions.map((p: Permission) => {
                  const verb = permissionVerb(p)
                  const roleCount = rolesWithPermissionInTemplate(p).length
                  return (
                    <Link
                      key={p}
                      to={`/settings/access/permissions/${encodeURIComponent(p)}`}
                      className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-accent/60"
                    >
                      <code className="font-mono text-xs">{p}</code>
                      {verb ? (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {verb}
                        </Badge>
                      ) : null}
                      <span className="flex-1 text-muted-foreground">{humanizePermission(p)}</span>
                      <span className="text-xs text-muted-foreground">{roleCount} roles</span>
                    </Link>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No permissions match.</p>
      ) : null}
    </div>
  )
}
