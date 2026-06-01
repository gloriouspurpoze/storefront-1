# VerticalPack — TypeScript Contract + Starter `home_services` Manifest

> The TypeScript shape every vertical pack must implement, plus a complete starter manifest for `home_services` derived from `src/components/layout/sidebar.tsx` today.

## 1. The contract

Place under `packages/verticals/core/types.ts` in the monorepo.

```ts
import type { Permission } from '@profixer/types'
import type { ZodTypeAny } from 'zod'

// ──────────────────────────────────────────────────────────
// Vertical identity
// ──────────────────────────────────────────────────────────

export type VerticalKey =
  | 'home_services'
  | 'restaurant'
  | 'salon'
  | 'clinic'
  | 'fitness'
  | 'auto_repair'
  | 'tutoring'
  | 'custom'

// ──────────────────────────────────────────────────────────
// Sidebar / navigation
// ──────────────────────────────────────────────────────────

export interface SidebarItemDef {
  id: string
  label: string
  /** React Navigation screen name OR web route — pack consumers pick which to use */
  webPath?: string
  mobileScreen?: string
  /** Optional `lucide-react` icon name */
  icon?: string
  /** Falls back to `routePermissions` lookup in core RBAC */
  permissions?: Permission[]
  /** Module key from `featureModules` allowlist (e.g. 'crm', 'finance') */
  module?: string
  /** Sub-items when this is a submenu node */
  children?: SidebarItemDef[]
  /** Optional badge resolver name — pack consumers map to actual hooks */
  badgeKey?: string
}

export interface SidebarGroupDef {
  id: string
  title: string
  icon?: string
  /** Order hint — lower numbers float to top */
  order?: number
  items: SidebarItemDef[]
}

// ──────────────────────────────────────────────────────────
// Engagement (the abstract unit of customer value)
// ──────────────────────────────────────────────────────────

export interface EngagementStatusDef {
  key: string
  label: string
  /** Hex / token; UI maps to its own theme */
  color?: string
  /** Terminal states cannot transition further */
  terminal?: boolean
  /** Allowed next states (for state-machine validation) */
  next?: string[]
}

export interface EngagementCustomFieldDef {
  key: string
  label: string
  type: 'string' | 'number' | 'enum' | 'date' | 'boolean' | 'json'
  required?: boolean
  options?: string[]                // for type: 'enum'
  /** zod schema for validation; UI uses for form generation */
  schema?: ZodTypeAny
  /** Where to display: detail card, list column, dashboard widget */
  surfaces?: Array<'detail' | 'list' | 'create_form'>
}

export interface EngagementTypeDef {
  key: string                       // 'booking' | 'reservation' | 'appointment' | 'order'
  label: string
  statuses: EngagementStatusDef[]
  customFields: EngagementCustomFieldDef[]
  /** Default sort for list view */
  defaultSortField?: string
  /** Default list columns */
  defaultColumns?: string[]
}

// ──────────────────────────────────────────────────────────
// Catalog (services / products / menu items / treatments / procedures)
// ──────────────────────────────────────────────────────────

export interface CatalogKindDef {
  key: string                       // 'service' | 'menu_item' | 'treatment' | 'procedure'
  label: string
  supportsDuration?: boolean        // appointment-based verticals
  supportsModifiers?: boolean       // restaurant size/extras
  supportsAllergens?: boolean       // restaurant
  supportsSkillRequired?: boolean   // home-services / salon
  customFields?: EngagementCustomFieldDef[]
}

// ──────────────────────────────────────────────────────────
// Workforce
// ──────────────────────────────────────────────────────────

export interface WorkforceRoleDef {
  key: string                       // 'plumber' | 'chef' | 'stylist' | 'doctor'
  label: string
  requiresLicense?: boolean
  requiresSkills?: string[]
  commissionModel?: 'percent_of_sale' | 'fixed_salary' | 'mixed' | 'tip_pool'
}

// ──────────────────────────────────────────────────────────
// Dashboard / KPIs
// ──────────────────────────────────────────────────────────

export interface DashboardWidgetDef {
  key: string                       // 'CoversToday' | 'BookingsToday' | …
  label: string
  /** Component identifier — host app maps to actual React component */
  component: string
  permissions?: Permission[]
  /** Default grid placement */
  defaultRow?: number
  defaultColSpan?: 1 | 2 | 3 | 4
}

// ──────────────────────────────────────────────────────────
// Compliance & tax
// ──────────────────────────────────────────────────────────

export interface TaxStrategyDef {
  key: string                       // 'home_services_gst_18' | 'restaurant_gst_5_or_18'
  label: string
  rates: Array<{ key: string; label: string; rate: number }>
  /** UI prompts for HSN/SAC codes etc. */
  requiredFields?: string[]
}

export interface ComplianceFieldDef {
  key: string                       // 'fssai_license_no' | 'medical_council_no'
  label: string
  required?: boolean
  validatePattern?: string          // regex
}

// ──────────────────────────────────────────────────────────
// Integrations
// ──────────────────────────────────────────────────────────

export interface IntegrationDef {
  key: string                       // 'zomato' | 'razorpay' | 'twilio_whatsapp'
  label: string
  scope: 'orders' | 'payments' | 'messaging' | 'maps' | 'analytics' | 'other'
  /** Auth strategy hint */
  auth?: 'oauth2' | 'api_key' | 'webhook_pull'
}

// ──────────────────────────────────────────────────────────
// Pack seed (default data on tenant creation)
// ──────────────────────────────────────────────────────────

export interface PackSeed {
  catalogCategories?: Array<{ name: string; kind: string }>
  workforceRoles?: string[]
  /** Idempotent function called on tenant creation */
  run?: (ctx: { tenantId: string }) => Promise<void>
}

// ──────────────────────────────────────────────────────────
// Mobile companion app
// ──────────────────────────────────────────────────────────

export interface MobilePackDef {
  tabs: Array<{
    id: string
    label: string
    icon?: string
    rootScreen: string
    permissions?: Permission[]
  }>
  drawerSections?: SidebarGroupDef[]
  deepLinks?: Record<string, string>   // 'profixer://booking/:id' -> 'BookingDetail'
}

// ──────────────────────────────────────────────────────────
// The pack manifest
// ──────────────────────────────────────────────────────────

export interface VerticalPack {
  // Identity
  key: VerticalKey
  label: string
  description: string
  icon?: string
  version: string                     // semver — `Tenant.packVersion`

  // Web sidebar
  sidebarGroups: SidebarGroupDef[]

  // Domain definitions
  engagementTypes: EngagementTypeDef[]
  catalogKinds: CatalogKindDef[]
  workforceRoles: WorkforceRoleDef[]

  // Dashboard
  dashboardWidgets: DashboardWidgetDef[]

  // Reports
  reports: Array<{ key: string; label: string; component: string }>

  // Compliance
  taxStrategy: TaxStrategyDef
  compliance: ComplianceFieldDef[]

  // Defaults at tenant creation
  defaultModules: string[]            // -> seeds Tenant.featureModules
  seed?: PackSeed
  industrySettingsSchema?: ZodTypeAny // for the per-tenant industrySettings blob

  // Integrations marketplace
  integrations: IntegrationDef[]

  // Mobile
  mobile?: MobilePackDef
}
```

