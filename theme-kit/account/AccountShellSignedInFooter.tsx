import { displayName } from '@/lib/storefront-auth'
import type { AccountShellAuthState } from './useAccountShellAuth'

/** "Signed in as X" footer shared by themes that render one — omitted when not authenticated, on the login page, or by themes that don't have a footer at all. */
export function AccountShellSignedInFooter({
  auth,
  className,
}: {
  auth: AccountShellAuthState
  className: string
}) {
  if (!auth.isAuthenticated || !auth.user || auth.isLogin) return null
  return <footer className={className}>Signed in as {displayName(auth.user)}</footer>
}
