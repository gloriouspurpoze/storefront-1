import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter } from '@/themes/home-services/SiteFooter'
import { BookingForm } from '@/themes/home-services/BookingForm'
import { toThemeTenant } from '@/themes/home-services/types'
import { TradeProHeader } from '@/themes/home-services/trade-pro/TradeProHeader'
import { TradeProFooter } from '@/themes/home-services/trade-pro/TradeProFooter'
import { TradeProShellClient } from '@/themes/home-services/trade-pro/TradeProShellClient'
import { fetchServices, fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'
import { redirect } from 'next/navigation'
import { bookingAddonActive, ENQUIRY_PATH } from '@/themes/home-services/bookingAddon'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadHomeServicesTenant()
  return {
    title: 'Book a service',
    description: `Book a visit with ${tenant.name} — pick a service, date and time slot.`,
  }
}

interface BookPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v
  return s?.trim() || undefined
}

/**
 * Service booking add-on (`showBooking`). When the add-on is not active the page redirects to
 * the always-available contact / enquiry form (QR codes and old links keep working).
 */
export default async function BookPage({ searchParams }: BookPageProps) {
  const tenant = await loadHomeServicesTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const [services, config, query] = await Promise.all([
    fetchServices(tenant.id, 24),
    fetchStorefrontConfig(tenant.id),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ])
  if (!bookingAddonActive(config)) redirect(ENQUIRY_PATH)

  const requestedSlug = firstParam(query.service)
  const initialServiceSlug = services.some((s) => s.slug === requestedSlug) ? requestedSlug : undefined
  const src = firstParam(query.src)
  const source = src ? `book-page:${src}`.slice(0, 64) : 'book-page'
  const form = (
    <BookingForm
      tenantId={tenant.id}
      services={services}
      initialServiceSlug={initialServiceSlug}
      source={source}
      mode="booking"
    />
  )
  const isTradePro = config?.themeKey === 'trade-pro'
  const [navLinks, footerLinks] = isTradePro
    ? await Promise.all([
        fetchStorefrontMenuLinks(tenant.id, 'header'),
        fetchStorefrontMenuLinks(tenant.id, 'footer'),
      ])
    : [undefined, undefined]

  if (isTradePro) {
    return (
      <TradeProShellClient tenantId={tenant.id}>
        <TradeProHeader
          tenant={themeTenant}
          navLinks={navLinks}
          phone={config?.branding?.contactPhone}
          serviceArea={config?.branding?.address}
        />
        <main className="bg-[var(--tp-canvas-soft,#f4f6f9)] py-16 sm:py-20">
          <div className="sf-container grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="sf-page-eyebrow">
                Book a service
              </p>
              <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Pick a service and a time.
              </h1>
              <p className="mt-4 max-w-lg text-pretty text-lg text-slate-600">
                Choose the service, your preferred date and time slot. We&apos;ll call you to confirm
                the visit.
              </p>
              <ul className="mt-10 space-y-4 text-sm text-slate-700">
                <Bullet>Pick a date and a morning, afternoon or evening slot.</Bullet>
                <Bullet>Verified, background-checked professionals.</Bullet>
                <Bullet>Pay only after the visit is complete.</Bullet>
                <Bullet>We call back within 2 hours.</Bullet>
              </ul>
            </div>
            {form}
          </div>
        </main>
        <TradeProFooter tenant={themeTenant} config={config} navLinks={footerLinks} />
      </TradeProShellClient>
    )
  }

  return (
    <>
      <SiteHeader tenant={themeTenant} bookingEnabled />
      <main className="bg-slate-50 py-16 sm:py-20">
        <div className="sf-container grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="sf-page-eyebrow">
              Book a service
            </p>
            <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Book a visit.
            </h1>
            <p className="mt-4 max-w-lg text-pretty text-lg text-slate-600">
              Pick a service and a preferred slot — our team will match you with a verified pro
              and call to confirm.
            </p>
            <ul className="mt-10 space-y-4 text-sm text-slate-700">
              <Bullet>One business day response.</Bullet>
              <Bullet>Verified, background-checked professionals.</Bullet>
              <Bullet>Pay only after the visit is complete.</Bullet>
              <Bullet>Free re-visit if you&apos;re not satisfied.</Bullet>
            </ul>
          </div>
          {form}
        </div>
      </main>
      <SiteFooter tenant={themeTenant} bookingEnabled />
    </>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--tp-ink)]"
        style={{ backgroundColor: 'var(--tp-accent, #FE9D16)' }}
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
