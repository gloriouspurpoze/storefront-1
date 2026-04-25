import React from 'react'
/**
 * Replaces the old MUI ThemeProvider. Tailwind + `index.css` supply global styles;
 * `ThemeProvider` in `contexts/theme-context` toggles `class="dark"` on the document.
 */
export function AppMuiThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
