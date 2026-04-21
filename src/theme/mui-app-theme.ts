import { createTheme, alpha } from '@mui/material/styles'

const fontStack = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif'

/** Aligned with Tailwind slate + blue-600 primary — single visual language for MUI + shadcn */
export function createAppTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'

  const primaryMain = '#2563eb'
  const primaryDark = '#1d4ed8'
  const primaryLight = '#3b82f6'

  const backgroundDefault = isDark ? '#0f172a' : '#f8fafc'
  const backgroundPaper = isDark ? '#1e293b' : '#ffffff'
  const divider = isDark ? alpha('#94a3b8', 0.16) : alpha('#64748b', 0.18)

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: primaryMain,
        dark: primaryDark,
        light: primaryLight,
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#64748b' : '#475569',
        contrastText: '#ffffff',
      },
      error: {
        main: isDark ? '#f87171' : '#dc2626',
      },
      warning: {
        main: isDark ? '#fbbf24' : '#d97706',
      },
      success: {
        main: isDark ? '#34d399' : '#059669',
      },
      info: {
        main: isDark ? '#22d3ee' : '#0891b2',
      },
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
        disabled: isDark ? alpha('#f8fafc', 0.38) : alpha('#0f172a', 0.38),
      },
      divider,
      action: {
        active: isDark ? alpha('#f8fafc', 0.56) : alpha('#0f172a', 0.54),
        hover: isDark ? alpha('#f8fafc', 0.08) : alpha('#0f172a', 0.04),
        selected: isDark ? alpha(primaryMain, 0.24) : alpha(primaryMain, 0.12),
        disabled: isDark ? alpha('#f8fafc', 0.3) : alpha('#0f172a', 0.26),
        disabledBackground: isDark ? alpha('#f8fafc', 0.12) : alpha('#0f172a', 0.12),
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: fontStack,
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: backgroundDefault,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }),
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: Number(theme.shape.borderRadius) * 1.5,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: ({ theme }) => ({
            borderRadius: Number(theme.shape.borderRadius) * 1.5,
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: Number(theme.shape.borderRadius) * 1.5,
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
    },
  })
}
