'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { PublicService } from '../types'
import { formatPrice } from '../ServiceCard'
import { TradeProAddToCartButton } from './TradeProAddToCartButton'
import '../home-services-shell.css'
import './trade-pro.css'

export function TradeProServiceCard({ service }: { service: PublicService }) {
  const price = formatPrice(service.basePrice, service.currency)
  return (
    <article className="hs-service-card group overflow-hidden rounded-2xl border border-[var(--tp-hairline,#e2e6ed)] bg-white shadow-[0_2px_12px_rgba(0,20,47,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,20,47,0.1)]">
      <Link href={`/services/${service.slug}`} className="block">
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
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <TradeProAddToCartButton
          service={service}
          className="tp-btn-primary w-full"
          label="Add to cart"
        />
      </div>
    </article>
  )
}

export function TradeProServiceGrid({
  services,
  title = 'Our services',
  subtitle,
  phone,
  showSeeAll = true,
}: {
  services: PublicService[]
  title?: string
  subtitle?: string
  phone?: string
  showSeeAll?: boolean
}) {
  const showHeader = Boolean(title || subtitle || (showSeeAll && services.length > 0))

  return (
    <section className="hs-container hs-services-section">
      {showHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-4">
          {title || subtitle ? (
            <div className="max-w-xl">
              {title ? (
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
              ) : null}
              {subtitle ? <p className="mt-3 text-base leading-7 text-slate-600">{subtitle}</p> : null}
            </div>
          ) : (
            <div />
          )}
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
      ) : null}

      <div className={showHeader ? 'mt-8 sm:mt-10' : undefined}>
        {services.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-900">Services coming soon</p>
            {phone ? (
              <a href={`tel:${phone}`} className="tp-btn-primary mt-6">
                Call {phone}
              </a>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <TradeProServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
