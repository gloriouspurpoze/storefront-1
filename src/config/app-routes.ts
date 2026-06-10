/**
 * Single source for quick navigation (⌘K), breadcrumb labels, and page titles.
 * Extend when adding new routes.
 */

export type QuickNavGroup =
  | 'Overview'
  | 'Finance'
  | 'CRM'
  | 'Catalog'
  | 'E-commerce'
  | 'Bazaar'
  | 'Operations'
  | 'Boards'
  | 'Content & marketing'
  | 'Users & communication'
  | 'System'
  | 'Provider'
  | 'Professional'

export interface QuickNavItem {
  label: string
  path: string
  group: QuickNavGroup
  keywords?: string
}

/** Flat list for command palette — order within group is menu order */
export const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { label: 'Dashboard', path: '/', group: 'Overview' },
  { label: 'Analytics', path: '/analytics', group: 'Overview' },
  {
    label: 'Growth funnels',
    path: '/analytics/funnels',
    group: 'Overview',
    keywords: 'cohort activation conversion demand',
  },

  { label: 'Finance overview', path: '/finance/overview', group: 'Finance', keywords: 'expenses budget pnl cashflow' },
  {
    label: 'Subscriptions',
    path: '/subscriptions',
    group: 'Finance',
    keywords: 'plans recurring revenue mrr arr subscribers membership churn billing',
  },
  {
    label: 'Subscription plans',
    path: '/subscriptions/plans',
    group: 'Finance',
    keywords: 'pricing tier customer provider catalog membership plus pro elite',
  },
  {
    label: 'Subscribers',
    path: '/subscriptions/subscribers',
    group: 'Finance',
    keywords: 'active trial paused churn cancel pause resume extend subscription lifecycle',
  },
  {
    label: 'AMC contracts',
    path: '/amc/overview',
    group: 'Operations',
    keywords: 'annual maintenance contract visits renewal AC RO purifier home service profixer',
  },
  {
    label: 'AMC packages',
    path: '/amc/packages',
    group: 'Operations',
    keywords: 'annual maintenance catalogue published website profixer',
  },
  {
    label: 'Documents & signatures',
    path: '/company-documents/overview',
    group: 'Operations',
    keywords:
      'policy agreement PDF onboarding hiring termination NDA contractor customer provider acknowledgement esign email profixer',
  },
  {
    label: 'Document templates',
    path: '/company-documents/templates',
    group: 'Operations',
    keywords: 'library HTML markdown compliance safety liability',
  },
  {
    label: 'Signature envelopes',
    path: '/company-documents/envelopes',
    group: 'Operations',
    keywords: 'send email sign link recipient audit',
  },
  {
    label: 'Rate cards hub',
    path: '/rate-cards/overview',
    group: 'Operations',
    keywords: 'pricing tariff customer provider playbook SKU platform service profixer POS',
  },
  {
    label: 'Customer rate matrix',
    path: '/rate-cards/customer',
    group: 'Operations',
    keywords: 'published catalog spare parts indicative pricing',
  },
  {
    label: 'Provider rate playbook',
    path: '/rate-cards/provider',
    group: 'Operations',
    keywords: 'payout technician visit margin partner internal',
  },
  {
    label: 'Catalog pricing table',
    path: '/rate-cards/catalog',
    group: 'Operations',
    keywords: 'platform services products SKU list price',
  },
  {
    label: 'Finance operating costs',
    path: '/finance/operating',
    group: 'Finance',
    keywords: 'daily monthly tea travel rent aws cloud telecom utilities budget opex',
  },
  { label: 'Finance expenses', path: '/finance/expenses', group: 'Finance', keywords: 'bills vendors approval' },
  { label: 'Finance budgets', path: '/finance/budgets', group: 'Finance', keywords: 'forecast opex' },
  { label: 'Finance directory', path: '/finance/directory', group: 'Finance', keywords: 'accounts vendors categories' },
  { label: 'Finance reconciliation', path: '/finance/reconciliation', group: 'Finance', keywords: 'csv bank statement match' },
  { label: 'Finance recurring', path: '/finance/recurring', group: 'Finance', keywords: 'subscription schedule' },

  { label: 'CRM overview', path: '/crm', group: 'CRM' },
  { label: 'Leads', path: '/crm/leads', group: 'CRM' },
  { label: 'Contacts', path: '/crm/contacts', group: 'CRM' },
  { label: 'B2B accounts', path: '/crm/companies', group: 'CRM' },
  { label: 'Deals', path: '/crm/deals', group: 'CRM' },
  { label: 'Activities', path: '/crm/activities', group: 'CRM' },
  { label: 'CRM settings', path: '/crm/settings', group: 'CRM' },

  { label: 'Team work', path: '/team-work', group: 'Operations', keywords: 'tasks jira kanban sprint' },
  { label: 'Team calendar', path: '/team-work/calendar', group: 'Operations', keywords: 'meet google due schedule ceremony' },

  { label: 'Category management', path: '/categories', group: 'Catalog' },
  { label: 'Product categories', path: '/categories/products', group: 'Catalog' },
  { label: 'Service categories', path: '/categories/services', group: 'Catalog' },
  { label: 'Platform services', path: '/platform-services', group: 'Catalog' },
  { label: 'Marketplace', path: '/marketplace', group: 'Catalog' },
  { label: 'Professionals', path: '/professionals', group: 'Catalog', keywords: 'technicians workers supply' },
  {
    label: 'Workforce dashboard',
    path: '/professionals/operations',
    group: 'Catalog',
    keywords: 'fleet workload pipeline assignments',
  },
  { label: 'Provider applications', path: '/provider-applications', group: 'Catalog' },

  { label: 'Store overview', path: '/ecommerce', group: 'E-commerce' },
  { label: 'Products', path: '/products', group: 'E-commerce' },
  { label: 'Inventory', path: '/inventory', group: 'E-commerce' },
  { label: 'Orders', path: '/orders', group: 'E-commerce' },

  { label: 'Offers & listing chats', path: '/bazaar', group: 'Bazaar' },
  { label: 'Listing review', path: '/bazaar/listing-review', group: 'Bazaar' },
  {
    label: 'Bazaar module & AI',
    path: '/bazaar/module-settings',
    group: 'Bazaar',
    keywords: 'vision photo check assist semantic draft',
  },
  { label: 'Pro-Verify queue', path: '/bazaar/pro-verify', group: 'Bazaar' },

  { label: 'Bookings', path: '/bookings', group: 'Operations' },
  {
    label: 'Industry operations',
    path: '/operations',
    group: 'Operations',
    keywords: 'ceo command trust disputes supply payouts ops spine',
  },
  {
    label: 'Ops command center',
    path: '/operations/command-center',
    group: 'Operations',
    keywords: 'queues pending sla exceptions triage',
  },
  {
    label: 'Trust & disputes',
    path: '/operations/trust',
    group: 'Operations',
    keywords: 'refund ticket moderation safety',
  },
  {
    label: 'Supply quality',
    path: '/operations/supply-quality',
    group: 'Operations',
    keywords: 'rating tier workforce verification',
  },
  {
    label: 'Payouts playbook',
    path: '/operations/payouts-playbook',
    group: 'Operations',
    keywords: 'gst fee ledger transparency',
  },
  {
    label: 'Dispute cases',
    path: '/operations/dispute-cases',
    group: 'Operations',
    keywords: 'sla audit evidence trust case',
  },
  {
    label: 'Commercial terms & cities',
    path: '/operations/commercial/terms',
    group: 'Operations',
    keywords: 'convenience fee training commission GST provider city zone multiplier profixer POS',
  },
  {
    label: 'Professional assets',
    path: '/operations/provider-assets',
    group: 'Operations',
    keywords: 'fleet toolkit van tool spare PPE technician professional inventory approve request catalog profixer',
  },
  {
    label: 'Conduct & incentives',
    path: '/operations/professional-conduct',
    group: 'Operations',
    keywords: 'HR workforce penalty warning fine reward audit technician professional governance',
  },
  { label: 'Service requests', path: '/requests', group: 'Operations', keywords: 'operations leads' },
  { label: 'Quotes', path: '/quotes', group: 'Operations' },
  { label: 'Payments', path: '/payments', group: 'Operations' },
  { label: 'Invoices', path: '/invoices', group: 'Operations' },
  { label: 'Create invoice', path: '/invoices/create', group: 'Operations', keywords: 'manual pdf gst' },
  { label: 'Invoice appearance', path: '/invoices/branding', group: 'Operations', keywords: 'logo branding colours gst pdf' },
  { label: 'Earnings & payouts', path: '/payouts', group: 'Operations' },
  { label: 'Chat', path: '/chat', group: 'Operations' },

  { label: 'Boards', path: '/boards', group: 'Boards', keywords: 'whiteboard canvas sticky notes brainstorm meet meeting notes' },

  { label: 'CMS overview', path: '/cms', group: 'Content & marketing' },
  { label: 'Homepage', path: '/cms/homepage', group: 'Content & marketing' },
  { label: 'Site appearance', path: '/cms/site-appearance', group: 'Content & marketing', keywords: 'theme tokens branding colors' },
  { label: 'Pages', path: '/cms/pages', group: 'Content & marketing' },
  { label: 'Menus', path: '/cms/menus', group: 'Content & marketing' },
  { label: 'Blog posts', path: '/cms/blogs', group: 'Content & marketing' },
  { label: 'Blog categories', path: '/cms/blog-categories', group: 'Content & marketing' },
  {
    label: 'Sliders & site banners',
    path: '/sliders',
    group: 'Content & marketing',
    keywords: 'carousel hero pop-up announcement cms banners',
  },
  { label: 'Coupons & promo codes', path: '/coupons', group: 'Content & marketing' },
  { label: 'Referrals', path: '/referrals', group: 'Content & marketing' },
  { label: 'Newsletter', path: '/cms/newsletter', group: 'Content & marketing' },
  { label: 'Social links', path: '/cms/social-links', group: 'Content & marketing' },
  { label: 'Testimonials', path: '/cms/testimonials', group: 'Content & marketing' },
  { label: 'Reviews (CMS)', path: '/cms/reviews', group: 'Content & marketing' },
  { label: 'FAQs', path: '/cms/faqs', group: 'Content & marketing' },
  {
    label: 'Industry service pages',
    path: '/cms/category-marketing',
    group: 'Content & marketing',
    keywords: 'landing seo locality rate card cross linking',
  },
  {
    label: 'Industry service areas',
    path: '/cms/category-marketing?tab=service-areas',
    group: 'Content & marketing',
    keywords: 'hyperlocal locality slug mumbai service catalog',
  },
  { label: 'Industry rate card', path: '/cms/category-marketing?tab=rate-card', group: 'Content & marketing' },
  {
    label: 'Industry cross-linking',
    path: '/cms/category-marketing?tab=cross-linking',
    group: 'Content & marketing',
  },
  {
    label: 'Pricing category meta',
    path: '/cms/pricing-category-meta',
    group: 'Content & marketing',
    keywords: 'pricing answer engine summary rate card comparison ai overview perplexity mumbai',
  },
  {
    label: 'SEO landing pages',
    path: '/cms/seo-landing-pages',
    group: 'Content & marketing',
    keywords: 'cost problems guide provider programmatic seo landing template',
  },
  { label: 'Media library', path: '/cms/media', group: 'Content & marketing' },
  { label: 'SEO management', path: '/cms/seo', group: 'Content & marketing' },
  { label: 'Marketing workspace', path: '/marketing', group: 'Content & marketing', keywords: 'calendar social planning' },
  { label: 'Marketing campaigns', path: '/marketing/campaigns', group: 'Content & marketing', keywords: 'program launch kpi' },
  { label: 'Content calendar', path: '/marketing/calendar', group: 'Content & marketing', keywords: 'editorial schedule' },
  { label: 'Social posts', path: '/marketing/social', group: 'Content & marketing', keywords: 'instagram linkedin organic' },
  { label: 'Planning & ideas', path: '/marketing/planning', group: 'Content & marketing', keywords: 'backlog campaign' },
  { label: 'Marketing tasks', path: '/marketing/tasks', group: 'Content & marketing', keywords: 'todo checklist' },
  { label: 'R&D & brainstorm', path: '/marketing/lab', group: 'Content & marketing', keywords: 'research hypothesis' },

  { label: 'Customers', path: '/users/customers', group: 'Users & communication' },
  { label: 'Team members', path: '/users/members', group: 'Users & communication' },
  { label: 'Notifications', path: '/notifications', group: 'Users & communication' },
  { label: 'Messages', path: '/messages', group: 'Users & communication' },

  {
    label: 'Knowledge kit',
    path: '/knowledge-kit',
    group: 'System',
    keywords: 'guides documentation how it works playbook training admin',
  },
  {
    label: 'Guide: Content & marketing',
    path: '/knowledge-kit/content-marketing',
    group: 'System',
    keywords: 'cms blog seo sliders coupons referrals workspace playbook',
  },
  {
    label: 'Guide: Commercial terms',
    path: '/knowledge-kit/operations-commercial-terms',
    group: 'System',
    keywords: 'fees commissions convenience GST POS checkout tenant provider customer',
  },
  { label: 'Reports', path: '/reports', group: 'System' },
  { label: 'Refund requests', path: '/support/refund-requests', group: 'System' },
  { label: 'System status', path: '/system-status', group: 'System' },
  { label: 'Settings', path: '/settings', group: 'System' },
  { label: 'Storefront Studio', path: '/settings/storefront', group: 'System', keywords: 'website seo branding theme' },
  {
    label: 'Roles & access',
    path: '/settings/access',
    group: 'System',
    keywords: 'rbac permissions roles route guards',
  },
  {
    label: 'Assign access',
    path: '/settings/access/assign',
    group: 'System',
    keywords: 'team permissions edit_user manage_user_roles',
  },
  { label: 'SaaS platform', path: '/settings/saas', group: 'System', keywords: 'tenant billing checklist multi' },
  { label: 'Organizations', path: '/settings/tenants', group: 'System', keywords: 'tenants onboard saas clients' },
  { label: 'Help & support', path: '/support', group: 'System' },

  { label: 'Provider dashboard', path: '/provider/dashboard', group: 'Provider' },
  { label: 'Provider bookings', path: '/provider/bookings', group: 'Provider' },
  { label: 'Provider earnings', path: '/provider/earnings', group: 'Provider' },
  { label: 'Provider profile', path: '/provider/profile', group: 'Provider' },

  { label: 'Professional dashboard', path: '/professional/dashboard', group: 'Professional' },
  { label: 'Professional bookings', path: '/professional/bookings', group: 'Professional' },
  { label: 'Professional earnings', path: '/professional/earnings', group: 'Professional' },
  { label: 'Professional services', path: '/professional/services', group: 'Professional' },
  { label: 'Professional profile', path: '/professional/profile', group: 'Professional' },
  { label: 'Reviews & ratings', path: '/professional/reviews', group: 'Professional' },
  { label: 'Documents', path: '/professional/documents', group: 'Professional' },
  { label: 'Professional settings', path: '/professional/settings', group: 'Professional' },
]

