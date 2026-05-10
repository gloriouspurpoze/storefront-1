import React, { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft, Search } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion'
import type { Permission, UserRole } from '../../../types/rbac.types'
import {
  getRoleDefinition,
  getRolePermissionsGrouped,
  humanizePermission,
  isKnownUserRole,
  permissionVerb,
} from '../../../lib/rbacRegistry'

export function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>()
  const [q, setQ] = useState('')

  const role = roleId && isKnownUserRole(roleId) ? (roleId as UserRole) : null
  const definition = role ? getRoleDefinition(role) : undefined

  const grouped = useMemo(() => (role ? getRolePermissionsGrouped(role) : []), [role])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return grouped
    return grouped
      .map(({ domain, permissions }) => ({
        domain,
        permissions: permissions.filter(
          (p) =>
            p.toLowerCase().includes(s) ||
            humanizePermission(p).toLowerCase().includes(s) ||
            domain.toLowerCase().includes(s),
        ),
      }))
      .filter((g) => g.permissions.length > 0)
  }, [grouped, q])

  if (!roleId || !role || !definition) {
    return <Navigate to="/settings/access/roles" replace />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link to="/settings/access/roles">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Roles
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-mono text-2xl font-semibold capitalize">{role.replace(/_/g, ' ')}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{definition.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Level {definition.level}</Badge>
            <Badge variant="outline">{definition.permissions.length} in template</Badge>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Filter permissions…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Filter permissions"
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
              <ul className="grid gap-2 sm:grid-cols-2">
                {permissions.map((p: Permission) => {
                  const verb = permissionVerb(p)
                  return (
                    <li key={p}>
                      <Link
                        to={`/settings/access/permissions/${encodeURIComponent(p)}`}
                        className="flex flex-col gap-0.5 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-primary/30 hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-2"
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <code className="font-mono text-xs">{p}</code>
                          {verb ? (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {verb}
                            </Badge>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground">{humanizePermission(p)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No permissions match this filter.</p>
      ) : null}
    </div>
  )
}
