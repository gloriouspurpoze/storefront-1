/**
 * Homepage copy for torqerp.com (ported from the admin's AdminLandingPage).
 *
 * Trust claims must stay verifiable against the product — no invented customer
 * counts, ratings, testimonials or certifications. Add those only once they are real.
 */
import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  BarChart3,
  Calendar,
  CreditCard,
  FileCheck2,
  IndianRupee,
  KeyRound,
  Lock,
  Receipt,
  Store,
  Target,
  Timer,
  Users,
} from 'lucide-react'
import { PLATFORM_BRAND } from '../config'

export const HOME_TITLE = `${PLATFORM_BRAND} — Bookings, CRM, storefront & billing in one workspace`
export const HOME_DESCRIPTION = `${PLATFORM_BRAND} is an all-in-one business platform for service, restaurant and retail businesses: bookings and orders, built-in CRM, a branded storefront, GST-ready invoicing and team roles. 14-day free trial, INR pricing.`

export const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Calendar,
    title: 'Bookings & orders',
    body: 'Take bookings and orders from every channel, assign your team and track each job to done.',
  },
  { icon: Target, title: 'Built-in CRM', body: 'Leads, deals and follow-ups — fed by every booking automatically.' },
  { icon: Store, title: 'Your own storefront', body: 'A branded site customers can book and buy from, on your domain.' },
  { icon: Receipt, title: 'Billing & invoices', body: 'GST-ready invoices, payments and receivables in one place.' },
  { icon: Users, title: 'Team & roles', body: 'Invite staff with role-based access. Everyone sees just what they need.' },
  {
    icon: BarChart3,
    title: 'Real-time reports',
    body: 'Revenue, bookings and team performance at a glance — no spreadsheets.',
  },
]

export const STEPS = [
  { title: 'Create your workspace', body: 'Sign up in under a minute. Your 14-day trial starts right away.' },
  { title: 'Pick your industry', body: 'We set up the right modules, menus and storefront for how you work.' },
  { title: 'Go live', body: 'Add services, invite your team and start taking bookings.' },
]

export const TRUST_PILLARS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Lock,
    title: 'Your data stays yours',
    body: 'Every business gets its own private workspace. Your customers, prices and reports are never shared with anyone else.',
  },
  {
    icon: KeyRound,
    title: 'Access you control',
    body: 'Role-based permissions mean staff see only what their job needs. Add or remove people in seconds.',
  },
  {
    icon: FileCheck2,
    title: 'Compliance built in',
    body: 'GST-ready invoices and a clean record of payments and receivables, ready for your accountant.',
  },
]

export const GUARANTEES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: CreditCard, title: 'No credit card', body: 'Try every feature free for 14 days.' },
  { icon: Timer, title: 'Live in minutes', body: 'Industry-ready setup, no consultants needed.' },
  { icon: IndianRupee, title: 'Honest INR pricing', body: 'One clear monthly price per plan.' },
  { icon: BadgeCheck, title: 'Change plans anytime', body: 'Upgrade as your team and bookings grow.' },
]

/** Answers buyers (and AI assistants) look for; rendered as visible FAQ + FAQPage structured data. */
export const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: `What is ${PLATFORM_BRAND}?`,
    a: `${PLATFORM_BRAND} is an all-in-one platform for small and growing businesses. It combines bookings and orders, a CRM, a branded online storefront, GST-ready invoicing, team roles and reports in one workspace, set up for your industry.`,
  },
  {
    q: `Who is ${PLATFORM_BRAND} for?`,
    a: 'Home services, restaurants, salons and spas, retail and D2C brands, fitness studios, real estate, B2B services, clinics and education businesses that have outgrown spreadsheets, WhatsApp and disconnected apps.',
  },
  {
    q: `How much does ${PLATFORM_BRAND} cost?`,
    a: 'Plans are priced monthly in Indian rupees (INR), and every plan starts with a 14-day free trial. See the pricing page for current plans for your industry.',
  },
  {
    q: 'Do I need a credit card to start the free trial?',
    a: 'No. You can create a workspace and use every feature for 14 days without a credit card.',
  },
  {
    q: 'Can customers book and pay on my own website?',
    a: `Yes. Every workspace includes a branded storefront that customers can book and buy from, and you can connect your own domain. ${PLATFORM_BRAND} charges a subscription, not a commission on your bookings.`,
  },
  {
    q: 'Are invoices GST-ready?',
    a: 'Yes. Invoices, payments and receivables are recorded in one place in a GST-ready format your accountant can use.',
  },
]

