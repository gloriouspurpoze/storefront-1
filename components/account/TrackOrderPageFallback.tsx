'use client'

import { useAccountTheme } from '@/components/account/AccountThemeContext'
import { accountThemeClasses } from '@/components/account/accountThemeClasses'

export function TrackOrderPageFallback() {
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)

  return <p className={t.statusLoading}>Loading…</p>
}
