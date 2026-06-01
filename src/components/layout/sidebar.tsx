import React, { useState, useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard as DashboardIcon,
  Wrench as WrenchIcon,
  DollarSign as DollarSignIcon,
  Calendar as CalendarIcon,
  User as PersonIcon,
  MessageSquare as MessageIcon,
  MessageCircle as ChatIcon,
  Settings as SettingsIcon,
  ChevronUp as ExpandLess,
  ChevronDown as ExpandMore,
  LifeBuoy as SupportIcon,
  Star as StarIcon,
  FileText as DescriptionIcon,
  History as HistoryIcon,
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { setChatUnreadMessages } from '../../store/slices/chatInboxSlice'
import { ChatService } from '../../services/api/chat.service'
import { usePermissions } from '../../hooks/usePermissions'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useSidebar } from '../../contexts/sidebar-context'
import { cn } from '../../lib/utils'
import { SAAS_MODE } from '../../lib/saasEnv'
import { SaasTenantIndicator } from './SaasTenantIndicator'
import {
  APP_BAR_HEIGHT_PX,
  DRAWER_WIDTH_COLLAPSED_PX,
  DRAWER_WIDTH_EXPANDED_PX,
} from './layout-constants'
import { readSidebarRecent, upsertSidebarRecent, type SidebarRecentEntry } from '../../lib/sidebarRecent'
import { buildFilteredAdminNavigationGroups } from '../../lib/buildAdminSidebar'
import { normalizeVerticalKey } from '../../verticals/core/types'

const drawerWidth = DRAWER_WIDTH_EXPANDED_PX
const collapsedDrawerWidth = DRAWER_WIDTH_COLLAPSED_PX

/** Paths that are hub landing pages â€” avoid treating `/cms`, `/users`, etc. as prefixes of sibling routes. */
const NAV_EXACT_ONLY_HREFS = new Set<string>([
  '/',
  '/cms',
  '/crm',
  '/users',
  '/users/customers',
  '/team-work',
  '/support',
  '/marketing',
  '/settings',
  '/settings/saas',
  '/settings/tenants',
  '/cms/category-marketing',
  '/knowledge-kit',
])

/** Sidebar badge text; numeric badges cap at 99+ (avoids layout break). */
function formatSidebarBadgeValue(badge: string | number | null | undefined): string | null {
  if (badge == null || badge === '') return null
  if (typeof badge === 'number') {
    if (badge <= 0) return null
    return badge > 99 ? '99+' : String(badge)
  }
  const s = String(badge)
  if (/^\d+$/.test(s)) {
    const n = Number(s)
    if (n <= 0) return null
    return n > 99 ? '99+' : s
  }
  return s
}

function routeMatchesNav(href: string, pathname: string, search: string = ''): boolean {
  const [hrefPath, hrefQuery] = href.split('?')
  const q = search.startsWith('?') ? search.slice(1) : search

  if (hrefQuery) {
    if (pathname !== hrefPath) return false
    const want = new URLSearchParams(hrefQuery)
    const have = new URLSearchParams(q)
    return Array.from(want.entries()).every(([k, v]) => have.get(k) === v)
  }

  if (hrefPath === '/cms/category-marketing') {
    if (pathname !== hrefPath) return false
    const have = new URLSearchParams(q)
    const tab = have.get('tab')
    return tab == null || tab === '' || tab === 'landing'
  }

  if (pathname === hrefPath) return true
  if (NAV_EXACT_ONLY_HREFS.has(hrefPath)) return false
  return pathname.startsWith(`${hrefPath}/`)
}

/**
 * Provider Navigation Menu - For Service Providers
 */
const providerNavigationGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/provider/dashboard', icon: DashboardIcon },
    ]
  },
  {
    title: 'My Work',
    items: [
      { name: 'My Bookings', href: '/provider/bookings', icon: CalendarIcon },
      { name: 'My Earnings', href: '/provider/earnings', icon: DollarSignIcon },
      { name: 'My Profile', href: '/provider/profile', icon: PersonIcon },
    ]
  },
  {
    title: 'Support',
    items: [
      { name: 'Messages', href: '/messages', icon: MessageIcon },
      { name: 'Help & Support', href: '/support', icon: SupportIcon },
    ]
  }
]

