import React, { useState, useMemo, useEffect } from 'react'
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
  ShieldAlert as ShieldAlertIcon,
  Shield as ShieldAccessIcon,
  Bell as NotificationsIcon,
  User as PersonIcon,
  Tag as CategoryIcon,
  Images as SlideshowIcon,
  Tag as CouponIcon,
  Share2 as ReferralIcon,
  Globe as WebIcon,
  Star as StarIcon,
  HelpCircle as HelpIcon,
  Search as SearchIcon,
  FileText as DescriptionIcon,
  BookOpen as ArticleIcon,
  Image as MediaIcon,
  Menu as MenusIcon,
  Receipt as ReceiptIcon,
  Palette as InvoiceBrandingIcon,
  CreditCard as CreditCardIcon,
  Landmark as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Link2 as LinkIcon,
  Megaphone as CampaignIcon,
  MapPin as MapPinIcon,
  Wallet as WalletIcon,
  Store as StorefrontIcon,
  ShoppingBag as ShoppingBagIcon,
  ScanLine as PosTerminalIcon,
  Briefcase as BusinessCenterIcon,
  UserSearch as PersonSearchIcon,
  Handshake as HandshakeIcon,
  ListTodo as AssignmentIcon,
  ListChecks as RateReviewIcon,
  BadgeCheck as VerifiedUserIcon,
  KanbanSquare as KanbanSquareIcon,
  CalendarDays as TeamCalendarIcon,
  LayoutGrid,
  TicketPercent,
  Newspaper,
  Sparkles,
  Layers,
  LayoutPanelTop,
  Lightbulb as LightbulbIcon,
  FlaskConical as LabIcon,
  Target as TargetIcon,
  Mail as MailTemplateIcon,
  Palette as PaletteIcon,
  Presentation as PresentationIcon,
  History as HistoryIcon,
  Gauge as GaugeIcon,
  ShieldCheck as AmcShieldIcon,
  ListOrdered as RateCardsHubIcon,
  FileSignature as CompanyDocumentsIcon,
  CircleDollarSign as OperatingCommercialIcon,
  Boxes as ProviderAssetsIcon,
  Gavel as ProfessionalConductIcon,
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

const drawerWidth = DRAWER_WIDTH_EXPANDED_PX
const collapsedDrawerWidth = DRAWER_WIDTH_COLLAPSED_PX

