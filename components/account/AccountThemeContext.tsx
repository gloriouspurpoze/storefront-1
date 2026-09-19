'use client'

import { createContext, useContext } from 'react'
import { isThemedAccount, type ThemedAccountKey } from '@/lib/account-themes'

/** Raw storefront `themeKey` (e.g. trade-pro) — not only fully themed account skins. */
const AccountThemeContext = createContext<string | undefined>(undefined)

export function AccountThemeProvider({
  themeKey,
  children,
}: {
  themeKey?: string
  children: React.ReactNode
}) {
  return <AccountThemeContext.Provider value={themeKey}>{children}</AccountThemeContext.Provider>
}

/** Themed account skin key when registered in `THEMED_ACCOUNT_KEYS`. */
export function useAccountTheme(): ThemedAccountKey | undefined {
  const key = useContext(AccountThemeContext)
  return isThemedAccount(key) ? key : undefined
}

/** Layout/storefront theme key for label/link adaptations (e.g. trade-pro). */
export function useAccountLayoutTheme(): string | undefined {
  return useContext(AccountThemeContext)
}
