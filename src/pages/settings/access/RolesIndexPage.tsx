import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { getRolesSummary } from '../../../lib/rbacRegistry'

export function RolesIndexPage() {
  const roles = getRolesSummary()

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Templates defined in <code className="rounded bg-muted px-1 text-xs">rbac.config.ts</code>. Higher
        level means broader defaults; actual access may be narrowed per user.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((r) => (
          <Link key={r.role} to={`/settings/access/roles/${encodeURIComponent(r.role)}`}>
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-mono text-lg capitalize">{r.role.replace(/_/g, ' ')}</CardTitle>
                  <Badge variant="secondary">Lv {r.level}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{r.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{r.permissionCount} permissions</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