/**
 * Professional Navigation Menu - For Individual Professionals
 */
const professionalNavigationGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/professional/dashboard', icon: DashboardIcon },
    ]
  },
  {
    title: 'My Work',
    items: [
      { name: 'My Bookings', href: '/professional/bookings', icon: CalendarIcon },
      { name: 'My Earnings', href: '/professional/earnings', icon: DollarSignIcon },
      { name: 'My Services', href: '/professional/services', icon: WrenchIcon },
      { name: 'My Profile', href: '/professional/profile', icon: PersonIcon },
    ]
  },
  {
    title: 'Communication',
    items: [
      { name: 'Chat', href: '/chat', icon: ChatIcon },
      { name: 'Messages', href: '/messages', icon: MessageIcon },
    ]
  },
  {
    title: 'Professional',
    items: [
      { name: 'Reviews & Ratings', href: '/professional/reviews', icon: StarIcon },
      { name: 'Documents', href: '/professional/documents', icon: DescriptionIcon },
    ]
  },
  {
    title: 'Settings',
    items: [
      { name: 'Settings', href: '/professional/settings', icon: SettingsIcon },
      { name: 'Help & Support', href: '/support', icon: SupportIcon },
    ]
  }
]

interface SidebarItem {
  name: string
  href?: string
  icon: React.ElementType
  permissions?: string[]
  hasSubmenu?: boolean
  subItems?: SidebarSubItem[]
  badge?: string | number | null
}

interface SidebarSubItem {
  name: string
  href: string
  icon: React.ElementType
  permissions?: string[]
}

interface SidebarGroup {
  title: string
  icon?: React.ElementType
  items: SidebarItem[]
}

function flattenSidebarNav(groups: SidebarGroup[]): { href: string; name: string; icon: React.ElementType }[] {
  const out: { href: string; name: string; icon: React.ElementType }[] = []
  for (const g of groups) {
    for (const item of g.items) {
      if (item.hasSubmenu && item.subItems?.length) {
        for (const sub of item.subItems) {
          out.push({ href: sub.href, name: sub.name, icon: sub.icon })
        }
      } else if (item.href) {
        out.push({ href: item.href, name: item.name, icon: item.icon })
      }
    }
  }
  return out
}

