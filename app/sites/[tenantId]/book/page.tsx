import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter } from '@/themes/home-services/SiteFooter'
import { BookingForm } from '@/themes/home-services/BookingForm'
import { toThemeTenant } from '@/themes/home-services/types'
import { TradeProHeader } from '@/themes/home-services/trade-pro/TradeProHeader'
import { TradeProFooter } from '@/themes/home-services/trade-pro/TradeProFooter'
import { fetchServices, fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadHomeServicesTenant()
  return {
    title: 'Book a service',
    description: `Request a callback from ${tenant.name} — we respond within one business day.`,
  }
}

export default async function BookPage() {
  const tenant = await loadHomeServicesTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const [services, config] = await Promise.all([
    fetchServices(tenant.id, 24),
    fetchStorefrontConfig(tenant.id),
  ])
  const isTradePro = config?.themeKey === 'trade-pro'
  const [navLinks, footerLinks] = isTradePro
    ? await Promise.all([
        fetchStorefrontMenuLinks(tenant.id, 'header'),
        fetchStorefrontMenuLinks(tenant.id, 'footer'),
      ])
    : [undefined, undefined]

  return (
    <>
      {isTradePro ? (
        <TradeProHeader tenant={themeTenant} navLinks={navLinks} phone={config?.branding?.contactPhone} />
      ) : (
        <SiteHeader tenant={themeTenant} />
      )}
      <main className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Book a service
            </p>
            <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Tell us what you need.
            </h1>
            <p className="mt-4 max-w-lg text-pretty text-lg text-slate-600">
              Share a few details and our team will match you with a verified pro. No account
              required, no obligation.
            </p>
            <ul className="mt-10 space-y-4 text-sm text-slate-700">
              <Bullet accent={isTradePro}>One business day response.</Bullet>
              <Bullet accent={isTradePro}>Verified, background-checked professionals.</Bullet>
              <Bullet accent={isTradePro}>Pay only after the visit is complete.</Bullet>
              <Bullet accent={isTradePro}>Free re-visit if you&apos;re not satisfied.</Bullet>
            </ul>
          </div>
          <BookingForm tenantId={tenant.id} services={services} source="book-page" />
        </div>
      </main>
      {isTradePro ? (
        <TradeProFooter
          tenant={themeTenant}
          navLinks={footerLinks}
          phone={config?.branding?.contactPhone}
          email={config?.branding?.contactEmail}
          address={config?.branding?.address}
        />
      ) : (
        <SiteFooter tenant={themeTenant} />
      )}
    </>
  )
}

function Bullet({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${accent ? 'text-[var(--tp-ink)]' : 'text-white'}`}
        style={{ backgroundColor: accent ? 'var(--tp-accent)' : 'var(--site-brand)' }}
        aria-hidden
      >
        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5 10 9 14 15 6" />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  )
}
