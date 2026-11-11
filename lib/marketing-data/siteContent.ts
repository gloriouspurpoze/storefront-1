/**
 * Torq Studio marketing site — admin-editable content.
 *
 * The code in this package holds the defaults; admin (CMS → Torq Studio website) stores
 * *overrides* as three global static-content rows in fixer-backend (`platform-pricing`,
 * `platform-industries`, `platform-home`). The storefront merges them with
 * `resolvePlatformSiteContent`, and the admin form reads the same defaults, so both sides
 * agree on what an empty field means: "use the built-in copy".
 *
 * Everything coming from the API is untrusted JSON — every field is validated here, and
 * anything malformed falls back to the default instead of breaking the page.
 *
 * Mirrored at `storefront/lib/marketing-data/siteContent.ts` and `packages/marketing-data/src/siteContent.ts` — keep both identical.
 */
import { MARKETING_VERTICALS, type MarketingVertical, type VerticalKey } from './verticals'
import { marketingPlansForVertical } from './plans'
import type { VerticalPlanDef } from './plans/types'
import { getVerticalLandingContent, type VerticalLandingContent } from './landingContent'

/** Section → fixer-backend static-content key. */
export const PLATFORM_SITE_CONTENT_KEYS = {
  pricing: 'platform-pricing',
  industries: 'platform-industries',
  home: 'platform-home',
} as const
export type PlatformSiteSection = keyof typeof PLATFORM_SITE_CONTENT_KEYS

// ---------------------------------------------------------------- override shapes

export type PlanOverride = {
  label?: string
  description?: string
  priceMonthlyInr?: number
  /** `null` removes the struck-through price. */
  compareAtMonthlyInr?: number | null
  recommended?: boolean
  hidden?: boolean
}

export type LaunchOfferOverride = {
  enabled?: boolean
  label?: string
  headline?: string
  /** ISO date-time; the offer switches off by itself once it passes. */
  endsAt?: string
}

export type PricingOverrides = {
  /** Keyed by plan key (`hs_starter`…); several industries share one plan set. */
  plans?: Record<string, PlanOverride>
  launchOffer?: LaunchOfferOverride
}

export type TextCard = { title: string; body: string }

export type IndustryOverride = {
  hidden?: boolean
  label?: string
  description?: string
  eyebrow?: string
  title?: string
  titleAccent?: string
  subtitle?: string
  ctaLabel?: string
  pains?: TextCard[]
  pillars?: TextCard[]
}

export type IndustriesOverrides = Partial<Record<VerticalKey, IndustryOverride>>

/** Icons admin can pick for home cards — mapped to lucide icons by the storefront. */
export const HOME_ICON_KEYS = [
  'calendar',
  'target',
  'store',
  'receipt',
  'users',
  'chart',
  'lock',
  'key',
  'file-check',
  'credit-card',
  'timer',
  'rupee',
  'badge-check',
  'zap',
  'shield',
  'smartphone',
  'message',
  'globe',
] as const
export type HomeIconKey = (typeof HOME_ICON_KEYS)[number]

export type IconCard = TextCard & { icon: HomeIconKey }

export type HomeContent = {
  features: IconCard[]
  steps: TextCard[]
  trustPillars: IconCard[]
  guarantees: IconCard[]
}
export type HomeOverrides = Partial<HomeContent>

// ---------------------------------------------------------------- defaults

export const DEFAULT_LAUNCH_OFFER = {
  label: 'Launch offer',
  headline: '50% off every plan',
  endsAt: '2026-10-31T23:59:59+05:30',
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  features: [
    {
      icon: 'calendar',
      title: 'Bookings & orders',
      body: 'Take bookings and orders from every channel, assign your team and track each job to done.',
    },
    { icon: 'target', title: 'Built-in CRM', body: 'Leads, deals and follow-ups — fed by every booking automatically.' },
    { icon: 'store', title: 'Your own storefront', body: 'A branded site customers can book and buy from, on your domain.' },
    { icon: 'receipt', title: 'Billing & invoices', body: 'GST-ready invoices, payments and receivables in one place.' },
    { icon: 'users', title: 'Team & roles', body: 'Invite staff with role-based access. Everyone sees just what they need.' },
    { icon: 'chart', title: 'Real-time reports', body: 'Revenue, bookings and team performance at a glance — no spreadsheets.' },
  ],
  steps: [
    { title: 'Create your workspace', body: 'Sign up in under a minute. Your 14-day trial starts right away.' },
    { title: 'Pick your industry', body: 'We set up the right modules, menus and storefront for how you work.' },
    { title: 'Go live', body: 'Add services, invite your team and start taking bookings.' },
  ],
  trustPillars: [
    {
      icon: 'lock',
      title: 'Your data stays yours',
      body: 'Every business gets its own private workspace. Your customers, prices and reports are never shared with anyone else.',
    },
    {
      icon: 'key',
      title: 'Access you control',
      body: 'Role-based permissions mean staff see only what their job needs. Add or remove people in seconds.',
    },
    {
      icon: 'file-check',
      title: 'Compliance built in',
      body: 'GST-ready invoices and a clean record of payments and receivables, ready for your accountant.',
    },
  ],
  guarantees: [
    { icon: 'credit-card', title: 'No credit card', body: 'Try every feature free for 14 days.' },
    { icon: 'timer', title: 'Live in minutes', body: 'Industry-ready setup, no consultants needed.' },
    { icon: 'rupee', title: 'Honest INR pricing', body: 'One clear monthly price per plan.' },
    { icon: 'badge-check', title: 'Change plans anytime', body: 'Upgrade as your team and bookings grow.' },
  ],
}