function pickBestNavMatch(
  items: { href: string; name: string }[],
  pathname: string,
  search: string,
): { href: string; name: string } | null {
  let best: { href: string; name: string; score: number } | null = null
  for (const item of items) {
    if (!routeMatchesNav(item.href, pathname, search)) continue
    const path = item.href.split('?')[0]
    let score = path.length
    if (pathname === path) score += 10_000
    if (item.href.includes('?')) score += 500
    score += path.split('/').filter(Boolean).length * 10
    if (!best || score > best.score) {
      best = { href: item.href, name: item.name, score }
    }
  }
  if (!best) return null
  return { href: best.href, name: best.name }
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

/**
 * Admin drawer visibility uses the same pathâ†’permission resolution as in-app navigation guards
 * (`routePermissions` via {@link usePermissions}, including explicit scoped admins).
 */
function filterAdminNavigationByRouteAccess(
  groups: SidebarGroup[],
  checkRouteAccess: (path: string) => boolean,
): SidebarGroup[] {
  return groups
    .map((group) => {
      const items = group.items
        .map((item): SidebarItem | null => {
          if (item.hasSubmenu && item.subItems?.length) {
            const subItems = item.subItems.filter((sub) => checkRouteAccess(sub.href.split('?')[0]))
            if (subItems.length === 0) return null
            return { ...item, subItems }
          }
          if (item.href) {
            return checkRouteAccess(item.href) ? item : null
          }
          return null
        })
        .filter((item): item is SidebarItem => item !== null)
      return { ...group, items }
    })
    .filter((g) => g.items.length > 0)
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 899px)')
  const { isOpen: sidebarOpen } = useSidebar()
  const dispatch = useAppDispatch()
  const authState = useAppSelector((state) => state.auth)
  const chatUnread = useAppSelector((state) => state.chatInbox?.unreadMessages ?? 0)
  const user = authState?.user || null
  const tenantVerticalKey = useAppSelector((s) => normalizeVerticalKey(s.tenant.verticalKey))
  const tenantFeatureModules = useAppSelector((s) => s.tenant.featureModules)
  const { checkRouteAccess } = usePermissions()
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({})
  // Sidebar group collapse state. Default: every group is OPEN.
  // We persist user toggles in localStorage so collapses survive page navigation /
  // reload, but the default for any group the user hasn't touched is always open.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem('admin.sidebar.groups')
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
    } catch {
      return {}
    }
  })

  const isGroupOpen = React.useCallback(
    (title: string) => (title in openGroups ? !!openGroups[title] : true),
    [openGroups],
  )

  const handleGroupToggle = React.useCallback((title: string, next: boolean) => {
    setOpenGroups((prev) => {
      const updated = { ...prev, [title]: next }
      try {
        window.localStorage.setItem('admin.sidebar.groups', JSON.stringify(updated))
      } catch {
        /* ignore quota */
      }
      return updated
    })
  }, [])

  const canPollChatUnread = Boolean(authState?.token) && checkRouteAccess('/chat')

  useEffect(() => {
    if (!canPollChatUnread) return
    let cancelled = false
    const sync = async () => {
      try {
        const r = await ChatService.getUnreadCount()
        if (cancelled || !r.success || r.data == null) return
        const d = r.data as { messages?: number }
        dispatch(setChatUnreadMessages(d.messages ?? 0))
      } catch {
        /* non-fatal */
      }
    }
    void sync()
    const id = window.setInterval(sync, 45_000)
    const onFocus = () => {
      if (document.visibilityState === 'visible') void sync()
    }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [canPollChatUnread, dispatch])

  // Determine user role
  const isProvider = 
    user?.role?.name === 'provider' || 
    user?.role === 'provider' ||
    (user as any)?.userType === 'provider'
  
  const isProfessional =
    user?.role?.name === 'professional' ||
    (user as any)?.userType === 'professional'

  const isPlatformOperator = useMemo(() => {
    if (!user) return false
    const hasOrg = Boolean(user.tenant?.id)
    return (user.userType === 'super_admin' || user.userType === 'admin') && !hasOrg
  }, [user])

  // Select appropriate navigation
  const activeNavigationGroups = useMemo((): SidebarGroup[] => {
    if (isProfessional) {
      return professionalNavigationGroups as SidebarGroup[]
    }
    if (isProvider) {
      return providerNavigationGroups as SidebarGroup[]
    }
    const built = buildFilteredAdminNavigationGroups({
      verticalKey: tenantVerticalKey,
      featureModules: tenantFeatureModules,
      isPlatformOperator,
    })
    return filterAdminNavigationByRouteAccess(built, checkRouteAccess)
  }, [
    isProvider,
    isProfessional,
    checkRouteAccess,
    tenantVerticalKey,
    tenantFeatureModules,
    isPlatformOperator,
  ])

  const recentUserKey = user?.id ?? 'anon'
  const flatNav = useMemo(
    () => flattenSidebarNav(activeNavigationGroups),
    [activeNavigationGroups],
  )
  const recentMetaByHref = useMemo(() => new Map(flatNav.map((f) => [f.href, f])), [flatNav])

  const [recentSnapshot, setRecentSnapshot] = useState<SidebarRecentEntry[]>([])

  useEffect(() => {
    setRecentSnapshot(readSidebarRecent(recentUserKey))
  }, [recentUserKey])

  useEffect(() => {
    const match = pickBestNavMatch(flatNav, location.pathname, location.search)
    if (!match) return
    upsertSidebarRecent(recentUserKey, match.href, match.name)
    setRecentSnapshot(readSidebarRecent(recentUserKey))
  }, [location.pathname, location.search, flatNav, recentUserKey])

  const recentForDisplay = useMemo(() => {
    const allowed = new Set(flatNav.map((f) => f.href))
    return recentSnapshot
      .filter((r) => allowed.has(r.href))
      .filter((r) => !routeMatchesNav(r.href, location.pathname, location.search))
      .slice(0, 5)
  }, [recentSnapshot, flatNav, location.pathname, location.search])

  // Auto-open submenu if current path matches (only for nav the user is allowed to see)
  React.useEffect(() => {
    const currentPath = location.pathname
    const currentSearch = location.search
    activeNavigationGroups.forEach((group) => {
      group.items.forEach((item: SidebarItem) => {
        if (item.hasSubmenu && item.subItems) {
          const hasActiveSubItem = item.subItems.some((sub: SidebarSubItem) =>
            routeMatchesNav(sub.href, currentPath, currentSearch),
          )
          if (hasActiveSubItem) {
            setOpenSubmenus((prev) => ({ ...prev, [item.name]: true }))
          }
        }
      })
    })
  }, [location.pathname, location.search, activeNavigationGroups])

  const handleSubmenuToggle = (menuName: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }))
  }

  const railW = sidebarOpen ? drawerWidth : collapsedDrawerWidth

  const linkBase = (isActive: boolean) =>
    cn(
      'group flex min-h-[38px] w-full items-center gap-2 rounded-md border-l-[3px] text-left text-sm transition-colors',
      isActive
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-transparent text-foreground hover:border-muted-foreground/30 hover:bg-muted/50',
      sidebarOpen ? 'mx-0.5 px-2' : 'mx-0.5 justify-center px-0',
    )

  const subLinkBase = (isSubActive: boolean) =>
    cn(
      'mb-0.5 flex min-h-[34px] w-full items-center gap-2 rounded-md px-2 text-sm transition-colors',
      isSubActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50',
    )

  const renderNavIcon = (
    Icon: React.ElementType,
    isActive: boolean,
    small?: boolean,
  ) => <Icon className={cn(small ? 'h-3.5 w-3.5' : 'h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />

  const drawerContent = (
    <div
      className="flex h-full w-full min-w-0 flex-col border-r border-border/80 bg-card"
      style={{ width: railW }}
    >
      <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden py-2" aria-label="Main">
        {sidebarOpen && recentForDisplay.length > 0 && (
          <div
            className="mb-3 space-y-0.5 border-b border-border/60 pb-3"
            role="region"
            aria-label="Recently visited"
          >
            <p className="flex items-center gap-1.5 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
              <HistoryIcon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
              Recent
            </p>
            <ul className="px-0.5">
              {recentForDisplay.map((r) => {
                const meta = recentMetaByHref.get(r.href)
                if (!meta) return null
                const Icon = meta.icon
                const isRecentActive = routeMatchesNav(r.href, location.pathname, location.search)
                const navBadgeRaw =
                  r.href === '/chat' ? (chatUnread > 0 ? chatUnread : null) : null
                const navBadgeLabel = formatSidebarBadgeValue(navBadgeRaw)
                return (
                  <li key={r.href} className="list-none">
                    <Link
                      to={r.href}
                      onClick={isMobile ? onClose : undefined}
                      className={linkBase(isRecentActive)}
                      title={r.name}
                    >
                      <span className="relative flex w-8 shrink-0 items-center justify-center">
                        {navBadgeLabel != null && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
                            {navBadgeLabel}
                          </span>
                        )}
                        {renderNavIcon(Icon, isRecentActive)}
                      </span>
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          isRecentActive ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        {r.name}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {activeNavigationGroups.map((group, groupIndex) => {
          const rows = group.items.map((item: SidebarItem) => {
            const isActive = Boolean(
              (!!item.href && routeMatchesNav(item.href, location.pathname, location.search)) ||
                (!!item.hasSubmenu &&
                  item.subItems?.some((sub) => routeMatchesNav(sub.href, location.pathname, location.search))),
            )
            const hasSubmenu = item.hasSubmenu
            const isSubmenuOpen = openSubmenus[item.name] || false
            const Icon = item.icon
            const navBadgeRaw =
              item.href === '/chat' ? (chatUnread > 0 ? chatUnread : null) : item.badge
            const navBadgeLabel = formatSidebarBadgeValue(navBadgeRaw)

            const mainCell = hasSubmenu ? (
              <button
                type="button"
                className={linkBase(isActive)}
                onClick={() => handleSubmenuToggle(item.name)}
                title={!sidebarOpen ? item.name : undefined}
              >
                <span className="relative flex w-8 shrink-0 items-center justify-center">
                  {navBadgeLabel != null && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
                      {navBadgeLabel}
                    </span>
                  )}
                  {renderNavIcon(Icon, isActive)}
                </span>
                {sidebarOpen && (
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-1">
                    <span className={cn('truncate', isActive ? 'font-semibold' : 'font-medium')}>{item.name}</span>
                    {isSubmenuOpen ? (
                      <ExpandLess className="h-4 w-4 shrink-0" />
                    ) : (
                      <ExpandMore className="h-4 w-4 shrink-0" />
                    )}
                  </span>
                )}
              </button>
            ) : (
              <Link
                to={item.href!}
                onClick={isMobile ? onClose : undefined}
                className={linkBase(isActive)}
                title={!sidebarOpen ? item.name : undefined}
              >
                <span className="relative flex w-8 shrink-0 items-center justify-center">
                  {navBadgeLabel != null && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
                      {navBadgeLabel}
                    </span>
                  )}
                  {renderNavIcon(Icon, isActive)}
                </span>
                {sidebarOpen && (
                  <span className={cn('min-w-0 flex-1 truncate', isActive ? 'font-semibold' : 'font-medium')}>
                    {item.name}
                  </span>
                )}
              </Link>
            )

            return (
              <li key={item.name} className="list-none">
                {mainCell}
                {hasSubmenu && isSubmenuOpen && sidebarOpen && item.subItems && (
                  <ul className="mt-0.5 space-y-0.5 pl-2.5 pr-0.5">
                    {item.subItems.map((subItem: SidebarSubItem) => {
                      const isSubActive = routeMatchesNav(subItem.href, location.pathname, location.search)
                      const SIcon = subItem.icon
                      return (
                        <li key={subItem.name} className="list-none">
                          <Link
                            to={subItem.href}
                            onClick={isMobile ? onClose : undefined}
                            className={subLinkBase(isSubActive)}
                          >
                            {renderNavIcon(SIcon, isSubActive, true)}
                            <span className={cn('flex-1 truncate', isSubActive ? 'font-semibold' : 'font-normal')}>
                              {subItem.name}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })

          return (
            <div
              key={group.title}
              className={cn(!sidebarOpen && groupIndex < activeNavigationGroups.length - 1 && 'mb-1.5')}
            >
              {sidebarOpen ? (
                <details
                  className="group/section mb-1 border-b border-border/50 pb-2 last:border-b-0"
                  open={isGroupOpen(group.title)}
                  onToggle={(e) =>
                    handleGroupToggle(group.title, (e.target as HTMLDetailsElement).open)
                  }
                >
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground [&::-webkit-details-marker]:hidden">
                    {group.icon ? (
                      <group.icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{group.title}</span>
                    <ExpandMore
                      className="h-3.5 w-3.5 shrink-0 opacity-70 transition-transform group-open/section:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <ul className="space-y-0.5 px-0.5 pt-1">{rows}</ul>
                </details>
              ) : (
                <ul className="space-y-0.5 px-0.5">{rows}</ul>
              )}
            </div>
          )
        })}
      </nav>

      {SAAS_MODE && (
        <div className="shrink-0 border-t border-border/60 p-1.5 pb-2">
          <SaasTenantIndicator variant="sidebar" sidebarOpen={sidebarOpen} />
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <>
        {open && (
          <div
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
            role="button"
            tabIndex={-1}
            onClick={onClose}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            aria-label="Close menu"
          />
        )}
        <aside
          className={cn(
            'fixed left-0 top-0 z-[70] h-full w-[min(100%,var(--sw))] max-w-full transform border-r border-border bg-card shadow-xl transition-transform duration-200 ease-out md:hidden',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
          style={{ ['--sw' as string]: `${drawerWidth}px` } as React.CSSProperties}
        >
          {drawerContent}
        </aside>
      </>
    )
  }

  return (
    <aside
      className="fixed z-30 hidden h-[calc(100vh-48px)] min-h-0 overflow-y-auto overflow-x-hidden border-r border-border bg-card transition-[width] duration-200 ease-in-out md:left-0 md:top-12 md:block"
      style={{
        width: railW,
        top: APP_BAR_HEIGHT_PX,
      }}
    >
      {drawerContent}
    </aside>
  )
}
