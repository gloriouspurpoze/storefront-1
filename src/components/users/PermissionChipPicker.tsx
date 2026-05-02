import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import type { Permission } from '../../types/rbac.types'
import { PERMISSION_GROUPS, formatPermissionLabel } from '../../config/permissionsCatalog'

type Props = {
  selected: Set<Permission>
  onChange: (next: Set<Permission>) => void
  disabled?: boolean
  className?: string
}

export function PermissionChipPicker({ selected, onChange, disabled, className }: Props) {
  const [q, setQ] = useState('')

  const filteredGroups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return PERMISSION_GROUPS
    return PERMISSION_GROUPS.map((g) => ({
      ...g,
      permissions: g.permissions.filter(
        (p) =>
          p.toLowerCase().includes(needle) || formatPermissionLabel(p).toLowerCase().includes(needle),
      ),
    })).filter((g) => g.permissions.length > 0)
  }, [q])

  const toggle = (p: Permission) => {
    if (disabled) return
    const next = new Set(selected)
    if (next.has(p)) next.delete(p)
    else next.add(p)
    onChange(next)
  }

  const selectGroup = (perms: Permission[]) => {
    if (disabled) return
    const next = new Set(selected)
    perms.forEach((p) => next.add(p))
    onChange(next)
  }

  const clearGroup = (perms: Permission[]) => {
    if (disabled) return
    const next = new Set(selected)
    perms.forEach((p) => next.delete(p))
    onChange(next)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search permissions…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={disabled}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Toggle chips to build the <span className="font-mono">permissions</span> array sent to the API. Selected:{' '}
        <span className="font-medium text-foreground">{selected.size}</span>
      </p>
      <div className="max-h-[min(420px,50vh)] space-y-4 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[0.65rem]"
                  disabled={disabled}
                  onClick={() => selectGroup(group.permissions)}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[0.65rem]"
                  disabled={disabled}
                  onClick={() => clearGroup(group.permissions)}
                >
                  None
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.permissions.map((p) => {
                const on = selected.has(p)
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={disabled}
                    title={p}
                    onClick={() => toggle(p)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-left text-[0.65rem] font-medium transition-colors',
                      on
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                      disabled && 'pointer-events-none opacity-50',
                    )}
                  >
                    {formatPermissionLabel(p)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