/** Every distinct plan, with the industries that sell it — the admin pricing table. */
export function marketingPlanCatalog(): { plan: VerticalPlanDef; verticals: VerticalKey[] }[] {
  const byKey = new Map<string, { plan: VerticalPlanDef; verticals: VerticalKey[] }>()
  for (const v of MARKETING_VERTICALS) {
    for (const plan of marketingPlansForVertical(v.key)) {
      const row = byKey.get(plan.key)
      if (row) row.verticals.push(v.key)
      else byKey.set(plan.key, { plan, verticals: [v.key] })
    }
  }
  return Array.from(byKey.values())
}

// ---------------------------------------------------------------- validation

const MAX_SHORT = 120
const MAX_LONG = 600
const MAX_CARDS = 12
const MAX_PRICE_INR = 10_000_000

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function text(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.replace(/\s+/g, ' ').trim()
  return t ? t.slice(0, max) : undefined
}

function price(v: unknown): number | undefined {
  const n = typeof v === 'string' && v.trim() ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_PRICE_INR ? Math.round(n) : undefined
}

function textCards(v: unknown): TextCard[] | undefined {
  if (!Array.isArray(v)) return undefined
  const cards = v
    .map((c) => (isRecord(c) ? { title: text(c.title, MAX_SHORT), body: text(c.body, MAX_LONG) } : null))
    .filter((c): c is TextCard => Boolean(c?.title && c.body))
    .slice(0, MAX_CARDS)
  // An empty list would blank a whole section — treat it as "use the default".
  return cards.length ? cards : undefined
}

function iconCards(v: unknown, fallback: readonly IconCard[]): IconCard[] | undefined {
  const cards = textCards(v)
  if (!cards || !Array.isArray(v)) return undefined
  const icons = v.filter((c) => isRecord(c) && text(c.title, MAX_SHORT) && text(c.body, MAX_LONG)).map((c) => (c as Record<string, unknown>).icon)
  return cards.map((card, i) => ({
    ...card,
    icon: (HOME_ICON_KEYS as readonly unknown[]).includes(icons[i])
      ? (icons[i] as HomeIconKey)
      : (fallback[i]?.icon ?? fallback[0]?.icon ?? 'zap'),
  }))
}

// ---------------------------------------------------------------- resolve

export type ResolvedLaunchOffer = { label: string; headline: string; endsAt: string }

export type PlatformSiteContent = {
  /** Industries shown on the site, in the built-in order. */
  verticals: MarketingVertical[]
  isVisible(key: VerticalKey): boolean
  /** A visible industry by URL slug; hidden ones resolve to null (→ 404). */
  verticalBySlug(slug: string): MarketingVertical | null
  vertical(key: VerticalKey): MarketingVertical
  landing(key: VerticalKey): VerticalLandingContent
  plans(key: VerticalKey): VerticalPlanDef[]
  /** Null when admin switched the offer off. Use `launchOfferLive` for the deadline. */
  launchOffer: ResolvedLaunchOffer | null
  home: HomeContent
}

export function launchOfferLive(offer: ResolvedLaunchOffer | null, now = Date.now()): boolean {
  return Boolean(offer) && now < Date.parse(offer!.endsAt)
}

