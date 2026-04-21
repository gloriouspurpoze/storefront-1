import React, { useState, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  TextField,
  InputAdornment,
  Badge,
  alpha,
  Fade,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory as PackageIcon,
  Inventory2 as InventoryIcon,
  Build as WrenchIcon,
  Assignment as FileTextIcon,
  AssignmentInd as AssignmentIndIcon,
  AttachMoney as DollarSignIcon,
  Event as CalendarIcon,
  People as UsersIcon,
  Security as ShieldIcon,
  Analytics as BarChartIcon,
  Assessment as AssessmentIcon,
  Cloud as CloudIcon,
  Message as MessageIcon,
  Chat as ChatIcon,
  ShoppingCart as ShoppingCartIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Home as HomeIcon,
  ExpandLess,
  ExpandMore,
  Business as BusinessIcon,
  Support as SupportIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Slideshow as SlideshowIcon,
  LocalOffer as CouponIcon,
  LocalOffer as LocalOfferIcon,
  Share as ReferralIcon,
  Web as WebIcon,
  Image as ImageIcon,
  Star as StarIcon,
  HelpOutline as HelpIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  Article as ArticleIcon,
  PermMedia as MediaIcon,
  Menu as MenusIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Link as LinkIcon,
  Campaign as CampaignIcon,
  Storefront as StorefrontIcon,
  ShoppingBag as ShoppingBagIcon,
  BusinessCenter as BusinessCenterIcon,
  PersonSearch as PersonSearchIcon,
  Handshake as HandshakeIcon,
  Assignment as AssignmentIcon,
  RateReview as RateReviewIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material'
import { useSidebar } from '../../contexts/sidebar-context'
import { useAppSelector } from '../../store/hooks'
import { getInitials } from '../../lib/utils'
import { SaasTenantIndicator } from './SaasTenantIndicator'
import { FixerLogoMark } from './FixerLogoMark'
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
      { name: 'Categories', href: '/categories', icon: CategoryIcon, permissions: ['view_categories', 'manage_categories'], badge: null },
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
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { isOpen: sidebarOpen, toggleSidebar } = useSidebar()
  const authState = useAppSelector((state) => state.auth)
  const user = authState?.user || null
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({})
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
    const groups: SidebarGroup[] = isProfessional
      ? professionalNavigationGroups as SidebarGroup[]
      : isProvider
      ? providerNavigationGroups as SidebarGroup[]
      : filterNavigationByPermissions(navigationGroups)

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return groups.map(group => ({
        ...group,
        items: group.items.filter((item: SidebarItem) => {
          const matchesName = item.name.toLowerCase().includes(query)
          const matchesSubItems = item.subItems?.some((sub: SidebarSubItem) =>
            sub.name.toLowerCase().includes(query)
          )
          return matchesName || !!matchesSubItems
        })
      })).filter(group => group.items.length > 0)
    }

    return groups
  }, [isProvider, isProfessional, searchQuery, user])

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

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleLogout = () => {
    handleUserMenuClose()
    // Add logout logic here
    navigate('/auth')
  }

  const getUserDisplayName = () => {
    if (user?.name) return user.name
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  const getUserRole = () => {
    if (user?.userType) {
      return user.userType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    if (user?.role?.name) {
      return user.role.name.replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    return 'Member'
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Enhanced Logo Section */}
      <Box
        sx={{
          p: sidebarOpen ? 2.5 : 2,
          display: 'flex',
          alignItems: 'center',
          gap: sidebarOpen ? 2 : 0,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        }}
      >
        <FixerLogoMark
          size={44}
          sx={{
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.04)' },
          }}
        />
        {sidebarOpen && (
          <Fade in={sidebarOpen}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                Fixer Admin
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 500 }}>
                Operations console
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>

      {/* Search Bar */}
      {sidebarOpen && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Filter navigation…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: alpha(theme.palette.action.hover, 0.3),
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.5),
                },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                },
              },
            }}
          />
        </Box>
      )}

      {/* Navigation Groups */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {activeNavigationGroups.map((group, groupIndex) => (
          <Box key={group.title} sx={{ mb: groupIndex < activeNavigationGroups.length - 1 ? 2 : 0 }}>
            {/* Group Header */}
            {sidebarOpen && (
              <Box sx={{ px: 2.5, py: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '0.7rem',
                  }}
                >
                  {group.title}
                </Typography>
              </Box>
            )}

            {/* Group Items */}
            <List sx={{ px: 1 }}>
              {group.items.map((item: SidebarItem) => {
                const isActive = location.pathname === item.href || 
                  (item.hasSubmenu && item.subItems?.some(sub => sub.href === location.pathname))
                const hasSubmenu = item.hasSubmenu
                const isSubmenuOpen = openSubmenus[item.name] || false

                const listItemButton = (
                  <ListItemButton
                    onClick={hasSubmenu ? () => handleSubmenuToggle(item.name) : undefined}
                    component={hasSubmenu ? 'div' : Link}
                    to={hasSubmenu ? undefined : item.href}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      mx: 0.5,
                      minHeight: 44,
                      backgroundColor: isActive 
                        ? alpha(theme.palette.primary.main, 0.12)
                        : 'transparent',
                      color: isActive ? 'primary.main' : 'text.primary',
                      borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      '&:hover': {
                        backgroundColor: isActive 
                          ? alpha(theme.palette.primary.main, 0.16)
                          : alpha(theme.palette.action.hover, 0.5),
                        borderLeft: `3px solid ${isActive ? theme.palette.primary.main : theme.palette.action.hover}`,
                      },
                      transition: 'all 0.2s ease',
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      px: sidebarOpen ? 2 : 1,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? 'primary.main' : 'text.secondary',
                        minWidth: sidebarOpen ? 40 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      {item.badge ? (
                        <Badge badgeContent={item.badge} color="error" max={99}>
                          {React.createElement(item.icon, { fontSize: 'small' })}
                        </Badge>
                      ) : (
                        React.createElement(item.icon, { fontSize: 'small' })
                      )}
                    </ListItemIcon>
                    {sidebarOpen && (
                      <>
                        <ListItemText
                          primary={item.name}
                          primaryTypographyProps={{
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '0.875rem',
                          }}
                        />
                        {hasSubmenu && (
                          <Box sx={{ ml: 1 }}>
                            {isSubmenuOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                          </Box>
                        )}
                      </>
                    )}
                  </ListItemButton>
                )

                return (
                  <Box key={item.name}>
                    <ListItem disablePadding>
                      {sidebarOpen ? (
                        listItemButton
                      ) : (
                        <Tooltip title={item.name} placement="right" arrow>
                          {listItemButton}
                        </Tooltip>
                      )}
                    </ListItem>

                    {/* Submenu Items */}
                    {hasSubmenu && sidebarOpen && (
                      <Collapse in={isSubmenuOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ pl: 3, pr: 1 }}>
                          {item.subItems?.map((subItem: SidebarSubItem) => {
                            const isSubActive = location.pathname === subItem.href
                            return (
                              <ListItem key={subItem.name} disablePadding>
                                <ListItemButton
                                  component={Link}
                                  to={subItem.href}
                                  onClick={isMobile ? onClose : undefined}
                                  sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    minHeight: 40,
                                    backgroundColor: isSubActive 
                                      ? alpha(theme.palette.primary.main, 0.1)
                                      : 'transparent',
                                    color: isSubActive ? 'primary.main' : 'text.primary',
                                    '&:hover': {
                                      backgroundColor: isSubActive 
                                        ? alpha(theme.palette.primary.main, 0.15)
                                        : alpha(theme.palette.action.hover, 0.3),
                                    },
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  <ListItemIcon
                                    sx={{
                                      color: isSubActive ? 'primary.main' : 'text.secondary',
                                      minWidth: 32,
                                    }}
                                  >
                                    {React.createElement(subItem.icon, { fontSize: 'small' })}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={subItem.name}
                                    primaryTypographyProps={{
                                      fontWeight: isSubActive ? 600 : 400,
                                      fontSize: '0.8rem',
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            )
                          })}
                        </List>
                      </Collapse>
                    )}
                  </Box>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>

      <SaasTenantIndicator variant="sidebar" sidebarOpen={sidebarOpen} />

      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />
      
      {/* Enhanced User Profile Section */}
      <Box sx={{ p: sidebarOpen ? 2 : 1.5 }}>
        {sidebarOpen ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: alpha(theme.palette.action.hover, 0.3),
              '&:hover': {
                bgcolor: alpha(theme.palette.action.hover, 0.5),
              },
              transition: 'all 0.2s ease',
            }}
            onClick={handleUserMenuOpen}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                fontSize: '0.875rem',
                fontWeight: 600,
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              {getInitials(getUserDisplayName())}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'text.primary',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {getUserDisplayName()}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                  display: 'block',
                }}
              >
                {getUserRole()}
              </Typography>
            </Box>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <ExpandMore fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Tooltip title={getUserDisplayName()} placement="right" arrow>
            <IconButton
              onClick={handleUserMenuOpen}
              sx={{
                width: '100%',
                height: 48,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.5),
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {getInitials(getUserDisplayName())}
              </Avatar>
            </IconButton>
          </Tooltip>
        )}

        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: 2,
              boxShadow: theme.shadows[8],
            },
          }}
        >
          <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings') }}>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings') }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: sidebarOpen ? drawerWidth : collapsedDrawerWidth,
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          top: APP_BAR_HEIGHT_PX,
          height: `calc(100vh - ${APP_BAR_HEIGHT_PX}px)`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  )
}