## 2. Starter manifest — `home_services`

Place under `packages/verticals/home_services/manifest.ts`. This is a faithful extraction of today's `src/components/layout/sidebar.tsx` `navigationGroups` — vertical-specific groups only. The **core** sidebar (Overview, CRM, Finance, CMS, Marketing, People, Knowledge, System) lives separately in `packages/verticals/core/manifest.ts` and is merged in by the sidebar loader.

```ts
import { z } from 'zod'
import type { VerticalPack } from '../core/types'

export const homeServicesPack: VerticalPack = {
  // ── Identity ────────────────────────────────────────────
  key: 'home_services',
  label: 'Home Services',
  description:
    'On-site services dispatched to a customer address: plumbing, electrical, cleaning, appliance repair, AC service, painting, pest control.',
  icon: 'Wrench',
  version: '1.0.0',

  // ── Sidebar (vertical-specific groups only) ─────────────
  sidebarGroups: [
    {
      id: 'operations',
      title: 'Operations',
      icon: 'Calendar',
      order: 30,
      items: [
        { id: 'bookings', label: 'Bookings', webPath: '/bookings', icon: 'Calendar',
          permissions: ['view_bookings', 'manage_bookings'] },
        { id: 'amc', label: 'AMC contracts', webPath: '/amc/overview', icon: 'ShieldCheck',
          permissions: ['view_amc'], module: 'amc' },
        { id: 'rate_cards', label: 'Rate cards', webPath: '/rate-cards/overview',
          icon: 'ListOrdered', permissions: ['view_rate_cards'] },
        { id: 'fees_cities', label: 'Fees & cities', webPath: '/operations/commercial/terms',
          icon: 'CircleDollarSign', permissions: ['view_operating_terms'] },
        { id: 'provider_assets', label: 'Professional assets',
          webPath: '/operations/provider-assets', icon: 'Boxes',
          permissions: ['view_provider_assets'] },
        { id: 'professional_conduct', label: 'Conduct & incentives',
          webPath: '/operations/professional-conduct', icon: 'Gavel',
          permissions: ['view_professional_conduct'] },
        { id: 'home_services_pos', label: 'POS — Home services',
          webPath: '/operations/pos', icon: 'ScanLine',
          permissions: ['create_bookings', 'manage_bookings'] },
        { id: 'industry_ops', label: 'Industry operations', webPath: '/operations',
          icon: 'Gauge', permissions: ['view_dashboard'] },
        { id: 'dispute_cases', label: 'Dispute cases', webPath: '/operations/dispute-cases',
          icon: 'ShieldAlert',
          permissions: ['view_bookings', 'manage_bookings', 'edit_bookings'] },
        { id: 'service_requests', label: 'Service requests', webPath: '/requests',
          icon: 'ClipboardList', permissions: ['view_services', 'manage_services'] },
        { id: 'quotes', label: 'Quotes', webPath: '/quotes', icon: 'DollarSign',
          permissions: ['view_quotes'] },
      ],
    },
    {
      id: 'catalog_network',
      title: 'Catalog & network',
      icon: 'Package',
      order: 50,
      items: [
        { id: 'service_categories', label: 'Service categories',
          webPath: '/categories/services', icon: 'Wrench',
          permissions: ['view_categories', 'manage_categories'] },
        { id: 'platform_services', label: 'Platform services',
          webPath: '/platform-services', icon: 'Home',
          permissions: ['view_services', 'manage_services'] },
        { id: 'marketplace', label: 'Marketplace', webPath: '/marketplace', icon: 'Store',
          permissions: ['view_services', 'view_providers'] },
        { id: 'professionals', label: 'Professionals', webPath: '/professionals',
          icon: 'User',
          permissions: ['view_providers', 'edit_providers', 'approve_providers'] },
        { id: 'workforce_dashboard', label: 'Workforce dashboard',
          webPath: '/professionals/operations', icon: 'KanbanSquare',
          permissions: ['view_providers'] },
        { id: 'provider_applications', label: 'Provider applications',
          webPath: '/provider-applications', icon: 'IdCard',
          permissions: ['view_providers', 'approve_providers'] },
      ],
    },
  ],

  // ── Engagement types ────────────────────────────────────
  engagementTypes: [
    {
      key: 'booking',
      label: 'Booking',
      defaultSortField: 'scheduledAt',
      defaultColumns: ['id', 'customer', 'service', 'assignee', 'scheduledAt', 'status'],
      statuses: [
        { key: 'requested', label: 'Requested', color: 'slate',
          next: ['quoted', 'assigned', 'cancelled'] },
        { key: 'quoted',    label: 'Quoted', color: 'amber',
          next: ['assigned', 'cancelled'] },
        { key: 'assigned',  label: 'Assigned', color: 'blue',
          next: ['en_route', 'cancelled'] },
        { key: 'en_route',  label: 'En route', color: 'indigo',
          next: ['on_site', 'cancelled'] },
        { key: 'on_site',   label: 'On site', color: 'violet',
          next: ['completed', 'disputed'] },
        { key: 'completed', label: 'Completed', color: 'emerald',
          next: ['paid', 'disputed'] },
        { key: 'paid',      label: 'Paid', color: 'green', terminal: true },
        { key: 'disputed',  label: 'Disputed', color: 'red',
          next: ['completed', 'cancelled'] },
        { key: 'cancelled', label: 'Cancelled', color: 'gray', terminal: true },
      ],
      customFields: [
        { key: 'serviceAddress', label: 'Service address', type: 'string', required: true,
          surfaces: ['detail', 'list'] },
        { key: 'preferredSlot', label: 'Preferred time slot', type: 'string',
          surfaces: ['detail', 'create_form'] },
        { key: 'accessNotes', label: 'Access notes (gate code, parking)', type: 'string',
          surfaces: ['detail'] },
        { key: 'urgency', label: 'Urgency', type: 'enum',
          options: ['standard', 'same_day', 'emergency'], surfaces: ['list', 'detail'] },
      ],
    },
  ],

  // ── Catalog kinds ───────────────────────────────────────
  catalogKinds: [
    {
      key: 'service',
      label: 'Service',
      supportsDuration: true,
      supportsSkillRequired: true,
      customFields: [
        { key: 'estimatedDurationMin', label: 'Estimated duration (min)', type: 'number' },
        { key: 'requiresOnSiteEstimate', label: 'Requires on-site estimate?',
          type: 'boolean' },
      ],
    },
  ],

  // ── Workforce roles ─────────────────────────────────────
  workforceRoles: [
    { key: 'plumber',     label: 'Plumber',     requiresSkills: ['plumbing'] },
    { key: 'electrician', label: 'Electrician', requiresLicense: true,
      requiresSkills: ['electrical'] },
    { key: 'cleaner',     label: 'Cleaner' },
    { key: 'painter',     label: 'Painter' },
    { key: 'ac_technician', label: 'AC technician', requiresSkills: ['hvac'] },
    { key: 'appliance_repair', label: 'Appliance repair',
      requiresSkills: ['appliances'] },
    { key: 'pest_control', label: 'Pest control' },
    { key: 'carpenter',   label: 'Carpenter',   requiresSkills: ['carpentry'] },
  ],

  // ── Dashboard widgets ───────────────────────────────────
  dashboardWidgets: [
    { key: 'BookingsToday', label: 'Bookings today', component: 'BookingsTodayCard',
      defaultRow: 1, defaultColSpan: 1 },
    { key: 'ActiveProfessionals', label: 'Active professionals',
      component: 'ActiveProfessionalsCard', defaultRow: 1, defaultColSpan: 1 },
    { key: 'OpenDisputes', label: 'Open disputes', component: 'OpenDisputesCard',
      defaultRow: 1, defaultColSpan: 1 },
    { key: 'RevenueLast7Days', label: 'Revenue (last 7d)',
      component: 'RevenueTrendChart', defaultRow: 2, defaultColSpan: 2 },
    { key: 'TopServices', label: 'Top services', component: 'TopServicesList',
      defaultRow: 2, defaultColSpan: 2 },
  ],

  // ── Reports ─────────────────────────────────────────────
  reports: [
    { key: 'BookingsByCity', label: 'Bookings by city', component: 'BookingsByCityReport' },
    { key: 'ProfessionalEarnings', label: 'Professional earnings',
      component: 'ProfessionalEarningsReport' },
    { key: 'DisputeBreakdown', label: 'Dispute breakdown',
      component: 'DisputeBreakdownReport' },
    { key: 'AMCRenewals', label: 'AMC renewals due', component: 'AMCRenewalsReport' },
  ],

  // ── Tax & compliance ────────────────────────────────────
  taxStrategy: {
    key: 'home_services_gst_18',
    label: 'GST — Home services (India)',
    rates: [
      { key: 'gst_18', label: 'GST 18% (standard service)', rate: 0.18 },
      { key: 'gst_5',  label: 'GST 5% (composition / small)', rate: 0.05 },
      { key: 'exempt', label: 'Exempt', rate: 0 },
    ],
    requiredFields: ['gstin', 'sac_code'],
  },
  compliance: [
    { key: 'gstin', label: 'GSTIN', validatePattern: '^[0-9A-Z]{15}$' },
    { key: 'msme_udyam_no', label: 'Udyam registration (MSME)' },
    { key: 'shop_act_no', label: 'Shop & Establishment Act no.' },
  ],

  // ── Defaults at tenant creation ─────────────────────────
  defaultModules: [
    'crm', 'finance', 'team_work', 'marketing_workspace', 'cms',
    'bookings', 'professionals', 'services', 'amc', 'rate_cards',
    'home_services_pos', 'disputes',
  ],
  seed: {
    catalogCategories: [
      { name: 'Plumbing', kind: 'service' },
      { name: 'Electrical', kind: 'service' },
      { name: 'AC & HVAC', kind: 'service' },
      { name: 'Cleaning', kind: 'service' },
      { name: 'Painting', kind: 'service' },
      { name: 'Appliance repair', kind: 'service' },
      { name: 'Pest control', kind: 'service' },
      { name: 'Carpentry', kind: 'service' },
    ],
    workforceRoles: [
      'plumber', 'electrician', 'cleaner', 'painter',
      'ac_technician', 'appliance_repair', 'pest_control', 'carpenter',
    ],
  },
  industrySettingsSchema: z.object({
    serviceRadiusKm: z.number().min(1).max(200).default(15),
    sameDayCutoffHour: z.number().min(0).max(23).default(17),
    emergencySurchargePct: z.number().min(0).max(100).default(25),
    allowProviderTakeRate: z.boolean().default(true),
    defaultTakeRatePct: z.number().min(0).max(100).default(20),
  }),

  // ── Integrations ────────────────────────────────────────
  integrations: [
    { key: 'razorpay', label: 'Razorpay', scope: 'payments', auth: 'api_key' },
    { key: 'twilio_whatsapp', label: 'WhatsApp via Twilio', scope: 'messaging',
      auth: 'api_key' },
    { key: 'google_maps', label: 'Google Maps', scope: 'maps', auth: 'api_key' },
    { key: 'onesignal', label: 'OneSignal Push', scope: 'messaging', auth: 'api_key' },
  ],

  // ── Mobile companion ────────────────────────────────────
  mobile: {
    tabs: [
      { id: 'home', label: 'Home', icon: 'LayoutDashboard', rootScreen: 'Dashboard' },
      { id: 'ops',  label: 'Ops',  icon: 'Calendar', rootScreen: 'BookingsList' },
      { id: 'chat', label: 'Chat', icon: 'MessageSquare', rootScreen: 'ChatInbox',
        permissions: ['view_messages'] },
      { id: 'inbox', label: 'Inbox', icon: 'Bell', rootScreen: 'Notifications' },
      { id: 'more', label: 'More', icon: 'Menu', rootScreen: 'MoreHub' },
    ],
    deepLinks: {
      'profixer://booking/:id': 'BookingDetail',
      'profixer://professional/:id': 'ProfessionalDetail',
      'profixer://application/:id': 'ProviderApplications',
      'profixer://refund/:id': 'RefundRequests',
      'profixer://chat/:threadId': 'ChatThread',
    },
  },
}
```

