'use client'

import { usePathname } from 'next/navigation'
import { useAccountAuth } from '@/components/account/AccountAuthProvider'
import type { StorefrontAuthUser } from '@/lib/storefront-auth'

export interface AccountShellAuthState {
  pathname: string | null
  isLogin: boolean
  isAuthenticated: boolean
  user: StorefrontAuthUser | null
}

/** Shared `isLogin`/auth derivation used by every themed AccountShell. */
export function useAccountShellAuth(): AccountShellAuthState {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAccountAuth()
  const isLogin = Boolean(pathname?.includes('/account/login'))
  return { pathname, isLogin, isAuthenticated, user }
}
