import React from 'react'
import { Badge } from '../ui/badge'
import type { User } from '../../types'
import type { Permission } from '../../types/rbac.types'
import { formatPermissionLabel } from '../../lib/formatPermission'
import { cn } from '../../lib/utils'

const roleVariant = (role: string): React.ComponentProps<typeof Badge>['variant'] => {
  if (role === 'super_admin') return 'destructive'
  if (role === 'admin') return 'destructive'
  if (role === 'manager') return 'default'
  if (role === 'staff') return 'secondary'
  if (role === 'provider') return 'outline'
  if (role === 'professional') return 'outline'
  if (role === 'customer') return 'success'
  return 'secondary'
}

function formatRoleLabel(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function UserAccessChips({
  user,
  className,
  maxPermissionChips = 6,
}: {
  user: User
  className?: string
  maxPermissionChips?: number
}) {
  const isDashboard =
    user.userType === 'admin' || user.userType === 'super_admin'

  if (!isDashboard) {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        <Badge variant="outline" className="text-xs capitalize">
          App: {user.userType}
        </Badge>
      </div>
    )
  }

  const effectiveRole = user.rbacRole || user.userType
  const mode = user.rbacPermissionMode
  const perms = user.permissions || []

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant={roleVariant(effectiveRole)} className="text-xs">
          Role: {formatRoleLabel(effectiveRole)}
        </Badge>
        {mode === 'explicit' ? (
          <Badge variant="outline" className="border-bloom-coral/50 text-xs text-bloom-coral dark:text-bloom-deep">
            Auth: Explicit
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Auth: Role + grants
          </Badge>
        )}
      </div>
      {perms.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {perms.slice(0, maxPermissionChips).map((p: Permission) => (
            <Badge key={p} variant="secondary" className="max-w-[140px] truncate font-normal text-[0.65rem]">
              {formatPermissionLabel(p)}
            </Badge>
          ))}
          {perms.length > maxPermissionChips && (
            <Badge variant="outline" className="text-[0.65rem]">
              +{perms.length - maxPermissionChips}
            </Badge>
          )}
        </div>
      )}
      {mode === 'explicit' && perms.length === 0 && (
        <span className="text-[0.65rem] text-bloom-coral dark:text-bloom-coral">No module grants</span>
      )}
    </div>
  )
}