## 3. The core manifest (always-on, vertical-agnostic)

Placed in `packages/verticals/core/manifest.ts`. The sidebar loader merges these groups with the active vertical pack's groups (ordered by `order`).

```ts
import type { VerticalPack } from './types'

// Subset of VerticalPack — only sidebar + dashboard concerns
export const coreSidebarGroups: VerticalPack['sidebarGroups'] = [
  {
    id: 'overview', title: 'Overview', icon: 'LayoutDashboard', order: 10,
    items: [
      { id: 'dashboard', label: 'Dashboard', webPath: '/', icon: 'LayoutDashboard',
        permissions: ['view_dashboard'] },
      { id: 'analytics', label: 'Analytics', webPath: '/analytics', icon: 'BarChart2',
        permissions: ['view_analytics'] },
      { id: 'catalog_performance', label: 'Catalog performance',
        webPath: '/analytics/catalog', icon: 'BarChart2',
        permissions: ['view_analytics'] },
      { id: 'growth_funnels', label: 'Growth funnels', webPath: '/analytics/funnels',
        icon: 'Target', permissions: ['view_analytics'] },
    ],
  },
  {
    id: 'crm', title: 'CRM', icon: 'Briefcase', order: 20,
    items: [
      { id: 'crm_overview', label: 'CRM overview', webPath: '/crm',
        icon: 'Briefcase', permissions: ['view_crm'], module: 'crm' },
      { id: 'crm_leads', label: 'Leads', webPath: '/crm/leads',
        icon: 'UserSearch', permissions: ['view_crm'], module: 'crm' },
      { id: 'crm_contacts', label: 'Contacts', webPath: '/crm/contacts',
        icon: 'Users', permissions: ['view_crm'], module: 'crm' },
      { id: 'crm_companies', label: 'B2B accounts', webPath: '/crm/companies',
        icon: 'Building2', permissions: ['view_crm'], module: 'crm' },
      { id: 'crm_deals', label: 'Deals', webPath: '/crm/deals',
        icon: 'Handshake', permissions: ['view_crm'], module: 'crm' },
      { id: 'crm_activities', label: 'Activities', webPath: '/crm/activities',
        icon: 'ListTodo', permissions: ['view_crm'], module: 'crm' },
      { id: 'crm_settings', label: 'CRM settings', webPath: '/crm/settings',
        icon: 'SlidersHorizontal', permissions: ['view_crm'], module: 'crm' },
    ],
  },
  {
    id: 'money', title: 'Money', icon: 'CreditCard', order: 40,
    items: [
      { id: 'payments', label: 'Payments', webPath: '/payments', icon: 'CreditCard',
        permissions: ['view_payments'] },
      { id: 'invoices', label: 'Invoices', webPath: '/invoices', icon: 'Receipt',
        permissions: ['view_payments'] },
      { id: 'invoice_branding', label: 'Invoice appearance',
        webPath: '/invoices/branding', icon: 'Palette',
        permissions: ['view_payments'] },
      { id: 'payouts', label: 'Earnings & payouts', webPath: '/payouts',
        icon: 'Landmark', permissions: ['view_payments'] },
      { id: 'finance', label: 'Finance', webPath: '/finance/overview',
        icon: 'TrendingUp', permissions: ['view_finance'], module: 'finance' },
      { id: 'founder_finance', label: 'Founder finance',
        webPath: '/finance/founder/dashboard', icon: 'TrendingUp',
        permissions: ['view_finance'], module: 'finance' },
      { id: 'subscriptions', label: 'Subscriptions', webPath: '/subscriptions',
        icon: 'Repeat', permissions: ['view_subscriptions'] },
      { id: 'company_documents', label: 'Documents & signatures',
        webPath: '/company-documents', icon: 'FileSignature',
        permissions: ['view_company_documents'] },
    ],
  },
  {
    id: 'team', title: 'Team & collaboration', icon: 'Users', order: 45,
    items: [
      { id: 'team_work', label: 'Team work', webPath: '/team-work',
        icon: 'KanbanSquare', permissions: ['view_team_tasks'], module: 'team_work' },
      { id: 'team_calendar', label: 'Team calendar', webPath: '/team-work/calendar',
        icon: 'CalendarDays', permissions: ['view_team_tasks'], module: 'team_work' },
      { id: 'boards', label: 'Boards', webPath: '/boards', icon: 'Presentation',
        permissions: ['view_boards'] },
      { id: 'chat', label: 'Chat', webPath: '/chat', icon: 'MessageCircle',
        permissions: ['view_messages'] },
    ],
  },
  {
    id: 'content_marketing', title: 'Content & Marketing', icon: 'Globe', order: 60,
    items: [
      // submenus identical to current sidebar — module-gated via 'cms' / 'marketing_workspace'
      { id: 'cms_site_structure', label: 'Site structure', icon: 'LayoutGrid',
        module: 'cms', children: [
          { id: 'cms_overview', label: 'CMS overview', webPath: '/cms', icon: 'Globe',
            permissions: ['view_cms'] },
          { id: 'cms_homepage', label: 'Homepage', webPath: '/cms/homepage',
            icon: 'Home', permissions: ['manage_cms'] },
          { id: 'cms_site_appearance', label: 'Site appearance',
            webPath: '/cms/site-appearance', icon: 'Palette',
            permissions: ['manage_cms'] },
          { id: 'cms_pages', label: 'Pages', webPath: '/cms/pages',
            icon: 'FileText', permissions: ['manage_cms'] },
          { id: 'cms_menus', label: 'Menus', webPath: '/cms/menus', icon: 'Menu',
            permissions: ['manage_cms'] },
          { id: 'cms_media', label: 'Media library', webPath: '/cms/media',
            icon: 'Image', permissions: ['manage_cms'] },
        ],
      },
      { id: 'surfaces_promos', label: 'Surfaces & promotions', icon: 'Sparkles',
        module: 'marketing_workspace', children: [
          { id: 'sliders', label: 'Sliders & banners', webPath: '/sliders',
            icon: 'Images', permissions: ['manage_cms'] },
          { id: 'coupons', label: 'Coupons & promo codes', webPath: '/coupons',
            icon: 'TicketPercent', permissions: ['manage_marketing'] },
          { id: 'referrals', label: 'Referrals', webPath: '/referrals',
            icon: 'Share2', permissions: ['manage_marketing'] },
        ],
      },
      { id: 'editorial', label: 'Editorial & social proof', icon: 'Newspaper',
        module: 'cms', children: [
          { id: 'blogs', label: 'Blog posts', webPath: '/cms/blogs',
            icon: 'BookOpen', permissions: ['manage_cms'] },
          { id: 'blog_categories', label: 'Blog categories',
            webPath: '/cms/blog-categories', icon: 'Tag',
            permissions: ['manage_cms'] },
          { id: 'newsletter', label: 'Newsletter', webPath: '/cms/newsletter',
            icon: 'Megaphone', permissions: ['manage_cms'] },
          { id: 'email_templates', label: 'Email templates',
            webPath: '/cms/email-templates', icon: 'Mail',
            permissions: ['manage_system_settings'] },
          { id: 'testimonials', label: 'Testimonials', webPath: '/cms/testimonials',
            icon: 'Star', permissions: ['manage_cms'] },
          { id: 'reviews', label: 'Reviews', webPath: '/cms/reviews',
            icon: 'Star', permissions: ['manage_cms'] },
          { id: 'faqs', label: 'FAQs', webPath: '/cms/faqs', icon: 'HelpCircle',
            permissions: ['manage_cms'] },
        ],
      },
      { id: 'marketing_workspace', label: 'Marketing workspace', icon: 'Megaphone',
        module: 'marketing_workspace', children: [
          { id: 'mkt_overview', label: 'Overview', webPath: '/marketing',
            icon: 'LayoutGrid', permissions: ['manage_coupons'] },
          { id: 'mkt_campaigns', label: 'Campaigns', webPath: '/marketing/campaigns',
            icon: 'Target', permissions: ['manage_coupons'] },
          { id: 'mkt_calendar', label: 'Content calendar',
            webPath: '/marketing/calendar', icon: 'Calendar',
            permissions: ['manage_coupons'] },
          { id: 'mkt_social', label: 'Social posts', webPath: '/marketing/social',
            icon: 'Share2', permissions: ['manage_coupons'] },
          { id: 'mkt_planning', label: 'Planning & ideas',
            webPath: '/marketing/planning', icon: 'Lightbulb',
            permissions: ['manage_coupons'] },
          { id: 'mkt_tasks', label: 'Tasks', webPath: '/marketing/tasks',
            icon: 'ListTodo', permissions: ['manage_coupons'] },
          { id: 'mkt_lab', label: 'R&D & brainstorm', webPath: '/marketing/lab',
            icon: 'FlaskConical', permissions: ['manage_coupons'] },
        ],
      },
    ],
  },
  {
    id: 'people', title: 'People & messaging', icon: 'Users', order: 70,
    items: [
      { id: 'customers', label: 'Customers', webPath: '/users/customers',
        icon: 'Users', permissions: ['view_users'] },
      { id: 'team_members', label: 'Team members', webPath: '/users/members',
        icon: 'BadgeCheck', permissions: ['view_users'] },
      { id: 'notifications', label: 'Notifications', webPath: '/notifications',
        icon: 'Bell', permissions: ['view_notifications'] },
    ],
  },
  {
    id: 'knowledge', title: 'Knowledge kit', icon: 'BookOpen', order: 80,
    items: [
      { id: 'kk_overview', label: 'Guides overview', webPath: '/knowledge-kit',
        icon: 'BookOpen', permissions: ['view_dashboard'] },
    ],
  },
  {
    id: 'system', title: 'System', icon: 'Settings', order: 100,
    items: [
      { id: 'reports', label: 'Reports', webPath: '/reports', icon: 'LineChart',
        permissions: ['view_reports'] },
      { id: 'system_status', label: 'System status', webPath: '/system-status',
        icon: 'Cloud', permissions: ['view_system_status'] },
      { id: 'refund_requests', label: 'Refund requests',
        webPath: '/support/refund-requests', icon: 'Wallet',
        permissions: ['refund_payments'] },
      { id: 'support_tickets', label: 'Support tickets', webPath: '/support/tickets',
        icon: 'TicketPercent', permissions: ['view_dashboard'] },
      { id: 'settings', label: 'Settings', webPath: '/settings', icon: 'Settings',
        permissions: ['manage_settings'] },
      { id: 'access', label: 'Roles & access', webPath: '/settings/access',
        icon: 'Shield', permissions: ['manage_user_roles'] },
      { id: 'help', label: 'Help & support', webPath: '/support', icon: 'LifeBuoy',
        permissions: ['view_dashboard'] },
      { id: 'saas_platform', label: 'SaaS platform', webPath: '/settings/saas',
        icon: 'Building2', permissions: ['manage_settings'] },
      { id: 'organizations', label: 'Organizations', webPath: '/settings/tenants',
        icon: 'Building2', permissions: ['manage_system_settings'] },
    ],
  },
]
```

