import Link from 'next/link'
import { ServiceCard } from './ServiceCard'
import type { PublicService } from './types'

export function ServiceGrid({
  services,
  title = 'Popular services',
  subtitle,
  showSeeAll = true,
}: {
  services: PublicService[]
  title?: string
  subtitle?: string
  showSeeAll?: boolean
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
        </div>
        {showSeeAll && services.length > 0 && (
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            style={{ color: 'var(--site-brand)' }}
          >
            See all <span aria-hidden>→</span>
          </Link>
        )}
      </div>

      {services.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-16 text-center">
      <p className="text-sm font-semibold text-slate-900">No services published yet</p>
      <p className="mt-2 text-sm text-slate-600">
        The team is curating our offerings. Drop us a line and we&apos;ll be in touch.
      </p>
      <Link
        href="/contact"
        className="mt-6 inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: 'var(--site-brand)' }}
      >
        Contact us
      </Link>
    </div>
  )
}
