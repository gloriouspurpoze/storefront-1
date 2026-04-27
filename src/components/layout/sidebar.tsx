import React, { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard as DashboardIcon,
  Package as PackageIcon,
  Package2 as InventoryIcon,
  Wrench as WrenchIcon,
  ClipboardList as FileTextIcon,
  IdCard as AssignmentIndIcon,
  DollarSign as DollarSignIcon,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  BarChart2 as BarChartIcon,
  LineChart as AssessmentIcon,
  Cloud as CloudIcon,
  MessageSquare as MessageIcon,
  MessageCircle as ChatIcon,
  ShoppingCart as ShoppingCartIcon,
  Settings as SettingsIcon,
  SlidersHorizontal as TuneIcon,
  Home as HomeIcon,
  ChevronUp as ExpandLess,
  ChevronDown as ExpandMore,
  Building2 as BusinessIcon,
  LifeBuoy as SupportIcon,
  Bell as NotificationsIcon,
  User as PersonIcon,
  Tag as CategoryIcon,
  Images as SlideshowIcon,
  Tag as CouponIcon,
  Tag as LocalOfferIcon,
  Share2 as ReferralIcon,
  Globe as WebIcon,
  Image as ImageIcon,
  Star as StarIcon,
  HelpCircle as HelpIcon,
  Search as SearchIcon,
  FileText as DescriptionIcon,
  BookOpen as ArticleIcon,
  Image as MediaIcon,
  Menu as MenusIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  Landmark as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Link2 as LinkIcon,
  Megaphone as CampaignIcon,
  Store as StorefrontIcon,
  ShoppingBag as ShoppingBagIcon,
  Briefcase as BusinessCenterIcon,
  UserSearch as PersonSearchIcon,
  Handshake as HandshakeIcon,
  ListTodo as AssignmentIcon,
  ListChecks as RateReviewIcon,
  BadgeCheck as VerifiedUserIcon,
} from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
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

const drawerWidth = DRAWER_WIDTH_EXPANDED_PX
const collapsedDrawerWidth = DRAWER_WIDTH_COLLAPSED_PX

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
    title: 'Professional',
    items: [
      { name: 'Reviews & Ratings', href: '/professional/reviews', icon: StarIcon },
      { name: 'Documents', href: '/professional/documents', icon: DescriptionIcon },
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
    title: 'Settings',
    items: [
      { name: 'Settings', href: '/professional/settings', icon: SettingsIcon },
      { name: 'Help & Support', href: '/support', icon: SupportIcon },
    ]
  }
]

/**
 * Enhanced Navigation Menu Structure
 * Improved organization with better visual hierarchy
 */