## 4. The pack loader (sidebar host code)

Place under `apps/admin-web/src/lib/loadVerticalSidebar.ts`:

```ts
import { coreSidebarGroups } from '@profixer/verticals-core/manifest'
import type { VerticalKey, SidebarGroupDef } from '@profixer/verticals-core/types'
import { homeServicesPack } from '@profixer/verticals-home-services/manifest'
// import { restaurantPack } from '@profixer/verticals-restaurant/manifest'

const packs: Record<VerticalKey, { sidebarGroups: SidebarGroupDef[] }> = {
  home_services: homeServicesPack,
  // restaurant: restaurantPack,
  // ...
}

export function loadSidebarForTenant(verticalKey: VerticalKey): SidebarGroupDef[] {
  const verticalGroups = packs[verticalKey]?.sidebarGroups ?? []
  return [...coreSidebarGroups, ...verticalGroups].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999),
  )
}
```

Then in `src/components/layout/sidebar.tsx`, replace the hardcoded `navigationGroups` array with:

```ts
const tenant = useAppSelector((s) => s.tenant)
const rawGroups = useMemo(
  () => loadSidebarForTenant(tenant.verticalKey ?? 'home_services'),
  [tenant.verticalKey],
)
const filteredGroups = useMemo(
  () => filterAdminNavigationByRouteAccess(rawGroups, checkRouteAccess),
  [rawGroups, checkRouteAccess],
)
```

