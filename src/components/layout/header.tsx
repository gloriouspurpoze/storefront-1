import React from 'react'
import {
  Menu,
  Search,
  Moon,
  Sun,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import { useTheme as useCustomTheme } from '../../contexts/theme-context'
import { useCommandPalette } from '../../contexts/command-palette-context'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { logout } from '../../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { NotificationBell } from '../notifications/NotificationBell'
import { useSidebar } from '../../contexts/sidebar-context'
import { SaasTenantIndicator } from './SaasTenantIndicator'
import { APP_BAR_HEIGHT_PX } from './layout-constants'
import { useMediaQuery, muiMdUp } from '../../hooks/useMediaQuery'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const isDesktop = useMediaQuery(muiMdUp)
  const { isDarkMode, toggleTheme } = useCustomTheme()
  const authState = useAppSelector((state) => state.auth)
  const user = authState?.user || null
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { toggleSidebar } = useSidebar()
  const { openPalette } = useCommandPalette()
  const jumpHint =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      ? '⌘K'
      : 'Ctrl+K'

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-card text-foreground shadow-sm"
      style={{ height: APP_BAR_HEIGHT_PX }}
    >
      <div
        className="mx-auto flex h-full max-w-full items-center px-2 sm:px-3"
        style={{ minHeight: APP_BAR_HEIGHT_PX }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mr-2 text-foreground md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mr-2 hidden text-foreground md:inline-flex"
          onClick={() => toggleSidebar()}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center">
          {isDesktop && (
            <div className="min-w-0 max-w-sm flex-1 pr-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  readOnly
                  placeholder={`Jump to page… (${jumpHint})`}
                  className="h-8 cursor-pointer bg-muted/50 pl-8 text-xs"
                  onFocus={openPalette}
                  onClick={openPalette}
                  aria-label="Open quick navigation"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mr-1 hidden items-center md:flex">
          <SaasTenantIndicator variant="header" />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="text-foreground"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <NotificationBell />

          {!isDesktop && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={openPalette}
              aria-label="Open quick navigation"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          <div className="ml-1 flex items-center gap-2 sm:ml-2">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0"
                  aria-label="Account menu"
                >
                  <Avatar className="h-7 w-7 text-xs">
                    {user?.profilePicture && <AvatarImage src={user.profilePicture} alt="" />}
                    <AvatarFallback>
                      {[user?.firstName?.[0], user?.lastName?.[0]]
                        .filter(Boolean)
                        .join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-1 p-0 font-normal">
                  <div className="border-b border-border p-2">
                    <p className="text-sm font-semibold">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {user?.userType && (
                      <p className="text-xs font-medium text-primary">{user.userType.toUpperCase()}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    void navigate('/settings')
                  }}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void navigate('/settings')
                  }}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
