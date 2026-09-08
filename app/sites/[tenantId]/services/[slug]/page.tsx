import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter } from '@/themes/home-services/SiteFooter'
import { BookingForm } from '@/themes/home-services/BookingForm'
import { CallToAction } from '@/themes/home-services/CallToAction'
import { formatPrice } from '@/themes/home-services/ServiceCard'
import { toThemeTenant } from '@/themes/home-services/types'
import { TradeProHeader } from '@/themes/home-services/trade-pro/TradeProHeader'
import { TradeProFooter } from '@/themes/home-services/trade-pro/TradeProFooter'
import { TradeProFinalCta } from '@/themes/home-services/trade-pro/TradeProFinalCta'
import { fetchServiceBySlug, fetchServices, fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchStorefrontMenuLinks } from '@/lib/cms-content'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ tenantId: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const tenant = await loadHomeServicesTenant()
  const service = await fetchServiceBySlug(tenant.id, slug)
  if (!service) return { title: 'Service not found' }
  return {
    title: service.name,
    description: service.shortDescription ?? `Book ${service.name} with ${tenant.name}.`,
    openGraph: service.imageUrl
      ? { images: [{ url: service.imageUrl }] }
      : undefined,
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const tenant = await loadHomeServicesTenant()
  const themeTenant = toThemeTenant(tenant, tenant.fallbackTagline)
  const [service, related, config] = await Promise.all([
    fetchServiceBySlug(tenant.id, slug),
    fetchServices(tenant.id, 4),
    fetchStorefrontConfig(tenant.id),
  ])
  if (!service) notFound()

  const isTradePro = config?.themeKey === 'trade-pro'
  const [navLinks, footerLinks] = isTradePro
    ? await Promise.all([
        fetchStorefrontMenuLinks(tenant.id, 'header'),
        fetchStorefrontMenuLinks(tenant.id, 'footer'),
      ])
    : [undefined, undefined]
  const phone = config?.branding?.contactPhone

  const price = formatPrice(service.basePrice, service.currency)
  const duration =
    typeof service.durationMinutes === 'number' && service.durationMinutes > 0
      ? `${service.durationMinutes} min`
      : null

  return (
    <>
      {isTradePro ? (
        <TradeProHeader
          tenant={themeTenant}
          navLinks={navLinks}
          phone={phone}
          serviceArea={config?.branding?.address}
        />
      ) : (
        <SiteHeader tenant={themeTenant} />
      )}
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.3fr_1fr]">
          <article>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <span aria-hidden>←</span> All services
            </Link>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {service.name}
            </h1>
            {service.shortDescription && (
              <p className="mt-3 text-pretty text-lg text-slate-600">
                {service.shortDescription}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {price && (
                <Badge>
                  Starts at <strong className="ml-1">{price}</strong>
                </Badge>
              )}
              {duration && <Badge>{duration}</Badge>}
              {typeof service.rating === 'number' && service.rating > 0 && (
                <Badge>
                  ★ {service.rating.toFixed(1)}
                  {service.reviewCount ? ` · ${service.reviewCount} reviews` : ''}
                </Badge>
              )}
            </div>

            {service.imageUrl && (
              <div className="mt-8 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            )}

            {service.description && (
              <div className="mt-8 max-w-2xl whitespace-pre-line text-slate-700">
                {service.description}
              </div>
            )}
          </article>

          <aside className="lg:sticky lg:top-24">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Request this service</h2>
            <BookingForm
              tenantId={tenant.id}
              initialServiceSlug={service.slug}
              services={related}
              source={`service:${service.slug}`}
            />
          </aside>
        </section>

        {isTradePro ? <TradeProFinalCta phone={phone} /> : <CallToAction />}
      </main>
      {isTradePro ? (
        <TradeProFooter
          tenant={themeTenant}
          config={config}
          navLinks={footerLinks}
        />
      ) : (
        <SiteFooter tenant={themeTenant} />
      )}
    </>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
    >
      {children}
    </span>
  )
}
