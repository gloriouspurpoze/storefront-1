import type { ReactNode } from 'react'
import type { Permission } from '@profixer/types'
import { EmptyState } from '@/components/common/EmptyState'
import { Screen } from '@/components/layout/Screen'
import { usePermissions } from '@/hooks/usePermissions'

type Props = {
  /** Gate by web route (mapped to permissions via the RBAC route table). */
  webPath?: string
  /** Gate by an explicit permission — pass when no clean route mapping exists. */
  permission?: Permission
  /** Gate by any of several permissions (OR). */
  anyPermission?: Permission[]
  children: ReactNode
}

export function PermissionGate({ webPath, permission, anyPermission, children }: Props) {
  const { checkRouteAccess, checkPermission, checkAnyPermission } = usePermissions()

  const allowed =
    (permission ? checkPermission(permission) : true) &&
    (anyPermission ? checkAnyPermission(anyPermission) : true) &&
    (webPath ? checkRouteAccess(webPath) : true)

  if (!allowed) {
    return (
      <Screen>
        <EmptyState
          title="Access restricted"
          description="Your role does not include permission for this area. Contact an admin or use the web panel."
        />
      </Screen>
    )
  }
  return <>{children}</>
}
