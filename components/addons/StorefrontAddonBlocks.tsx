import Link from 'next/link'
import type { ReactNode } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { isAddonActive, STOREFRONT_ADDON_FLAGS } from '@/lib/storefrontAddons'
import {
  fetchAmcPackages,
  formatInr,
  type StorefrontAmcPackage,
  type StorefrontLoyaltySettings,
} from '@/lib/storefrontAddonsApi'

/**
 * Paid add-on homepage blocks (AMC offers, B2B / wholesale CTA, loyalty teaser).
 * Self-contained styling (own light surface + `--site-brand`) so the same blocks sit
 * cleanly above the footer of every theme, standard and layout alike.
 */

const brandBg = { backgroundColor: 'var(--site-brand, #4f46e5)' } as const
const brandText = { color: 'var(--site-brand, #4f46e5)' } as const

function durationLabel(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12
    return years === 1 ? '1 year' : `${years} years`
  }
  return months === 1 ? '1 month' : `${months} months`
}

export function AmcPlanCard({ pkg, ctaHref }: { pkg: StorefrontAmcPackage; ctaHref: string }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{pkg.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{pkg.summary}</p>
      <div className="mt-4 flex items-baseline gap-2">
        {typeof pkg.priceFrom === 'number' ? (
          <>
            <span className="text-2xl font-bold text-slate-900">{formatInr(pkg.priceFrom, pkg.currency)}</span>
            <span className="text-sm text-slate-500">/ {durationLabel(pkg.durationMonths)}</span>
          </>
        ) : (
          <span className="text-sm font-medium text-slate-700">{durationLabel(pkg.durationMonths)} plan</span>
        )}
      </div>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">
        {pkg.visitsIncluded > 0 && (
          <li className="flex gap-2">
            <span aria-hidden style={brandText}>✓</span>
            {pkg.visitsIncluded} scheduled visit{pkg.visitsIncluded === 1 ? '' : 's'}
          </li>
        )}
        {pkg.inclusions.slice(0, 6).map((inc) => (
          <li key={inc} className="flex gap-2">
            <span aria-hidden style={brandText}>✓</span>
            {inc}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        style={brandBg}
      >
        Get this plan
      </Link>
    </article>
  )
}

export function AmcOffersBlock({ packages }: { packages: StorefrontAmcPackage[] }) {
  if (!packages.length) return null
  return (
    <section className="sf-addon-amc bg-slate-50 py-16 text-slate-900" aria-labelledby="sf-amc-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={brandText}>
            Annual maintenance
          </p>
          <h2 id="sf-amc-title" className="mt-2 text-2xl font-bold sm:text-3xl">
            Worry-free maintenance plans
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-600">
            Scheduled visits, priority support and one predictable yearly price.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.slice(0, 6).map((pkg) => (
            <AmcPlanCard key={pkg.id} pkg={pkg} ctaHref={`/amc?plan=${encodeURIComponent(pkg.slug)}#enquire`} />
          ))}
        </div>
        {packages.length > 6 && (
          <div className="mt-8 text-center">
            <Link href="/amc" className="text-sm font-semibold hover:underline" style={brandText}>
              See all plans →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export function B2bPortalBlock() {
  return (
    <section className="sf-addon-b2b bg-white py-14 text-slate-900" aria-labelledby="sf-b2b-title">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-3xl border border-slate-200 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={brandText}>
            For businesses
          </p>
          <h2 id="sf-b2b-title" className="mt-2 text-2xl font-bold">
            Wholesale &amp; bulk orders
          </h2>
          <p className="mt-2 max-w-xl text-slate-600">
            Buying for a business, event or resale? Get volume pricing, GST invoices and a dedicated
            contact.
          </p>
        </div>
        <Link
          href="/wholesale"
          className="inline-flex shrink-0 rounded-full px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          style={brandBg}
        >
          Request a bulk quote
        </Link>
      </div>
    </section>
  )
}

export function LoyaltyTeaserBlock({ loyalty }: { loyalty?: StorefrontLoyaltySettings }) {
  const l = loyalty ?? {}
  const perks = (l.rewardsSummary ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4)
  const stats: Array<{ value: string; label: string }> = []
  if (l.pointsPer100Inr && l.pointsPer100Inr > 0) {
    stats.push({ value: `${l.pointsPer100Inr} pts`, label: 'for every ₹100 you spend' })
  }
  if (l.welcomeBonusPoints && l.welcomeBonusPoints > 0) {
    stats.push({ value: `${l.welcomeBonusPoints} pts`, label: 'welcome bonus when you join' })
  }
  if (l.pointValueInr && l.pointValueInr > 0) {
    stats.push({ value: `1 pt = ${formatInr(l.pointValueInr)}`, label: 'when you redeem' })
  }

  return (
    <section className="sf-addon-loyalty py-16 text-white" style={brandBg} aria-labelledby="sf-loyalty-title">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">Rewards</p>
        <h2 id="sf-loyalty-title" className="mt-2 text-2xl font-bold sm:text-3xl">
          {l.headline || 'Earn rewards every time you shop'}
        </h2>
        {perks.length > 0 && (
          <ul className="mx-auto mt-4 max-w-2xl space-y-1 text-white/90">
            {perks.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {stats.length > 0 && (
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/15 px-4 py-5">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="mt-1 text-sm text-white/85">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/account/login"
          className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white/90"
        >
          Join &amp; start earning
        </Link>
        {l.terms && <p className="mx-auto mt-6 max-w-2xl whitespace-pre-wrap text-xs text-white/75">{l.terms}</p>}
      </div>
    </section>
  )
}

/**
 * Loads + renders every active add-on block for the homepage. Returns `null` when none apply,
 * so themes can render `{addonsSlot}` unconditionally above their footer.
 */
export async function loadStorefrontAddonBlocks(
  tenantId: string,
  cfg: StorefrontConfig | null,
): Promise<ReactNode> {
  const amcOn = isAddonActive(cfg, STOREFRONT_ADDON_FLAGS.amc)
  const b2bOn = isAddonActive(cfg, STOREFRONT_ADDON_FLAGS.b2b)
  const loyaltyOn = isAddonActive(cfg, STOREFRONT_ADDON_FLAGS.loyalty)
  if (!amcOn && !b2bOn && !loyaltyOn) return null

  const packages = amcOn ? await fetchAmcPackages(tenantId) : []
  const blocks = [
    packages.length > 0 ? <AmcOffersBlock key="amc" packages={packages} /> : null,
    loyaltyOn ? <LoyaltyTeaserBlock key="loyalty" loyalty={cfg?.loyalty} /> : null,
    b2bOn ? <B2bPortalBlock key="b2b" /> : null,
  ].filter(Boolean)
  if (!blocks.length) return null
  return <div className="sf-addon-blocks">{blocks}</div>
}