function resolvePlan(plan: VerticalPlanDef, raw: unknown): VerticalPlanDef | null {
  if (!isRecord(raw)) return plan
  if (raw.hidden === true) return null
  const next: VerticalPlanDef = { ...plan }
  next.label = text(raw.label, MAX_SHORT) ?? plan.label
  next.description = text(raw.description, MAX_LONG) ?? plan.description
  next.priceMonthlyInr = price(raw.priceMonthlyInr) ?? plan.priceMonthlyInr
  if (raw.compareAtMonthlyInr === null) delete next.compareAtMonthlyInr
  else next.compareAtMonthlyInr = price(raw.compareAtMonthlyInr) ?? plan.compareAtMonthlyInr
  if (typeof raw.recommended === 'boolean') next.recommended = raw.recommended
  return next
}

function resolveLaunchOffer(raw: unknown): ResolvedLaunchOffer | null {
  const o = isRecord(raw) ? raw : {}
  if (o.enabled === false) return null
  const endsAt = typeof o.endsAt === 'string' && !Number.isNaN(Date.parse(o.endsAt)) ? o.endsAt : DEFAULT_LAUNCH_OFFER.endsAt
  return {
    label: text(o.label, MAX_SHORT) ?? DEFAULT_LAUNCH_OFFER.label,
    headline: text(o.headline, MAX_SHORT) ?? DEFAULT_LAUNCH_OFFER.headline,
    endsAt,
  }
}

function resolveLanding(key: VerticalKey, raw: unknown): VerticalLandingContent {
  const base = getVerticalLandingContent(key)
  if (!isRecord(raw)) return base
  const pains = textCards(raw.pains)
  const pillars = textCards(raw.pillars)
  return {
    ...base,
    eyebrow: text(raw.eyebrow, MAX_SHORT) ?? base.eyebrow,
    title: text(raw.title, MAX_SHORT) ?? base.title,
    titleAccent: text(raw.titleAccent, MAX_SHORT) ?? base.titleAccent,
    subtitle: text(raw.subtitle, MAX_LONG) ?? base.subtitle,
    ctaLabel: text(raw.ctaLabel, 40) ?? base.ctaLabel,
    // Cards keep the built-in icon in the same position.
    pains: pains ? pains.map((p, i) => ({ ...p, icon: (base.pains[i] ?? base.pains[0]).icon })) : base.pains,
    pillars: pillars ? pillars.map((p, i) => ({ ...p, icon: (base.pillars[i] ?? base.pillars[0]).icon })) : base.pillars,
  }
}

/** Merge admin overrides (raw API JSON, any shape) onto the built-in site content. */
export function resolvePlatformSiteContent(raw: { pricing?: unknown; industries?: unknown; home?: unknown } = {}): PlatformSiteContent {
  const pricing = isRecord(raw.pricing) ? raw.pricing : {}
  const planOverrides = isRecord(pricing.plans) ? pricing.plans : {}
  const industries = isRecord(raw.industries) ? raw.industries : {}
  const home = isRecord(raw.home) ? raw.home : {}

  const industry = (key: VerticalKey) => (isRecord(industries[key]) ? (industries[key] as Record<string, unknown>) : {})
  const allVerticals = MARKETING_VERTICALS.map((v) => {
    const o = industry(v.key)
    return {
      vertical: {
        ...v,
        label: text(o.label, 60) ?? v.label,
        description: text(o.description, MAX_LONG) ?? v.description,
      },
      hidden: o.hidden === true,
    }
  })
  const byKey = new Map(allVerticals.map((row) => [row.vertical.key, row]))

  return {
    verticals: allVerticals.filter((r) => !r.hidden).map((r) => r.vertical),
    isVisible: (key) => byKey.get(key)?.hidden === false,
    verticalBySlug: (slug) => allVerticals.find((r) => !r.hidden && r.vertical.marketingSlug === slug)?.vertical ?? null,
    vertical: (key) => byKey.get(key)?.vertical ?? allVerticals[0].vertical,
    landing: (key) => resolveLanding(key, industries[key]),
    plans: (key) =>
      marketingPlansForVertical(key)
        .map((p) => resolvePlan(p, planOverrides[p.key]))
        .filter((p): p is VerticalPlanDef => p !== null),
    launchOffer: resolveLaunchOffer(pricing.launchOffer),
    home: {
      features: iconCards(home.features, DEFAULT_HOME_CONTENT.features) ?? DEFAULT_HOME_CONTENT.features,
      steps: textCards(home.steps) ?? DEFAULT_HOME_CONTENT.steps,
      trustPillars: iconCards(home.trustPillars, DEFAULT_HOME_CONTENT.trustPillars) ?? DEFAULT_HOME_CONTENT.trustPillars,
      guarantees: iconCards(home.guarantees, DEFAULT_HOME_CONTENT.guarantees) ?? DEFAULT_HOME_CONTENT.guarantees,
    },
  }
}
