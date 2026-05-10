import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  GitBranch,
  Layers,
  Route as RouteIcon,
  Shield,
  UserCog,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import {
  getAllDefinedPermissions,
  getPermissionsGroupedByDomain,
  getRouteGuardStats,
  getRolesSummary,
} from '../../../lib/rbacRegistry'

export function AccessOverviewPage() {
  const roles = getRolesSummary()
  const perms = getAllDefinedPermissions()
  const domains = getPermissionsGroupedByDomain()
  const stats = getRouteGuardStats()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" aria-hidden />
              Roles
            </CardTitle>
            <CardDescription>Templates by privilege level</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{roles.length}</p>
            <Link
              to="/settings/access/roles"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Browse roles <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-5 w-5 text-primary" aria-hidden />
              Permissions
            </CardTitle>
            <CardDescription>Union of templates + route refs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{perms.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{domains.length} domains</p>
            <Link
              to="/settings/access/permissions"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Explore catalog <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <RouteIcon className="h-5 w-5 text-primary" aria-hidden />
              Route guards
            </CardTitle>
            <CardDescription>Static route → permission map</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{stats.totalRoutes}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.openGuards} open · {stats.strictAllMode} require-all
            </p>
            <Link
              to="/settings/access/routes"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Open explorer <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-5 w-5 text-primary" aria-hidden />
              Enforcement
            </CardTitle>
            <CardDescription>Server remains authoritative</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              This UI documents what the admin SPA expects. APIs must still enforce the same rules for
              mobile and integrations.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/25 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCog className="h-5 w-5 text-primary" aria-hidden />
            Assign access to team members
          </CardTitle>
          <CardDescription>
            Search dashboard accounts, edit union vs explicit permission sets, deactivate, or delete — without
            leaving this hub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/settings/access/assign"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Open assign tab <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick orientation</CardTitle>
          <CardDescription>How pieces fit together</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <Badge variant="outline" className="mb-2">
              Roles
            </Badge>
            <p>
              Each role has a numeric level and a permission template. Users can override with explicit
              chips or “explicit only” mode on the user record.
            </p>
          </div>
          <div>
            <Badge variant="outline" className="mb-2">
              Permissions
            </Badge>
            <p>
              Strings such as <code className="rounded bg-muted px-1">view_bookings</code>. Detail pages
              show which roles and routes reference each key.
            </p>
          </div>
          <div>
            <Badge variant="outline" className="mb-2">
              Routes
            </Badge>
            <p>
              Longest path wins when multiple guards match. Use the simulator to preview access for a
              template role (no custom overrides).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
