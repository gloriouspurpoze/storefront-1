import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, ShieldCheck, ShieldOff } from 'lucide-react'
import { routePermissions, canAccessRoute } from '../../../config/rbac.config'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import type { UserRole } from '../../../types/rbac.types'
import { getRolesSummary } from '../../../lib/rbacRegistry'

export function RoutesExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const focus = searchParams.get('focus') || ''
  const [pathFilter, setPathFilter] = useState('')
  const [simRole, setSimRole] = useState<UserRole | 'none'>('none')

  const sorted = useMemo(
    () => [...routePermissions].sort((a, b) => a.path.localeCompare(b.path)),
    [],
  )

  const roles = useMemo(() => getRolesSummary().map((r) => r.role), [])

  const filtered = useMemo(() => {
    const q = pathFilter.trim().toLowerCase()
    const focusNorm = focus.trim().toLowerCase()
    return sorted.filter((r) => {
      if (focusNorm && r.path.toLowerCase() !== focusNorm && !r.path.toLowerCase().startsWith(focusNorm + '/')) {
        return false
      }
      if (!q) return true
      return (
        r.path.toLowerCase().includes(q) ||
        r.requiredPermissions.some((p) => p.toLowerCase().includes(q)) ||
        r.allowedRoles?.some((role) => role.toLowerCase().includes(q))
      )
    })
  }, [sorted, pathFilter, focus])

  const simulatorAllowed = (pathname: string) => {
    if (simRole === 'none') return null
    return canAccessRoute(simRole, pathname)
  }

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Static guards from <code className="rounded bg-muted px-1 text-xs">routePermissions</code>. Longest
        matching path wins. Simulator uses template roles only (ignores per-user custom permissions).
      </p>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/20 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filter by path, permission, or role…"
            value={pathFilter}
            onChange={(e) => setPathFilter(e.target.value)}
            aria-label="Filter routes"
          />
        </div>
        <div className="w-full min-w-[200px] sm:w-56">
          <Label className="mb-2 block text-xs text-muted-foreground">Simulate role</Label>
          <Select
            value={simRole}
            onValueChange={(v) => setSimRole(v as UserRole | 'none')}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r} value={r} className="font-mono capitalize">
                  {r.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {focus ? (
          <button
            type="button"
            className="text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setSearchParams({}, { replace: true })
            }}
          >
            Clear focus
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-3 font-medium">Path</th>
              <th className="px-3 py-3 font-medium">Permissions</th>
              <th className="px-3 py-3 font-medium">Mode</th>
              <th className="px-3 py-3 font-medium">Roles</th>
              {simRole !== 'none' ? <th className="px-3 py-3 font-medium">Simulated</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => {
              const sim = simulatorAllowed(r.path)
              const focusHighlight = Boolean(focus && r.path === focus)
              return (
                <tr
                  key={r.path}
                  className={focusHighlight ? 'bg-primary/5' : undefined}
                >
                  <td className="px-3 py-2 align-top font-mono text-xs">
                    <span className="break-all">{r.path}</span>
                  </td>
                  <td className="max-w-[280px] px-3 py-2 align-top">
                    {r.requiredPermissions?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {r.requiredPermissions.map((p) => (
                          <Link key={p} to={`/settings/access/permissions/${encodeURIComponent(p)}`}>
                            <Badge variant="outline" className="font-mono text-[10px] font-normal hover:bg-accent">
                              {p}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {r.requireAll ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Require all
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Any of
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                    {r.allowedRoles?.length ? r.allowedRoles.join(', ') : '—'}
                  </td>
                  {simRole !== 'none' ? (
                    <td className="px-3 py-2 align-top">
                      {sim === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : sim ? (
                        <span className="inline-flex items-center gap-1 text-storm-deep dark:text-storm-sea">
                          <ShieldCheck className="h-4 w-4" aria-hidden />
                          Allow
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <ShieldOff className="h-4 w-4" aria-hidden />
                          Deny
                        </span>
                      )}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Rows: {filtered.length} / {sorted.length}
      </p>
    </div>
  )
}
