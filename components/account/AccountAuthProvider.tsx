'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAuth,
  getStoredAuth,
  saveAuth,
  type StorefrontAuthTokens,
  type StorefrontAuthUser,
} from '@/lib/storefront-auth'

interface AccountAuthContextValue {
  user: StorefrontAuthUser | null
  tokens: StorefrontAuthTokens | null
  isReady: boolean
  isAuthenticated: boolean
  setSession: (user: StorefrontAuthUser, tokens: StorefrontAuthTokens) => void
  logout: () => void
}

const AccountAuthContext = createContext<AccountAuthContextValue | null>(null)

export function AccountAuthProvider({
  tenantId,
  children,
}: {
  tenantId: string
  children: ReactNode
}) {
  const [user, setUser] = useState<StorefrontAuthUser | null>(null)
  const [tokens, setTokens] = useState<StorefrontAuthTokens | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const stored = getStoredAuth(tenantId)
    if (stored) {
      setUser(stored.user)
      setTokens(stored.tokens)
    } else {
      setUser(null)
      setTokens(null)
    }
    setIsReady(true)
  }, [tenantId])

  const setSession = useCallback(
    (nextUser: StorefrontAuthUser, nextTokens: StorefrontAuthTokens) => {
      saveAuth(tenantId, nextUser, nextTokens)
      setUser(nextUser)
      setTokens(nextTokens)
    },
    [tenantId],
  )

  const logout = useCallback(() => {
    clearAuth(tenantId)
    setUser(null)
    setTokens(null)
  }, [tenantId])

  const value = useMemo(
    () => ({
      user,
      tokens,
      isReady,
      isAuthenticated: Boolean(user && tokens?.accessToken),
      setSession,
      logout,
    }),
    [user, tokens, isReady, setSession, logout],
  )

  return <AccountAuthContext.Provider value={value}>{children}</AccountAuthContext.Provider>
}

export function useAccountAuth(): AccountAuthContextValue {
  const ctx = useContext(AccountAuthContext)
  if (!ctx) {
    throw new Error('useAccountAuth must be used within AccountAuthProvider')
  }
  return ctx
}
