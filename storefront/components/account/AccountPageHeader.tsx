'use client'

import { useAccountTheme } from './AccountThemeContext'
import { accountThemeClasses } from './accountThemeClasses'

export function AccountPageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  const themeKey = useAccountTheme()
  const t = accountThemeClasses(themeKey)

  return (
    <div className="mb-8">
      <h1 className={t.pageTitle}>{title}</h1>
      {subtitle ? <p className={t.pageSubtitle}>{subtitle}</p> : null}
    </div>
  )
}
