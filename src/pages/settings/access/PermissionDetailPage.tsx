import React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, ChevronLeft } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import type { Permission } from '../../../types/rbac.types'
import {
  getAllDefinedPermissions,
  humanizePermission,
  inferPermissionDomain,
  permissionVerb,
  routesRequiringPermission,
  rolesWithPermissionInTemplate,
} from '../../../lib/rbacRegistry'

export function PermissionDetailPage() {
  const { permissionId } = useParams<{ permissionId: string }>()
  const decoded = permissionId ? decodeURIComponent(permissionId) : ''
  const catalog = getAllDefinedPermissions()
  const valid = decoded && catalog.includes(decoded as Permission)

  if (!decoded || !valid) {
    return <Navigate to="/settings/access/permissions" replace />
  }

  const p = decoded as Permission
  const verb = permissionVerb(p)
  const domain = inferPermissionDomain(p)
  const roles = rolesWithPermissionInTemplate(p)
  const routes = routesRequiringPermission(p)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link to="/settings/access/permissions">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Permissions
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Permission</p>
        <h1 className="mt-2 font-mono text-2xl font-semibold break-all">{p}</h1>
        <p className="mt-2 text-muted-foreground">{humanizePermission(p)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            Domain · {domain.replace(/_/g, ' ')}
          </Badge>
          {verb ? <Badge variant="secondary">{verb}</Badge> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Roles (template)</CardTitle>
            <CardDescription>
              Includes super_admin (effective allow-all). Custom user overrides are not shown here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <li key={r}>
                  <Link to={`/settings/access/roles/${encodeURIComponent(r)}`}>
                    <Badge variant="secondary" className="capitalize hover:bg-secondary/80">
                      {r.replace(/_/g, ' ')}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Route guards</CardTitle>
            <CardDescription>
              Routes whose guard lists include this permission (any-of unless marked require-all).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {routes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not referenced directly by a route guard (may still apply via role-only routes).
              </p>
            ) : (
              <ul className="space-y-2">
                {routes.map((rt) => (
                  <li key={rt.path}>
                    <Link
                      to={`/settings/access/routes?focus=${encodeURIComponent(rt.path)}`}
                      className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent/60"
                    >
                      <code className="font-mono text-xs">{rt.path}</code>
                      {rt.requireAll ? (
                        <Badge variant="destructive" className="text-[10px]">
                          all
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          any
                        </Badge>
                      )}
                      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