const pathToLabel = new Map<string, string>()
QUICK_NAV_ITEMS.forEach((item) => {
  pathToLabel.set(item.path, item.label)
})

/** Dynamic / edit patterns — first match wins (order matters) */
const SEGMENT_TITLE_RULES: { test: RegExp; title: string }[] = [
  { test: /^\/products\/add$/, title: 'Add product' },
  { test: /^\/products\/edit\/[^/]+$/, title: 'Edit product' },
  { test: /^\/products\/edit$/, title: 'Edit product' },
  { test: /^\/products\/view\/[^/]+$/, title: 'View product' },
  { test: /^\/categories\/(products|services)\/create$/, title: 'Create category' },
  { test: /^\/categories\/(products|services)\/edit\/[^/]+$/, title: 'Edit category' },
  { test: /^\/categories\/(products|services)\/view\/[^/]+$/, title: 'View category' },
  { test: /^\/categories\/create$/, title: 'Create category' },
  { test: /^\/categories\/edit\/[^/]+$/, title: 'Edit category' },
  { test: /^\/categories\/edit$/, title: 'Edit category' },
  { test: /^\/categories\/view\/[^/]+$/, title: 'View category' },
  { test: /^\/platform-services\/create$/, title: 'Create service' },
  { test: /^\/platform-services\/edit\/[^/]+$/, title: 'Edit service' },
  { test: /^\/platform-services\/edit$/, title: 'Edit service' },
  { test: /^\/providers\/create$/, title: 'Create provider' },
  { test: /^\/providers\/edit\/[^/]+$/, title: 'Edit provider' },
  { test: /^\/providers\/edit$/, title: 'Edit provider' },
  { test: /^\/professionals\/create$/, title: 'Create professional' },
  { test: /^\/operations\/command-center$/, title: 'Ops command center' },
  { test: /^\/operations\/trust$/, title: 'Trust & disputes' },
  { test: /^\/operations\/supply-quality$/, title: 'Supply quality' },
  { test: /^\/operations\/payouts-playbook$/, title: 'Payouts playbook' },
  { test: /^\/operations\/dispute-cases$/, title: 'Dispute cases' },
  { test: /^\/operations\/commercial\/cities$/, title: 'Operating cities' },
  { test: /^\/operations\/commercial\/terms$/, title: 'Commercial terms' },
  { test: /^\/operations\/commercial\/?$/, title: 'Commercial & cities' },
  { test: /^\/operations\/professional-conduct$/, title: 'Conduct & incentives' },
  { test: /^\/operations$/, title: 'Industry operations' },
  { test: /^\/analytics\/funnels$/, title: 'Growth funnels' },
  { test: /^\/professionals\/operations$/, title: 'Workforce operations' },
  { test: /^\/professionals\/(?!edit\/|create|operations$)[^/]+$/, title: 'Professional command center' },
  { test: /^\/professionals\/edit\//, title: 'Edit professional' },
  { test: /^\/bookings\/[^/]+$/, title: 'Booking details' },
  { test: /^\/subscriptions\/plans\/new$/, title: 'New plan' },
  { test: /^\/subscriptions\/plans\/[^/]+\/edit$/, title: 'Edit plan' },
  { test: /^\/subscriptions\/plans$/, title: 'Plans' },
  { test: /^\/subscriptions\/subscribers$/, title: 'Subscribers' },
  { test: /^\/subscriptions$/, title: 'Subscriptions' },
  { test: /^\/cms\/blogs\/new$/, title: 'New blog post' },
  { test: /^\/cms\/blogs\/[^/]+\/edit$/, title: 'Edit blog post' },
  { test: /^\/cms\/homepage\/new$/, title: 'Homepage section' },
  { test: /^\/cms\/homepage\/[^/]+$/, title: 'Homepage section' },
  { test: /^\/settings\/access\/permissions\/[^/]+$/, title: 'Permission detail' },
  { test: /^\/settings\/access\/roles\/[^/]+$/, title: 'Role detail' },
  { test: /^\/settings\/access\/routes$/, title: 'Route guards' },
  { test: /^\/settings\/access\/permissions$/, title: 'Permissions' },
  { test: /^\/settings\/access\/roles$/, title: 'Roles' },
  { test: /^\/settings\/access$/, title: 'Roles & access' },
  { test: /^\/settings\/access\/assign$/, title: 'Assign access' },
]

function titleForPath(pathname: string): string {
  if (pathname === '/') return 'Dashboard'

  const exact = pathToLabel.get(pathname)
  if (exact) return exact

  for (const rule of SEGMENT_TITLE_RULES) {
    if (rule.test.test(pathname)) return rule.title
  }

  const parts = pathname.split('/').filter(Boolean)
  const last = parts[parts.length - 1] || 'Page'
  if (/^[a-f0-9-]{8,}$/i.test(last) || /^\d+$/.test(last)) {
    const parent = '/' + parts.slice(0, -1).join('/')
    const parentTitle = pathToLabel.get(parent)
    if (parentTitle) return parentTitle
  }

  return last
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export interface BreadcrumbItem {
  label: string
  to: string
}

/**
 * Builds trail: Dashboard > … > current page. Omits crumbs on home.
 */
export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  if (pathname === '/') return []

  const items: BreadcrumbItem[] = [{ label: 'Dashboard', to: '/' }]
  const segments = pathname.split('/').filter(Boolean)
  let acc = ''
  for (let i = 0; i < segments.length; i++) {
    acc += '/' + segments[i]
    const isLast = i === segments.length - 1
    const label = isLast ? titleForPath(pathname) : titleForPath(acc)
    items.push({ label, to: acc })
  }

  return items
}

export function getPageTitle(pathname: string): string {
  return titleForPath(pathname)
}