const navigationGroups = [
  {
    title: 'Overview',
    icon: DashboardIcon,
    items: [
      { name: 'Dashboard', href: '/', icon: DashboardIcon, permissions: [], badge: null },
      { name: 'Analytics', href: '/analytics', icon: BarChartIcon, permissions: ['view_analytics'], badge: null },
    ]
  },
  {
    title: 'CRM',
    icon: BusinessCenterIcon,
    items: [
      { name: 'CRM overview', href: '/crm', icon: BusinessCenterIcon, permissions: ['view_crm'], badge: null },
      { name: 'Leads', href: '/crm/leads', icon: PersonSearchIcon, permissions: ['view_crm'], badge: null },
      { name: 'Contacts', href: '/crm/contacts', icon: UsersIcon, permissions: ['view_crm'], badge: null },
      { name: 'Companies', href: '/crm/companies', icon: BusinessIcon, permissions: ['view_crm'], badge: null },
      { name: 'Deals', href: '/crm/deals', icon: HandshakeIcon, permissions: ['view_crm'], badge: null },
      { name: 'Activities', href: '/crm/activities', icon: AssignmentIcon, permissions: ['view_crm'], badge: null },
      { name: 'CRM settings', href: '/crm/settings', icon: TuneIcon, permissions: ['view_crm'], badge: null },
    ]
  },
  {
    title: 'Catalog',
    icon: PackageIcon,
    items: [
      { name: 'Product categories', href: '/categories/products', icon: InventoryIcon, permissions: ['view_categories', 'manage_categories'], badge: null },
      { name: 'Service categories', href: '/categories/services', icon: WrenchIcon, permissions: ['view_categories', 'manage_categories'], badge: null },
      { name: 'Platform services', href: '/platform-services', icon: HomeIcon, permissions: ['view_services', 'manage_services'], badge: null },
      {
        name: 'Marketplace',
        href: '/marketplace',
        icon: StorefrontIcon,
        permissions: [
          'view_services',
          'view_categories',
          'view_bookings',
          'view_providers',
          'view_payments',
          'manage_coupons',
          'manage_system_settings',
        ],
        badge: null,
      },
      // { name: 'Products', href: '/products', icon: PackageIcon, permissions: ['view_products', 'manage_products'], badge: null },
      // { name: 'Providers', href: '/providers', icon: ShieldIcon, permissions: ['view_providers', 'manage_providers'], badge: null },
      { name: 'Professionals', href: '/professionals', icon: PersonIcon, permissions: ['view_providers', 'manage_providers'], badge: null },
      { name: 'Provider Applications', href: '/provider-applications', icon: AssignmentIndIcon, permissions: ['view_providers', 'manage_providers'], badge: null },
    ]
  },
  {
    title: 'E-commerce',
    icon: ShoppingBagIcon,
    items: [
      {
        name: 'Store overview',
        href: '/ecommerce',
        icon: ShoppingBagIcon,
        permissions: [
          'view_products',
          'create_products',
          'view_categories',
          'view_orders',
          'manage_coupons',
          'manage_system_settings',
          'view_settings',
        ],
        badge: null,
      },
      { name: 'Products', href: '/products', icon: PackageIcon, permissions: ['view_products'], badge: null },
      {
        name: 'Inventory',
        href: '/inventory',
        icon: InventoryIcon,
        permissions: ['view_products', 'edit_products', 'manage_product_inventory'],
        badge: null,
      },
      { name: 'Orders', href: '/orders', icon: ShoppingCartIcon, permissions: ['view_orders'], badge: null },
    ]
  },
  {
    title: 'Bazaar',
    icon: StorefrontIcon,
    items: [
      {
        name: 'Offers & listing chats',
        href: '/bazaar',
        icon: HandshakeIcon,
        permissions: [
          'view_products',
          'create_products',
          'view_categories',
          'view_orders',
          'manage_coupons',
          'manage_system_settings',
          'view_settings',
        ],
        badge: null,
      },
      {
        name: 'Listing review',
        href: '/bazaar/listing-review',
        icon: RateReviewIcon,
        permissions: [
          'view_products',
          'create_products',
          'view_categories',
          'view_orders',
          'manage_coupons',
          'manage_system_settings',
          'view_settings',
        ],
        badge: null,
      },
      {
        name: 'Pro-Verify queue',
        href: '/bazaar/pro-verify',
        icon: VerifiedUserIcon,
        permissions: [
          'view_products',
          'create_products',
          'view_categories',
          'view_orders',
          'manage_coupons',
          'manage_system_settings',
          'view_settings',
        ],
        badge: null,
      },
    ]
  },
  {
    title: 'Operations',
    icon: ShoppingCartIcon,
    items: [
      // { name: 'Orders', href: '/orders', icon: ShoppingCartIcon, permissions: ['view_orders', 'manage_orders'], badge: null },
      { name: 'Bookings', href: '/bookings', icon: CalendarIcon, permissions: ['view_bookings', 'manage_bookings'], badge: null },
      // { name: 'Service Requests', href: '/requests', icon: FileTextIcon, permissions: ['view_bookings', 'manage_bookings'], badge: null },
      // { name: 'Quotes', href: '/quotes', icon: DollarSignIcon, permissions: ['view_bookings', 'manage_bookings'], badge: null },
      { name: 'Payments', href: '/payments', icon: CreditCardIcon, permissions: ['view_payments', 'manage_payments'], badge: null },
      { name: 'Invoices', href: '/invoices', icon: ReceiptIcon, permissions: ['view_payments', 'manage_payments'], badge: null },
      { name: 'Earnings & Payouts', href: '/payouts', icon: AccountBalanceIcon, permissions: ['view_payments', 'manage_payments'], badge: null },
      { name: 'Chat', href: '/chat', icon: ChatIcon, permissions: ['view_messages'], badge: 'new' },
    ]
  },
  {
    title: 'Content & Marketing',
    icon: WebIcon,
    items: [
      { 
        name: 'Website content', 
        icon: WebIcon, 
        hasSubmenu: true,
        permissions: ['view_cms', 'manage_cms'],
        badge: null,
        subItems: [
          { name: 'CMS overview', href: '/cms', icon: WebIcon, permissions: ['view_cms'] },
          { name: 'Homepage', href: '/cms/homepage', icon: HomeIcon, permissions: ['manage_cms'] },
          { name: 'Pages', href: '/cms/pages', icon: DescriptionIcon, permissions: ['manage_cms'] },
          { name: 'Menus', href: '/cms/menus', icon: MenusIcon, permissions: ['manage_cms'] },
          { name: 'Blog posts', href: '/cms/blogs', icon: ArticleIcon, permissions: ['manage_cms'] },
          { name: 'Blog categories', href: '/cms/blog-categories', icon: CategoryIcon, permissions: ['manage_cms'] },
        ]
      },
      { 
        name: 'Marketing', 
        icon: CouponIcon, 
        hasSubmenu: true,
        permissions: ['view_cms', 'manage_cms', 'manage_marketing'],
        badge: null,
        subItems: [
          { name: 'Banners & Sliders', href: '/sliders', icon: SlideshowIcon, permissions: ['manage_cms'] },
          { name: 'Announcements & Pop-ups', href: '/cms/banners', icon: SlideshowIcon, permissions: ['manage_cms'] },
          { name: 'Promotions', href: '/cms/promotions', icon: CouponIcon, permissions: ['manage_marketing'] },
          { name: 'Coupons', href: '/coupons', icon: LocalOfferIcon, permissions: ['manage_marketing'] },
          { name: 'Referrals', href: '/referrals', icon: ReferralIcon, permissions: ['manage_marketing'] },
          { name: 'Newsletter', href: '/cms/newsletter', icon: CampaignIcon, permissions: ['manage_cms'] },
          { name: 'Social Links', href: '/cms/social-links', icon: LinkIcon, permissions: ['manage_cms'] },
        ]
      },
      { name: 'Testimonials', href: '/cms/testimonials', icon: StarIcon, permissions: ['manage_cms'], badge: null },
      { name: 'Reviews', href: '/cms/reviews', icon: StarIcon, permissions: ['manage_cms'], badge: null },
      { name: 'FAQs', href: '/cms/faqs', icon: HelpIcon, permissions: ['manage_cms'], badge: null },
      { name: 'Rate Card', href: '/cms/rate-card', icon: ReceiptIcon, permissions: ['manage_cms'], badge: null },
      { name: 'Industry service pages', href: '/cms/category-marketing', icon: CampaignIcon, permissions: ['manage_cms'], badge: null },
      { name: 'Cross-Linking', href: '/cms/cross-linking', icon: LinkIcon, permissions: ['manage_cms'], badge: null },
      { name: 'Media Library', href: '/cms/media', icon: MediaIcon, permissions: ['manage_cms'], badge: null },
      { name: 'SEO Management', href: '/cms/seo', icon: SearchIcon, permissions: ['manage_cms'], badge: null },
    ]
  },
  {
    title: 'Users & Communication',
    icon: UsersIcon,
    items: [
      { name: 'Users', href: '/users', icon: UsersIcon, permissions: ['view_users', 'manage_users'], badge: null },
      // { name: 'Messages', href: '/messages', icon: MessageIcon, permissions: ['view_messages'], badge: null },
      { name: 'Notifications', href: '/notifications', icon: NotificationsIcon, permissions: ['view_notifications', 'manage_notifications'], badge: null },
    ]
  },
  {
    title: 'System',
    icon: SettingsIcon,
    items: [
      { name: 'Reports', href: '/reports', icon: AssessmentIcon, permissions: ['view_reports'], badge: null },
      { name: 'System Status', href: '/system-status', icon: CloudIcon, permissions: ['view_system_status'], badge: null },
      { name: 'Settings', href: '/settings', icon: SettingsIcon, permissions: ['manage_settings'], badge: null },
      { name: 'Help & Support', href: '/support', icon: SupportIcon, permissions: [], badge: null },
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

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 899px)')
  const { isOpen: sidebarOpen } = useSidebar()
  const authState = useAppSelector((state) => state.auth)
  const user = authState?.user || null
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({})

  /**
   * Check if user has permission to view a menu item
   */
  const hasPermission = (requiredPermissions?: string[]): boolean => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    if (user?.userType === 'super_admin' || user?.userType === 'admin') {
      return true
    }

    const userPermissions = user?.permissions || []
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    )
  }

  /**
   * Filter navigation groups to only show items user has permission for
   */
  const filterNavigationByPermissions = (groups: SidebarGroup[]): SidebarGroup[] => {
    return groups.map(group => ({
      ...group,
      items: group.items.filter((item: SidebarItem) => {
        if (!hasPermission(item.permissions)) {
          return false
        }

        if (item.hasSubmenu && item.subItems) {
          item.subItems = item.subItems.filter((subItem: SidebarSubItem) => 
            hasPermission(subItem.permissions)
          )
          return item.subItems.length > 0
        }

        return true
      })
    })).filter(group => group.items.length > 0)
  }

  // Determine user role
  const isProvider = 
    user?.role?.name === 'provider' || 
    user?.role === 'provider' ||
    (user as any)?.userType === 'provider'
  
  const isProfessional =
    user?.role?.name === 'professional' ||
    (user as any)?.userType === 'professional'
  
  // Select appropriate navigation
  const activeNavigationGroups = useMemo((): SidebarGroup[] => {
    if (isProfessional) {
      return professionalNavigationGroups as SidebarGroup[]
    }
    if (isProvider) {
      return providerNavigationGroups as SidebarGroup[]
    }
    return filterNavigationByPermissions(navigationGroups)
  }, [isProvider, isProfessional, user])

  // Auto-open submenu if current path matches
  React.useEffect(() => {
    const currentPath = location.pathname
    navigationGroups.forEach(group => {
      group.items.forEach((item: SidebarItem) => {
        if ((item as SidebarItem).hasSubmenu && (item as SidebarItem).subItems) {
          const subItems = (item as SidebarItem).subItems!
          const hasActiveSubItem = subItems.some((sub: SidebarSubItem) => sub.href === currentPath)
          if (hasActiveSubItem) {
            setOpenSubmenus(prev => ({ ...prev, [item.name]: true }))
          }
        }
      })
    })
  }, [location.pathname])

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
        {activeNavigationGroups.map((group, groupIndex) => (
          <div
            key={group.title}
            className={cn(
              'space-y-0.5',
              groupIndex < activeNavigationGroups.length - 1 && 'mb-1.5',
            )}
          >
            {sidebarOpen && (
              <p className="px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
            )}
            <ul className="px-0.5">
              {group.items.map((item: SidebarItem) => {
                const isActive = Boolean(
                  (!!item.href && location.pathname === item.href) ||
                    (!!item.hasSubmenu &&
                      item.subItems?.some((sub) => sub.href === location.pathname)),
                )
                const hasSubmenu = item.hasSubmenu
                const isSubmenuOpen = openSubmenus[item.name] || false
                const Icon = item.icon

                const mainCell = hasSubmenu ? (
                  <button
                    type="button"
                    className={linkBase(isActive)}
                    onClick={() => handleSubmenuToggle(item.name)}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <span className="relative flex w-8 shrink-0 items-center justify-center">
                      {item.badge != null && item.badge !== '' && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
                          {String(item.badge).length > 2 ? '99' : item.badge}
                        </span>
                      )}
                      {renderNavIcon(Icon, isActive)}
                    </span>
                    {sidebarOpen && (
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-1">
                        <span className={cn('truncate', isActive ? 'font-semibold' : 'font-medium')}>
                          {item.name}
                        </span>
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
                      {item.badge != null && item.badge !== '' && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
                          {String(item.badge).length > 2 ? '99' : item.badge}
                        </span>
                      )}
                      {renderNavIcon(Icon, isActive)}
                    </span>
                    {sidebarOpen && (
                      <span
                        className={cn('min-w-0 flex-1 truncate', isActive ? 'font-semibold' : 'font-medium')}
                      >
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
                          const isSubActive = location.pathname === subItem.href
                          const SIcon = subItem.icon
                          return (
                            <li key={subItem.name} className="list-none">
                              <Link
                                to={subItem.href}
                                onClick={isMobile ? onClose : undefined}
                                className={subLinkBase(isSubActive)}
                              >
                                {renderNavIcon(SIcon, isSubActive, true)}
                                <span
                                  className={cn('flex-1 truncate', isSubActive ? 'font-semibold' : 'font-normal')}
                                >
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
              })}
            </ul>
          </div>
        ))}
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
