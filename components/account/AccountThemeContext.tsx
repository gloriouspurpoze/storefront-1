'use client'

import { createContext, useContext } from 'react'
import type { ThemedAccountKey } from '@/lib/account-themes'

const AccountThemeContext = createContext<ThemedAccountKey | undefined>(undefined)

export function AccountThemeProvider({
  themeKey,
  children,
}: {
  themeKey?: ThemedAccountKey
  children: React.ReactNode
}) {
  return <AccountThemeContext.Provider value={themeKey}>{children}</AccountThemeContext.Provider>
}

export function useAccountTheme(): ThemedAccountKey | undefined {
  return useContext(AccountThemeContext)
}