/** Paths that are hub landing pages — avoid treating `/cms`, `/users`, etc. as prefixes of sibling routes. */
const NAV_EXACT_ONLY_HREFS = new Set<string>([
  '/',
  '/cms',
  '/crm',
  '/users',
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

/**
 * Admin navigation: sales → day-to-day ops → commerce → supply-side catalog → growth → people → platform.
 */
const navigationGroups = [
  {
    title: 'Overview',
    icon: DashboardIcon,
    items: [
      { name: 'Dashboard', href: '/', icon: DashboardIcon, permissions: ['view_dashboard'], badge: null },
      { name: 'Analytics', href: '/analytics', icon: BarChartIcon, permissions: ['view_analytics'], badge: null },
      {
        name: 'Growth funnels',
        href: '/analytics/funnels',
        icon: TargetIcon,
        permissions: ['view_analytics'],
        badge: null,
      },
    ]
  },
  {
    title: 'CRM',
    icon: BusinessCenterIcon,
    items: [
      { name: 'CRM overview', href: '/crm', icon: BusinessCenterIcon, permissions: ['view_crm'], badge: null },
      { name: 'Leads', href: '/crm/leads', icon: PersonSearchIcon, permissions: ['view_crm'], badge: null },
      { name: 'Contacts', href: '/crm/contacts', icon: UsersIcon, permissions: ['view_crm'], badge: null },
      { name: 'B2B accounts', href: '/crm/companies', icon: BusinessIcon, permissions: ['view_crm'], badge: null },
      { name: 'Deals', href: '/crm/deals', icon: HandshakeIcon, permissions: ['view_crm'], badge: null },
      { name: 'Activities', href: '/crm/activities', icon: AssignmentIcon, permissions: ['view_crm'], badge: null },
      { name: 'CRM settings', href: '/crm/settings', icon: TuneIcon, permissions: ['view_crm'], badge: null },
    ]
  },
  {
    title: 'Operations',
    icon: CalendarIcon,
    items: [
      { name: 'Bookings', href: '/bookings', icon: CalendarIcon, permissions: ['view_bookings', 'manage_bookings'], badge: null },
      {
        name: 'AMC contracts',
        href: '/amc/overview',
        icon: AmcShieldIcon,
        permissions: ['view_amc'],
        badge: null,
      },
      {
        name: 'Documents & signatures',
        href: '/company-documents',
        icon: CompanyDocumentsIcon,
        permissions: ['view_company_documents'],
        badge: null,
      },
      {
        name: 'Rate cards',
        href: '/rate-cards/overview',
        icon: RateCardsHubIcon,
        permissions: ['view_rate_cards'],
        badge: null,
      },
      {
        name: 'Fees & cities',
        href: '/operations/commercial/terms',
        icon: OperatingCommercialIcon,
        permissions: ['view_operating_terms'],
        badge: null,
      },
      {
        name: 'Professional assets',
        href: '/operations/provider-assets',
        icon: ProviderAssetsIcon,
        permissions: ['view_provider_assets'],
        badge: null,
      },
      {
        name: 'Conduct & incentives',
        href: '/operations/professional-conduct',
        icon: ProfessionalConductIcon,
        permissions: ['view_professional_conduct'],
        badge: null,
      },
      {
        name: 'POS — Home services',
        href: '/operations/pos',
        icon: PosTerminalIcon,
        permissions: ['create_bookings', 'manage_bookings'],
        badge: null,
      },
      {
        name: 'Industry operations',
        href: '/operations',
        icon: GaugeIcon,
        permissions: ['view_dashboard'],
        badge: null,
      },
      {
        name: 'Dispute cases',
        href: '/operations/dispute-cases',
        icon: ShieldAlertIcon,
        permissions: ['view_bookings', 'manage_bookings', 'edit_bookings'],
        badge: null,
      },
      {
        name: 'Boards',
        href: '/boards',
        icon: PresentationIcon,
        permissions: ['view_boards'],
        badge: null,
      },
      {
        name: 'Team work',
        href: '/team-work',
        icon: KanbanSquareIcon,
        permissions: ['view_team_tasks', 'manage_team_tasks'],
        badge: null,
      },
      {
        name: 'Team calendar',
        href: '/team-work/calendar',
        icon: TeamCalendarIcon,
        permissions: ['view_team_tasks', 'manage_team_tasks'],
        badge: null,
      },
      { name: 'Service requests', href: '/requests', icon: FileTextIcon, permissions: ['view_services', 'manage_services'], badge: null },
      { name: 'Quotes', href: '/quotes', icon: DollarSignIcon, permissions: ['view_quotes'], badge: null },
      {
        name: 'Payments',
        href: '/payments',
        icon: CreditCardIcon,
        permissions: ['view_payments', 'create_payments', 'refund_payments'],
        badge: null,
      },
      {
        name: 'Invoices',
        href: '/invoices',
        icon: ReceiptIcon,
        permissions: ['view_payments', 'create_payments', 'refund_payments'],
        badge: null,
      },
      {
        name: 'Invoice appearance',
        href: '/invoices/branding',
        icon: InvoiceBrandingIcon,
        permissions: ['view_payments', 'create_payments', 'refund_payments'],
        badge: null,
      },
      {
        name: 'Earnings & Payouts',
        href: '/payouts',
        icon: AccountBalanceIcon,
        permissions: ['view_payments', 'create_payments', 'refund_payments'],
        badge: null,
      },
      {
        name: 'Finance',
        href: '/finance/overview',
        icon: TrendingUpIcon,
        permissions: ['view_finance'],
        badge: null,
      },
      { name: 'Chat', href: '/chat', icon: ChatIcon, permissions: ['view_messages'], badge: null },
    ]
  },
  {
    title: 'Commerce',
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
        name: 'Module & AI settings',
        href: '/bazaar/module-settings',
        icon: Sparkles,
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
    title: 'Catalog & network',
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
      {
        name: 'Professionals',
        href: '/professionals',
        icon: PersonIcon,
        permissions: ['view_providers', 'edit_providers', 'approve_providers'],
        badge: null,
      },
      {
        name: 'Workforce dashboard',
        href: '/professionals/operations',
        icon: KanbanSquareIcon,
        permissions: ['view_providers', 'edit_providers', 'approve_providers'],
        badge: null,
      },
      {
        name: 'Provider Applications',
        href: '/provider-applications',
        icon: AssignmentIndIcon,
        permissions: ['view_providers', 'edit_providers', 'approve_providers'],
        badge: null,
      },
    ]
  },
  {
    title: 'Content & Marketing',
    icon: WebIcon,
    items: [
      {
        name: 'Site structure',
        icon: LayoutGrid,
        hasSubmenu: true,
        permissions: ['view_cms', 'manage_cms'],
        badge: null,
        subItems: [
          { name: 'CMS overview', href: '/cms', icon: WebIcon, permissions: ['view_cms'] },
          { name: 'Homepage', href: '/cms/homepage', icon: HomeIcon, permissions: ['manage_cms'] },
          { name: 'Site appearance', href: '/cms/site-appearance', icon: PaletteIcon, permissions: ['manage_cms'] },
          { name: 'Pages', href: '/cms/pages', icon: DescriptionIcon, permissions: ['manage_cms'] },
          { name: 'Menus', href: '/cms/menus', icon: MenusIcon, permissions: ['manage_cms'] },
          { name: 'Media library', href: '/cms/media', icon: MediaIcon, permissions: ['manage_cms'] },
        ],
      },
      {
        name: 'Surfaces & promotions',
        icon: Sparkles,
        hasSubmenu: true,
        permissions: ['view_cms', 'manage_cms', 'manage_marketing'],
        badge: null,
        subItems: [
          { name: 'Sliders', href: '/sliders', icon: SlideshowIcon, permissions: ['manage_cms'] },
          { name: 'Banners & pop-ups', href: '/cms/banners', icon: LayoutPanelTop, permissions: ['manage_cms'] },
          { name: 'Promotions', href: '/cms/promotions', icon: CouponIcon, permissions: ['manage_marketing'] },
          { name: 'Coupons', href: '/coupons', icon: TicketPercent, permissions: ['manage_marketing'] },
          { name: 'Referrals', href: '/referrals', icon: ReferralIcon, permissions: ['manage_marketing'] },
        ],
      },
      {
        name: 'Editorial & social proof',
        icon: Newspaper,
        hasSubmenu: true,
        permissions: ['view_cms', 'manage_cms'],
        badge: null,
        subItems: [
          { name: 'Blog posts', href: '/cms/blogs', icon: ArticleIcon, permissions: ['manage_cms'] },
          { name: 'Blog categories', href: '/cms/blog-categories', icon: CategoryIcon, permissions: ['manage_cms'] },
          { name: 'Newsletter', href: '/cms/newsletter', icon: CampaignIcon, permissions: ['manage_cms'] },
          {
            name: 'Email templates',
            href: '/cms/email-templates',
            icon: MailTemplateIcon,
            permissions: ['manage_system_settings'],
          },
          { name: 'Social links', href: '/cms/social-links', icon: LinkIcon, permissions: ['manage_cms'] },
          { name: 'Testimonials', href: '/cms/testimonials', icon: StarIcon, permissions: ['manage_cms'] },
          { name: 'Reviews', href: '/cms/reviews', icon: StarIcon, permissions: ['manage_cms'] },
          { name: 'FAQs', href: '/cms/faqs', icon: HelpIcon, permissions: ['manage_cms'] },
        ],
      },
      {
        name: 'Catalog & SEO',
        icon: Layers,
        hasSubmenu: true,
        permissions: ['manage_cms', 'manage_system_settings'],
        badge: null,
        subItems: [
          {
            name: 'Industry — Landing & SEO',
            href: '/cms/category-marketing',
            icon: CampaignIcon,
            permissions: ['manage_system_settings'],
          },
          {
            name: 'Industry — Service areas',
            href: '/cms/category-marketing?tab=service-areas',
            icon: MapPinIcon,
            permissions: ['manage_system_settings'],
          },
          {
            name: 'Industry — Rate card',
            href: '/cms/category-marketing?tab=rate-card',
            icon: ReceiptIcon,
            permissions: ['manage_system_settings'],
          },
          {
            name: 'Industry — Cross-linking',
            href: '/cms/category-marketing?tab=cross-linking',
            icon: LinkIcon,
            permissions: ['manage_system_settings'],
          },
          { name: 'SEO management', href: '/cms/seo', icon: SearchIcon, permissions: ['manage_cms'] },
        ],
      },
      {
        name: 'Marketing workspace',
        icon: CampaignIcon,
        hasSubmenu: true,
        permissions: ['manage_cms', 'manage_marketing'],
        badge: null,
        subItems: [
          { name: 'Overview', href: '/marketing', icon: LayoutGrid, permissions: ['manage_coupons'] },
          { name: 'Campaigns', href: '/marketing/campaigns', icon: TargetIcon, permissions: ['manage_coupons'] },
          { name: 'Content calendar', href: '/marketing/calendar', icon: CalendarIcon, permissions: ['manage_coupons'] },
          { name: 'Social posts', href: '/marketing/social', icon: ReferralIcon, permissions: ['manage_coupons'] },
          { name: 'Planning & ideas', href: '/marketing/planning', icon: LightbulbIcon, permissions: ['manage_coupons'] },
          { name: 'Tasks', href: '/marketing/tasks', icon: AssignmentIcon, permissions: ['manage_coupons'] },
          { name: 'R&D & brainstorm', href: '/marketing/lab', icon: LabIcon, permissions: ['manage_coupons'] },
        ],
      },
    ],
  },
  {
    title: 'People & messaging',
    icon: UsersIcon,
    items: [
      { name: 'Customers', href: '/users', icon: UsersIcon, permissions: ['view_users', 'manage_users'], badge: null },
      {
        name: 'Team members',
        href: '/users/members',
        icon: VerifiedUserIcon,
        permissions: ['view_users', 'manage_users'],
        badge: null,
      },
      // { name: 'Messages', href: '/messages', icon: MessageIcon, permissions: ['view_messages'], badge: null },
      { name: 'Notifications', href: '/notifications', icon: NotificationsIcon, permissions: ['view_notifications', 'manage_notifications'], badge: null },
    ]
  },
  {
    title: 'Knowledge kit',
    icon: ArticleIcon,
    items: [
      {
        name: 'Guides overview',
        href: '/knowledge-kit',
        icon: ArticleIcon,
        permissions: ['view_dashboard'],
        badge: null,
      },
    ],
  },
  {
    title: 'System',
    icon: SettingsIcon,
    items: [
      { name: 'Reports', href: '/reports', icon: AssessmentIcon, permissions: ['view_reports'], badge: null },
      { name: 'System Status', href: '/system-status', icon: CloudIcon, permissions: ['view_system_status'], badge: null },
      {
        name: 'Refund requests',
        href: '/support/refund-requests',
        icon: WalletIcon,
        permissions: ['refund_payments'],
        badge: null,
      },
      {
        name: 'Support tickets',
        href: '/support/tickets',
        icon: TicketPercent,
        permissions: ['view_dashboard'],
        badge: null,
      },
      { name: 'Settings', href: '/settings', icon: SettingsIcon, permissions: ['manage_settings'], badge: null },
      {
        name: 'Roles & access',
        href: '/settings/access',
        icon: ShieldAccessIcon,
        permissions: ['view_settings', 'manage_system_settings', 'manage_user_roles'],
        badge: null,
      },
      { name: 'Help & Support', href: '/support', icon: SupportIcon, permissions: ['view_dashboard'], badge: null },
      {
        name: 'SaaS platform',
        href: '/settings/saas',
        icon: BusinessIcon,
        permissions: ['manage_settings'],
        badge: null,
      },
      {
        name: 'Organizations',
        href: '/settings/tenants',
        icon: BusinessIcon,
        permissions: ['manage_system_settings'],
        badge: null,
      },
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
 * Admin drawer visibility uses the same path→permission resolution as in-app navigation guards
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
  const { checkRouteAccess } = usePermissions()
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({})

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
  
  // Select appropriate navigation
  const activeNavigationGroups = useMemo((): SidebarGroup[] => {
    if (isProfessional) {
      return professionalNavigationGroups as SidebarGroup[]
    }
    if (isProvider) {
      return providerNavigationGroups as SidebarGroup[]
    }
    return filterAdminNavigationByRouteAccess(navigationGroups, checkRouteAccess)
  }, [isProvider, isProfessional, checkRouteAccess])

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
                      {navBadgeLabel != null && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
                          {navBadgeLabel}
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