`filterAdminNavigationByRouteAccess` keeps doing what it does today (RBAC). Module entitlement (`featureModules`) filtering can be added at the same boundary.

## 5. Validation strategy

When loading a pack, validate the manifest with **zod** at boot in dev mode so a malformed pack fails fast:

```ts
import { z } from 'zod'

const sidebarItemSchema = z.lazy(() => z.object({
  id: z.string(), label: z.string(),
  webPath: z.string().optional(), mobileScreen: z.string().optional(),
  icon: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  module: z.string().optional(),
  children: z.array(sidebarItemSchema).optional(),
  badgeKey: z.string().optional(),
}))

const verticalPackSchema = z.object({
  key: z.string(), label: z.string(), version: z.string(),
  sidebarGroups: z.array(z.object({
    id: z.string(), title: z.string(), order: z.number().optional(),
    items: z.array(sidebarItemSchema),
  })),
  // ...rest
})

if (import.meta.env.DEV) {
  verticalPackSchema.parse(homeServicesPack)
}
```

## 6. Testing the pack

Two layers of tests:

```ts
// 1. Manifest schema test (run in CI)
test('home_services pack passes schema validation', () => {
  expect(() => verticalPackSchema.parse(homeServicesPack)).not.toThrow()
})

// 2. Sidebar render test for a tenant with this pack
test('home_services tenant sees Operations group with Bookings link', () => {
  const groups = loadSidebarForTenant('home_services')
  const ops = groups.find((g) => g.id === 'operations')
  expect(ops?.items.some((i) => i.id === 'bookings')).toBe(true)
})

// 3. RBAC filtering test
test('user without view_bookings does NOT see Bookings link', () => {
  const groups = filterAdminNavigationByRouteAccess(
    loadSidebarForTenant('home_services'),
    () => false,  // deny all
  )
  expect(groups.find((g) => g.id === 'operations')?.items).toEqual([])
})
```
