import React, { useMemo } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useTheme as useAppTheme } from '../../contexts/theme-context'
import { createAppTheme } from '../../theme/mui-app-theme'

export function AppMuiThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useAppTheme()
  const muiTheme = useMemo(
    () => createAppTheme(isDarkMode ? 'dark' : 'light'),
    [isDarkMode]
  )

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
