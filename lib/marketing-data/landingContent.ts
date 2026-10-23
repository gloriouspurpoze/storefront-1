/**
 * Per-vertical ICP landing page copy — one dedicated page per industry pack
 * so a shareable URL (`/landing/:slug`, e.g. `/for-restaurants`) speaks to
 * that operator's specific pain points instead of a generic pitch.
 */
import type { VerticalKey } from './verticals'

export type PainIconKey = 'fragmented' | 'margin' | 'blind' | 'noshow' | 'manual' | 'churn'
export type PillarIconKey =
  | 'console'
  | 'storefront'
  | 'crm'
  | 'team'
  | 'booking'
  | 'billing'
  | 'catalog'
  | VerticalKey

export type VerticalLandingContent = {
  eyebrow: string
  title: string
  titleAccent: string
  subtitle: string
  proof: readonly { value: string; label: string }[]
  pains: readonly { icon: PainIconKey; title: string; body: string }[]
  pillars: readonly { icon: PillarIconKey; title: string; body: string }[]
  testimonial: { quote: string; name: string; role: string; initials: string }
  stats: readonly { value: string; suffix?: string; label: string }[]
  faq: readonly { q: string; a: string }[]
  ctaLabel: string
  isEarlyAccess: boolean
}

/** Fully productized packs with dedicated sidebars — everything else ships as early access. */
export const PRODUCTIZED_VERTICAL_KEYS: readonly VerticalKey[] = ['home_services', 'restaurant', 'salon']

