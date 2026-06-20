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

export function AccountAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StorefrontAuthUser | null>(null)
  const [tokens, setTokens] = useState<StorefrontAuthTokens | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const stored = getStoredAuth()
    if (stored) {
      setUser(stored.user)
      setTokens(stored.tokens)
    }
    setIsReady(true)
  }, [])

  const setSession = useCallback((nextUser: StorefrontAuthUser, nextTokens: StorefrontAuthTokens) => {
    saveAuth(nextUser, nextTokens)
    setUser(nextUser)
    setTokens(nextTokens)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
    setTokens(null)
  }, [])

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
