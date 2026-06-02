import type { ReactNode } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { Screen } from '@/components/layout/Screen'
import { usePermissions } from '@/hooks/usePermissions'

type Props = {
  webPath: string
  children: ReactNode
}

export function PermissionGate({ webPath, children }: Props) {
  const { checkRouteAccess } = usePermissions()
  if (!checkRouteAccess(webPath)) {
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