export const VERTICAL_LANDING_CONTENT: Record<VerticalKey, VerticalLandingContent> = {
  home_services: {
    eyebrow: 'Home services & repair platform',
    title: 'Stop losing jobs to WhatsApp chaos and marketplace apps.',
    titleAccent: 'Run bookings, AMC, and your field team from one console.',
    subtitle:
      'Plumbers, electricians, AC, pest control, and cleaning brands use Torq Studio to dispatch jobs, renew AMC contracts, and keep 100% of direct revenue — with a mobile app for every technician.',
    proof: [
      { value: '0%', label: 'commission on direct bookings' },
      { value: '1', label: 'app for owner, ops & field techs' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'fragmented',
        title: 'Inbound leads go cold',
        body: 'Leads land in WhatsApp, missed calls, and paper — no one owns follow-up until the job is gone.',
      },
      {
        icon: 'noshow',
        title: 'Dispatch runs on guesswork',
        body: 'Assigning technicians by phone means double-bookings, late arrivals, and no live view of who is free.',
      },
      {
        icon: 'margin',
        title: 'Marketplace apps eat your margin',
        body: 'Aggregators take 20–30% per job and keep the customer relationship — repeat business never comes back to you.',
      },
    ],
    pillars: [
      {
        icon: 'home_services',
        title: 'Job dispatch & AMC',
        body: 'Bookings, quotes, AMC renewals, and technician assignment in one operations board.',
      },
      {
        icon: 'storefront',
        title: 'Branded booking site',
        body: 'Customers book directly on your domain — no commission, no middleman.',
      },
      {
        icon: 'crm',
        title: 'CRM that renews contracts',
        body: 'AMC renewals, follow-ups, and repeat bookings tracked automatically in the pipeline.',
      },
    ],
    testimonial: {
      quote:
        'We replaced three apps and a shared inbox. Every lead is in CRM, every job is on the board, and the owner sees margin daily.',
      name: 'Rohan S.',
      role: 'Owner, multi-outlet home services',
      initials: 'RS',
    },
    stats: [
      { value: '38', suffix: '%', label: 'faster lead follow-up' },
      { value: '0', suffix: '%', label: 'commission on direct jobs' },
      { value: '3', suffix: '×', label: 'fewer tools to manage' },
    ],
    faq: [
      {
        q: 'Do you take commission on my bookings?',
        a: 'No. Your branded storefront and admin console are subscription-based — you keep 100% of direct revenue.',
      },
      {
        q: 'Can my field technicians use this without a laptop?',
        a: 'Yes. The admin mobile app covers dispatch and the live map; the Professional app gives each technician their jobs, earnings, and chat.',
      },
      {
        q: 'What happens to our AMC renewals?',
        a: 'AMC contracts, renewal dates, and follow-up tasks live in the same tenant as bookings and CRM — nothing to track in a separate spreadsheet.',
      },
    ],
    ctaLabel: 'Start free trial',
    isEarlyAccess: false,
  },

  restaurant: {
    eyebrow: 'Restaurant & QSR platform',
    title: 'Stop paying Zomato and Swiggy for your own customers.',
    titleAccent: 'Run your menu, orders, and loyalty from one console.',
    subtitle:
      'Cafés, QSRs, and multi-outlet restaurants use Torq Studio for a commission-free ordering site, table QR menus, POS, and a repeat-customer CRM — without juggling five delivery-app dashboards.',
    proof: [
      { value: '0%', label: 'commission on direct orders' },
      { value: '1', label: 'menu synced across web, QR & POS' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'margin',
        title: 'Aggregators take 20–30% commission',
        body: 'Every order through a delivery app hands them the customer and a third of your margin.',
      },
      {
        icon: 'blind',
        title: 'No visibility into repeat guests',
        body: 'Orders across delivery apps and walk-ins never connect — you cannot run a win-back campaign you cannot see.',
      },
      {
        icon: 'manual',
        title: 'Menu changes mean five logins',
        body: 'Updating a price or 86-ing a dish means editing it separately on every delivery app and your own POS.',
      },
    ],
    pillars: [
      {
        icon: 'restaurant',
        title: 'Menu, POS & KOT',
        body: 'One menu drives your storefront, QR ordering, and kitchen ticket flow — update once, everywhere.',
      },
      {
        icon: 'storefront',
        title: 'Commission-free ordering site',
        body: 'Your own domain and checkout for delivery and pickup — guests reorder without an aggregator in between.',
      },
      {
        icon: 'crm',
        title: 'Loyalty that brings guests back',
        body: 'Every order feeds a CRM built for win-back campaigns, not enterprise sales teams.',
      },
    ],
    testimonial: {
      quote:
        'Our own ordering site pays for itself in week one — zero commission and guests reorder because we own the relationship.',
      name: 'Priya N.',
      role: 'Founder, café & bakery',
      initials: 'PN',
    },
    stats: [
      { value: '0', suffix: '%', label: 'commission on direct orders' },
      { value: '38', suffix: '%', label: 'faster lead follow-up' },
      { value: '3', suffix: '×', label: 'fewer tools to manage' },
    ],
    faq: [
      {
        q: 'Is this only for delivery, or dine-in too?',
        a: 'Both. Table QR codes take dine-in orders straight to your kitchen, while your storefront handles delivery and pickup — all on the same menu and POS.',
      },
      {
        q: 'Do you take commission on orders?',
        a: 'No. Torq Studio is subscription-based — every direct order keeps 100% of its margin.',
      },
      {
        q: 'Can I still list on Zomato/Swiggy alongside this?',
        a: 'Yes. Most operators keep aggregators for discovery and use their Torq Studio storefront and QR menu to convert repeat guests off-commission.',
      },
    ],
    ctaLabel: 'Start free trial',
    isEarlyAccess: false,
  },

  salon: {
    eyebrow: 'Salon & spa platform',
    title: 'Stop losing appointments to no-shows and phone-tag.',
    titleAccent: 'Run bookings, stylists, and retail from one console.',
    subtitle:
      'Salons, spas, and barbershops use Torq Studio for online appointment booking, stylist scheduling, retail checkout, and a loyalty program that brings clients back — on your own branded site.',
    proof: [
      { value: '0%', label: 'commission on direct bookings' },
      { value: '1', label: 'calendar for every stylist' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'noshow',
        title: 'No-shows drain the day',
        body: 'Phone-booked appointments with no reminders or deposits leave chairs empty and staff idle.',
      },
      {
        icon: 'churn',
        title: 'Clients do not come back',
        body: 'Without a loyalty record, a great first visit rarely turns into a repeat client on your books.',
      },
      {
        icon: 'manual',
        title: 'Staff commission is a spreadsheet',
        body: 'Tracking who serviced which client, for how much, and their cut still happens by hand at month end.',
      },
    ],
    pillars: [
      {
        icon: 'salon',
        title: 'Appointments & stylist calendars',
        body: 'Online booking, staff schedules, and service duration — no more double-booked chairs.',
      },
      {
        icon: 'storefront',
        title: 'Branded booking & retail site',
        body: 'Clients book and buy retail products on your domain — you keep the relationship and the margin.',
      },
      {
        icon: 'crm',
        title: 'Loyalty that fills the calendar',
        body: 'Visit history, packages, and win-back campaigns tracked automatically per client.',
      },
    ],
    testimonial: {
      quote:
        'Clients book online now instead of calling — no-shows dropped and our stylists finally see their own commission in real time.',
      name: 'Neha V.',
      role: 'Owner, salon & spa chain',
      initials: 'NV',
    },
    stats: [
      { value: '42', suffix: '%', label: 'fewer no-shows with reminders' },
      { value: '0', suffix: '%', label: 'commission on direct bookings' },
      { value: '3', suffix: '×', label: 'fewer tools to manage' },
    ],
    faq: [
      {
        q: 'Can clients pick a specific stylist when booking?',
        a: "Yes. Clients choose a service, stylist, and time slot; your team sees every chair's schedule in one calendar.",
      },
      {
        q: 'Do you take commission on bookings?',
        a: 'No. Torq Studio is subscription-based — you keep 100% of every booking and retail sale.',
      },
      {
        q: 'Can I sell retail products alongside services?',
        a: 'Yes. Your storefront and POS share one catalog, so retail products and services check out together.',
      },
    ],
    ctaLabel: 'Start free trial',
    isEarlyAccess: false,
  },

  retail: {
    eyebrow: 'Retail & D2C platform',
    title: 'Stop paying marketplace fees for customers you never see again.',
    titleAccent: 'Run your storefront, inventory, and orders from one console.',
    subtitle:
      'Retail and D2C brands use Torq Studio for a branded storefront, unified inventory across channels, and a CRM that turns one-time buyers into repeat customers — without giving up margin to a marketplace.',
    proof: [
      { value: '0%', label: 'commission on direct orders' },
      { value: '1', label: 'inventory feed across storefront & POS' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'margin',
        title: 'Marketplace fees eat your margin',
        body: 'Every order through a marketplace hands over 15–30% and the buyer\'s contact details — to them, not you.',
      },
      {
        icon: 'blind',
        title: 'Stock counts never match',
        body: 'Selling across a marketplace, a storefront, and a store counter means stock drifts out of sync and you oversell.',
      },
      {
        icon: 'churn',
        title: 'One-time buyers stay one-time',
        body: 'Without order history in one place, there is no repeat-purchase or win-back play — just a one-off sale.',
      },
    ],
    pillars: [
      {
        icon: 'catalog',
        title: 'Catalog & inventory, unified',
        body: 'One product catalog and stock count across your storefront, POS, and marketplace channels.',
      },
      {
        icon: 'storefront',
        title: 'Branded storefront checkout',
        body: 'Your domain, your theme, your checkout — customers buy direct and you keep the margin.',
      },
      {
        icon: 'crm',
        title: 'CRM built for repeat purchase',
        body: 'Order history feeds segments for win-back, upsell, and loyalty — no export to a spreadsheet.',
      },
    ],
    testimonial: {
      quote:
        'We finally see one stock number instead of three. Direct orders on our own site now outsell every marketplace channel combined.',
      name: 'Karan M.',
      role: 'Founder, D2C retail brand',
      initials: 'KM',
    },
    stats: [
      { value: '0', suffix: '%', label: 'commission on direct orders' },
      { value: '3', suffix: '×', label: 'fewer tools to manage' },
      { value: '48', suffix: 'h', label: 'typical go-live window' },
    ],
    faq: [
      {
        q: 'Can I sell on marketplaces and my own storefront at the same time?',
        a: 'Yes. Inventory syncs across channels, so you keep marketplace reach while growing commission-free direct orders.',
      },
      {
        q: 'Do you take a cut of my sales?',
        a: 'No. Torq Studio is subscription-based — every direct order keeps 100% of its margin.',
      },
      {
        q: 'Does it handle both online and in-store checkout?',
        a: 'Yes. Your storefront and POS share one catalog and inventory count, so in-store and online sales stay in sync.',
      },
    ],
    ctaLabel: 'Start free trial',
    isEarlyAccess: false,
  },

  marketplace: {
    eyebrow: 'Multi-vendor marketplace platform',
    title: 'Launch a marketplace without building one from scratch.',
    titleAccent: 'Sellers, split checkout, and payouts in one console.',
    subtitle:
      'Curated marketplaces use Torq Studio to onboard sellers, give each one a storefront page, take a single payment that splits into per-seller orders, and settle commissions and payouts automatically.',
    proof: [
      { value: '1', label: 'checkout for every seller in the cart' },
      { value: 'Auto', label: 'commission & payout ledger' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'manual',
        title: 'Seller onboarding lives in spreadsheets',
        body: 'Applications by email, KYC in a folder, listings pasted in by hand — every new seller costs a day of ops.',
      },
      {
        icon: 'fragmented',
        title: 'One cart, many sellers, no split',
        body: 'Generic store builders take one payment for one merchant. Splitting orders and shipping per seller becomes manual work.',
      },
      {
        icon: 'margin',
        title: 'Commissions and payouts by hand',
        body: 'Working out who is owed what after fees, refunds, and shipping every week is slow and error-prone.',
      },
    ],
    pillars: [
      {
        icon: 'marketplace',
        title: 'Seller storefronts & directory',
        body: 'Each seller gets a branded page with listings, policies, and ratings; buyers browse sellers or search everything.',
      },
      {
        icon: 'billing',
        title: 'Split checkout, per-seller orders',
        body: 'One Razorpay payment becomes a sub-order per seller with its own shipping, tracking, and status.',
      },
      {
        icon: 'console',
        title: 'Commission & payout ledger',
        body: 'Per-seller commission rates, a running balance, and payout batches you approve in one click.',
      },
    ],
    testimonial: {
      quote:
        'We went from a WhatsApp group of makers to a real marketplace in a week. Sellers manage their own listings and payouts reconcile themselves.',
      name: 'Aditi S.',
      role: 'Founder, handmade-goods marketplace',
      initials: 'AS',
    },
    stats: [
      { value: '100', suffix: '+', label: 'sellers per tenant, no extra setup' },
      { value: '1', label: 'payment, split per seller' },
      { value: '48', suffix: 'h', label: 'typical go-live window' },
    ],
    faq: [
      {
        q: 'How do sellers join?',
        a: 'Sellers apply from your storefront. You review and approve them in admin, and they get a seller portal to manage listings, orders, and earnings.',
      },
      {
        q: 'How are payments split between sellers?',
        a: 'The buyer pays once. Each seller gets a sub-order, and the ledger records your commission and the seller\'s net amount for the next payout batch.',
      },
      {
        q: 'Can I set different commission rates per seller?',
        a: 'Yes. There is a marketplace-wide default, and you can override it per seller.',
      },
    ],
    ctaLabel: 'Start free trial',
    isEarlyAccess: true,
  },

  fitness: {
    eyebrow: 'Fitness & studios — early access',
    title: 'Stop chasing memberships on a spreadsheet.',
    titleAccent: 'Run classes, passes, and members from one console.',
    subtitle:
      'Gyms, studios, and trainers use Torq Studio to sell memberships and class passes on a branded site, run a lead pipeline for trial members, and keep trainer schedules — all in one tenant.',
    proof: [
      { value: 'Early', label: 'access · dedicated fitness workflows' },
      { value: '1', label: 'console for owner & trainers' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'manual',
        title: 'Memberships live in a spreadsheet',
        body: 'Renewal dates, freezes, and pass balances get tracked by hand — until someone gets billed wrong.',
      },
      {
        icon: 'fragmented',
        title: 'Trial leads never convert',
        body: 'Walk-in and web trial requests have no owner, so most never turn into a paying membership.',
      },
      {
        icon: 'noshow',
        title: 'Class schedules double-book',
        body: 'Trainers and rooms get booked by phone or WhatsApp, with no live view of capacity.',
      },
    ],
    pillars: [
      {
        icon: 'fitness',
        title: 'Classes, passes & trainer schedules',
        body: 'Sell memberships and class passes, and keep every trainer\'s calendar in one place.',
      },
      {
        icon: 'storefront',
        title: 'Branded booking site',
        body: 'Members buy passes and book classes on your domain — no marketplace commission.',
      },
      {
        icon: 'crm',
        title: 'CRM for trial-to-member',
        body: 'Every trial inquiry becomes a tracked lead with follow-up, not a name on a sign-in sheet.',
      },
    ],
    testimonial: {
      quote:
        "We're an early-access studio and already replaced three sign-up sheets with one booking calendar our trainers actually check.",
      name: 'Aditi R.',
      role: 'Owner, fitness studio (early access)',
      initials: 'AR',
    },
    stats: [
      { value: '0', suffix: '%', label: 'commission on direct memberships' },
      { value: '3', suffix: '×', label: 'fewer tools to manage' },
      { value: '14', suffix: 'd', label: 'free trial, setup included' },
    ],
    faq: [
      {
        q: 'Do you take commission on memberships?',
        a: 'No. Torq Studio is subscription-based — you keep 100% of membership and pass revenue.',
      },
      {
        q: 'Can trainers see their own schedule?',
        a: 'Yes, via the admin mobile app today; a dedicated trainer app experience is on the fitness roadmap.',
      },
      {
        q: 'Is there a mobile app for members?',
        a: 'Members book through your branded web storefront today; a member-facing app is part of the fitness roadmap.',
      },
      {
        q: "What's ready today for fitness studios?",
        a: 'You get the full Torq Studio core today — CRM, bookings, branded storefront, invoicing, and team tools — configured for class and membership scheduling. A dedicated fitness dashboard ships next; early-access studios get white-glove setup and priority input on the roadmap.',
      },
    ],
    ctaLabel: 'Join early access',
    isEarlyAccess: true,
  },

  real_estate: {
    eyebrow: 'Real estate — early access',
    title: 'Stop losing buyer leads across five portals.',
    titleAccent: 'Run listings, viewings, and your pipeline from one console.',
    subtitle:
      'Brokers and agencies use Torq Studio to publish listings on a branded site, book viewings, and run a CRM pipeline for every enquiry — instead of chasing leads across portals and spreadsheets.',
    proof: [
      { value: 'Early', label: 'access · dedicated real estate workflows' },
      { value: '1', label: 'pipeline for every agent' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'fragmented',
        title: 'Leads scatter across portals',
        body: 'Enquiries from listing portals, WhatsApp, and walk-ins never land in one pipeline with a clear owner.',
      },
      {
        icon: 'blind',
        title: 'No visibility into agent follow-up',
        body: 'Without a shared pipeline, you cannot see which leads an agent is chasing — or which ones went cold.',
      },
      {
        icon: 'manual',
        title: 'Viewings get booked by phone',
        body: 'Scheduling a site visit means back-and-forth calls with no shared calendar or confirmation trail.',
      },
    ],
    pillars: [
      {
        icon: 'real_estate',
        title: 'Listings & viewing bookings',
        body: 'Publish listings on your branded site and let buyers book viewings directly.',
      },
      {
        icon: 'crm',
        title: 'Deal pipeline for every enquiry',
        body: 'Every enquiry becomes a tracked deal with stage, owner, and follow-up — not a WhatsApp thread.',
      },
      {
        icon: 'team',
        title: 'Agent & team accountability',
        body: 'See which agent owns which lead and where every deal sits, from one console.',
      },
    ],
    testimonial: {
      quote:
        'Early access, but our agents already stopped losing enquiries in WhatsApp — every lead has an owner and a stage now.',
      name: 'Vikram T.',
      role: 'Broker, real estate agency (early access)',
      initials: 'VT',
    },
    stats: [
      { value: '38', suffix: '%', label: 'faster lead follow-up' },
      { value: '0', suffix: '%', label: 'commission on your deals' },
      { value: '3', suffix: '×', label: 'fewer tools to manage' },
    ],
    faq: [
      {
        q: 'Do you take a cut of my deals?',
        a: 'No. Torq Studio is subscription-based — commission and deal value are entirely yours.',
      },
      {
        q: 'Can I list properties with photos and pricing?',
        a: 'Yes, through the branded storefront catalog; a dedicated listings layout is on the real estate roadmap.',
      },
      {
        q: 'How does viewing scheduling work?',
        a: 'Buyers request a slot from your storefront and it lands on the same booking calendar your team already uses.',
      },
      {
        q: "What's ready today for real estate brokers?",
        a: 'You get the full Torq Studio core today — CRM pipeline, bookings, branded storefront, and team tools — configured for enquiry-to-viewing workflows. A dedicated listings dashboard is next on the roadmap; early-access brokers get white-glove setup and direct input on it.',
      },
    ],
    ctaLabel: 'Join early access',
    isEarlyAccess: true,
  },

  b2b_services: {
    eyebrow: 'B2B & professional services — early access',
    title: 'Stop running your deal pipeline out of a spreadsheet.',
    titleAccent: 'Run deals, quotes, and delivery from one console.',
    subtitle:
      'Agencies and professional services firms use Torq Studio for a deal-led CRM pipeline, quotation-to-invoice flow, and team task tracking — replacing the spreadsheet-and-email stack most B2B teams run on.',
    proof: [
      { value: 'Early', label: 'access · dedicated B2B workflows' },
      { value: '1', label: 'pipeline from quote to invoice' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'fragmented',
        title: "Deals live in someone's inbox",
        body: 'Without a shared pipeline, deal status depends on asking the one rep who has the context.',
      },
      {
        icon: 'manual',
        title: 'Quote-to-invoice is manual',
        body: 'Quotes, approvals, and invoices get built separately for every client, with no link back to the deal.',
      },
      {
        icon: 'blind',
        title: 'No read on team capacity',
        body: 'Delivery tasks and client work sit in separate tools from the pipeline that sold them.',
      },
    ],
    pillars: [
      {
        icon: 'b2b_services',
        title: 'Deal pipeline, your stages',
        body: 'Contacts, companies, and deals with owner accountability — built for how B2B actually sells.',
      },
      {
        icon: 'billing',
        title: 'Quotes, invoices & documents',
        body: 'Send a quotation, get it accepted, and invoice from the same record — no re-entry.',
      },
      {
        icon: 'team',
        title: 'Delivery task tracking',
        body: 'Turn a won deal into tracked delivery work for your team, in the same tenant.',
      },
    ],
    testimonial: {
      quote:
        "We're early access, but the CRM already replaced our shared spreadsheet — every deal has a stage and an owner instead of a comment thread.",
      name: 'Sana K.',
      role: 'COO, B2B services agency (early access)',
      initials: 'SK',
    },
    stats: [
      { value: '38', suffix: '%', label: 'faster lead follow-up' },
      { value: '3', suffix: '×', label: 'fewer tools to manage' },
      { value: '48', suffix: 'h', label: 'typical go-live window' },
    ],
    faq: [
      {
        q: 'Can I send quotations and invoices from the same system?',
        a: 'Yes. Quotes, accept/decline, and GST-ready invoices live in the same tenant as the deal that created them.',
      },
      {
        q: 'Is this only for sales, or delivery too?',
        a: 'Both. Won deals can hand off into team task tracking, so sales and delivery share one source of truth.',
      },
      {
        q: 'Do you take commission on my contracts?',
        a: 'No. Torq Studio is subscription-based — every deal and contract value stays yours.',
      },
      {
        q: "What's ready today for B2B services firms?",
        a: 'You get the full Torq Studio core today — CRM pipeline, quotations, invoicing, and team task tracking. A dedicated B2B dashboard and reporting pack are next on the roadmap; early-access firms get white-glove setup and priority input.',
      },
    ],
    ctaLabel: 'Join early access',
    isEarlyAccess: true,
  },

  healthcare: {
    eyebrow: 'Clinics & practitioners — early access',
    title: 'Stop booking appointments over the phone.',
    titleAccent: 'Run appointments, records, and follow-ups from one console.',
    subtitle:
      'Clinics and practitioners use Torq Studio for online appointment booking, a unified patient contact record, and automatic follow-up reminders — instead of a phone-and-register front desk.',
    proof: [
      { value: 'Early', label: 'access · dedicated healthcare workflows' },
      { value: '1', label: 'record per patient, every visit' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'noshow',
        title: 'Phone booking means missed slots',
        body: 'Appointments booked by phone leave no reminder trail — patients forget, and slots go empty.',
      },
      {
        icon: 'fragmented',
        title: 'Patient records live in a register',
        body: 'Visit history and contact details are scattered across paper and spreadsheets, not one record.',
      },
      {
        icon: 'churn',
        title: 'Follow-ups fall through',
        body: 'Without a tracked pipeline, recall visits and follow-up care depend on someone remembering to call.',
      },
    ],
    pillars: [
      {
        icon: 'healthcare',
        title: 'Appointment booking',
        body: 'Patients book online; your team sees one calendar across practitioners and rooms.',
      },
      {
        icon: 'crm',
        title: 'Patient record & follow-up',
        body: 'Every patient is a contact with visit history and automatic follow-up reminders.',
      },
      {
        icon: 'storefront',
        title: 'Branded booking site',
        body: 'Your domain, your booking flow — no third-party directory app in between.',
      },
    ],
    testimonial: {
      quote:
        "Early access, but patients already book online instead of calling — our front desk finally has time for the patients in the room.",
      name: 'Dr. Meera J.',
      role: 'Practitioner, multi-clinic practice (early access)',
      initials: 'MJ',
    },
    stats: [
      { value: '42', suffix: '%', label: 'fewer missed appointments' },
      { value: '0', suffix: '%', label: 'commission on bookings' },
      { value: '3', suffix: '×', label: 'fewer tools to manage' },
    ],
    faq: [
      {
        q: 'Is patient data isolated and secure?',
        a: 'Yes. Every tenant is scoped by organization end-to-end, and access is role-based per staff member.',
      },
      {
        q: 'Can patients book with a specific practitioner?',
        a: 'Yes. Patients choose a practitioner, service, and slot; your team sees every calendar in one view.',
      },
      {
        q: 'Do you take commission on appointments?',
        a: 'No. Torq Studio is subscription-based — you keep 100% of consultation and service revenue.',
      },
      {
        q: "What's ready today for clinics?",
        a: 'You get the full Torq Studio core today — booking calendar, patient CRM, branded storefront, and team tools. A dedicated clinical records layout is next on the roadmap; early-access clinics get white-glove setup and priority input.',
      },
    ],
    ctaLabel: 'Join early access',
    isEarlyAccess: true,
  },

  education: {
    eyebrow: 'Coaching & education — early access',
    title: 'Stop losing enrollment leads to a missed call.',
    titleAccent: 'Run enrollment, classes, and fees from one console.',
    subtitle:
      'Coaching institutes, tutors, and schools use Torq Studio for an enrollment CRM, class and session booking, and fee invoicing — instead of tracking admissions on a register.',
    proof: [
      { value: 'Early', label: 'access · dedicated education workflows' },
      { value: '1', label: 'pipeline from enquiry to enrollment' },
      { value: '14d', label: 'free trial · setup included' },
    ],
    pains: [
      {
        icon: 'fragmented',
        title: 'Enquiries never get a follow-up',
        body: 'Admission enquiries come in by call and form, with no one owning the follow-up until enrollment is lost.',
      },
      {
        icon: 'manual',
        title: 'Fee collection is manual',
        body: 'Tracking who paid, who is due, and sending reminders still happens by hand each month.',
      },
      {
        icon: 'noshow',
        title: 'Class schedules clash',
        body: 'Batches, tutors, and rooms get booked by memory, with no live view of what is already full.',
      },
    ],
    pillars: [
      {
        icon: 'education',
        title: 'Class & batch scheduling',
        body: 'Sessions, tutors, and rooms in one calendar — no more double-booked batches.',
      },
      {
        icon: 'crm',
        title: 'Enrollment CRM pipeline',
        body: 'Every enquiry becomes a tracked lead through trial, enrollment, and renewal.',
      },
      {
        icon: 'billing',
        title: 'Fee invoicing & reminders',
        body: 'Invoice fees and track dues from the same tenant as your enrollment pipeline.',
      },
    ],
    testimonial: {
      quote:
        "We're early access, but enquiry follow-up already moved off a register and into a pipeline our counsellors actually use.",
      name: 'Farhan A.',
      role: 'Director, coaching institute (early access)',
      initials: 'FA',
    },
    stats: [
      { value: '38', suffix: '%', label: 'faster enquiry follow-up' },
      { value: '0', suffix: '%', label: 'commission on your fees' },
      { value: '3', suffix: '×', label: 'fewer tools to manage' },
    ],
    faq: [
      {
        q: 'Can parents or students pay fees online?',
        a: 'Yes. Fee invoicing runs through the same storefront and payments the platform uses for orders and bookings.',
      },
      {
        q: 'Do you take a cut of tuition fees?',
        a: 'No. Torq Studio is subscription-based — every fee and enrollment stays yours.',
      },
      {
        q: 'Can I manage multiple batches and tutors?',
        a: 'Yes. Batches, tutors, and rooms share one scheduling calendar across your institute.',
      },
      {
        q: "What's ready today for coaching institutes?",
        a: 'You get the full Torq Studio core today — enrollment CRM, class scheduling, fee invoicing, and a branded storefront. A dedicated academics dashboard is next on the roadmap; early-access institutes get white-glove setup and priority input.',
      },
    ],
    ctaLabel: 'Join early access',
    isEarlyAccess: true,
  },
}

export function getVerticalLandingContent(key: VerticalKey): VerticalLandingContent {
  return VERTICAL_LANDING_CONTENT[key] ?? VERTICAL_LANDING_CONTENT.home_services
}
