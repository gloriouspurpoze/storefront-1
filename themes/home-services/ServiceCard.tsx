import Link from 'next/link'
import Image from 'next/image'
import type { PublicService } from './types'
import './home-services-shell.css'

/** Shared card for the services grid + booking-page picker. */
export function ServiceCard({ service }: { service: PublicService }) {
  const price = formatPrice(service.basePrice, service.currency)
  return (
    <Link
      href={`/services/${service.slug}`}
      className="hs-service-card group block overflow-hidden rounded-2xl border border-[var(--tp-hairline,#e2e6ed)] bg-white shadow-[0_2px_12px_rgba(0,20,47,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,20,47,0.1)]"
    >
      <div className="relative aspect-[5/3] overflow-hidden bg-[var(--tp-canvas-soft,#f4f6f9)]">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-3xl font-bold"
            style={{
              backgroundColor: 'var(--brand-primary, var(--site-brand))',
              color: 'var(--brand-primary-contrast, #fff)',
            }}
          >
            {service.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="hs-service-card__body space-y-2">
        <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
        {service.shortDescription ? (
          <p className="line-clamp-2 text-sm leading-6 text-slate-600">{service.shortDescription}</p>
        ) : null}
        <div className="flex items-center justify-between pt-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--brand-primary, var(--site-brand))' }}>
            {price ? `Starts at ${price}` : 'Free estimate'}
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
        <span className="inline-block pt-2 text-sm font-semibold text-slate-900 group-hover:underline">
          Book →
        </span>
      </div>
    </Link>
  )
}

function Star() {
  return (
    <svg className="h-3.5 w-3.5 fill-[#d97706]" viewBox="0 0 20 20" aria-hidden>
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
