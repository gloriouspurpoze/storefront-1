import Link from 'next/link'
import type { PublicService } from './types'

/** Shared card for the services grid + booking-page picker. */
export function ServiceCard({ service }: { service: PublicService }) {
  const price = formatPrice(service.basePrice, service.currency)
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
    >
      <div className="relative aspect-[5/3] overflow-hidden bg-slate-100">
        {service.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.imageUrl}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-3xl font-bold text-white/80"
            style={{ backgroundColor: 'var(--site-brand)' }}
          >
            {service.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="space-y-2 p-5">
        <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
        {service.shortDescription && (
          <p className="line-clamp-2 text-sm text-slate-600">{service.shortDescription}</p>
        )}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium" style={{ color: 'var(--site-brand)' }}>
            {price ? `Starts at ${price}` : 'Custom quote'}
          </span>
          {typeof service.rating === 'number' && service.rating > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
              <Star /> {service.rating.toFixed(1)}
              {service.reviewCount ? (
                <span className="text-slate-400">({service.reviewCount})</span>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function Star() {
  return (
    <svg
      className="h-3.5 w-3.5 fill-amber-500"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77 4.8 17.5l.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
    </svg>
  )
}

export function formatPrice(amount?: number, currency?: string): string | null {
  if (typeof amount !== 'number' || amount <= 0) return null
  const code = (currency ?? 'INR').toUpperCase()
  try {
    return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${code} ${amount.toLocaleString()}`
  }
}
