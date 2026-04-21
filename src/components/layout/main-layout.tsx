import React, { useState } from 'react'
import { Box, useTheme } from '@mui/material'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { AppBreadcrumbs } from './AppBreadcrumbs'
import { useSidebar } from '../../contexts/sidebar-context'
import {
  APP_BAR_HEIGHT_PX,
  DRAWER_WIDTH_COLLAPSED_PX,
  DRAWER_WIDTH_EXPANDED_PX,
} from './layout-constants'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useTheme()
  const { isOpen: sidebarExpanded } = useSidebar()
  const drawerOffsetPx = sidebarExpanded ? DRAWER_WIDTH_EXPANDED_PX : DRAWER_WIDTH_COLLAPSED_PX

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <Header onMenuClick={handleDrawerToggle} />

      {/* Sidebar */}
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: {
            md: `calc(100% - ${drawerOffsetPx}px)`,
          },
          ml: {
            md: `${drawerOffsetPx}px`,
          },
          mt: `${APP_BAR_HEIGHT_PX}px`,
          backgroundColor: 'background.default',
          minHeight: `calc(100vh - ${APP_BAR_HEIGHT_PX}px)`,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <AppBreadcrumbs />
        {children}
      </Box>
    </Box>
  )
}