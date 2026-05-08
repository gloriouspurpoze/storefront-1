import React, { useState } from 'react'
import { NotificationsProvider } from '../../contexts/notifications-context'
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
  const { isOpen: sidebarExpanded } = useSidebar()
  const drawerOffsetPx = sidebarExpanded ? DRAWER_WIDTH_EXPANDED_PX : DRAWER_WIDTH_COLLAPSED_PX

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <NotificationsProvider>
    <div className="flex min-h-screen w-full">
      <Header onMenuClick={handleDrawerToggle} />
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
      <main
        className="flex-1 w-full min-h-[calc(100vh-48px)] bg-background p-3 transition-[margin,width] duration-200 ease-out sm:p-4 md:ml-[var(--drawer-w)] md:w-[calc(100%-var(--drawer-w))]"
        style={
          {
            marginTop: APP_BAR_HEIGHT_PX,
            ['--drawer-w' as string]: `${drawerOffsetPx}px`,
          } as React.CSSProperties
        }
        aria-label="Main"
      >
        <AppBreadcrumbs />
        {children}
      </main>
    </div>
    </NotificationsProvider>
  )
}
