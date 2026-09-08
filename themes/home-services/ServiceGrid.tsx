import Link from 'next/link'
import { ServiceCard } from './ServiceCard'
import type { PublicService } from './types'
import './home-services-shell.css'

export function ServiceGrid({
  services,
  title = 'Popular services',
  subtitle,
  showSeeAll = true,
  phone,
}: {
  services: PublicService[]
  title?: string
  subtitle?: string
  showSeeAll?: boolean
  phone?: string
}) {
  return (
    <section className="hs-container hs-services-section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
          {subtitle ? <p className="mt-3 text-base leading-7 text-slate-600">{subtitle}</p> : null}
        </div>
        {showSeeAll && services.length > 0 ? (
          <Link
            href="/services"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold hover:underline"
            style={{ color: 'var(--brand-primary, var(--site-brand))' }}
          >
            See all <span aria-hidden>→</span>
          </Link>
        ) : null}
      </div>

      <div className="mt-8 sm:mt-10">
        {services.length === 0 ? (
          <EmptyState phone={phone} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyState({ phone }: { phone?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center sm:px-10 sm:py-16">
      <p className="text-base font-semibold text-slate-900">Services coming soon</p>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
        Call us to ask what we offer — we&apos;ll help you find the right fix.
      </p>
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="mt-8 inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--brand-primary, var(--site-brand))' }}
        >
          Call {phone}
        </a>
      ) : (
        <Link
          href="/contact"
          className="mt-8 inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--brand-primary, var(--site-brand))' }}
        >
          Contact us
        </Link>
      )}
    </div>
  )
}
