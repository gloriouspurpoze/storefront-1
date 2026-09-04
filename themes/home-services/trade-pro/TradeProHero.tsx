import type { PublicService } from '../types'
import { TradeProQuickQuoteForm } from './TradeProQuickQuoteForm'
import { CheckIcon, StarIcon } from './icons'
import './trade-pro.css'

const TRUST_POINTS = ['Licensed & insured pros', 'Same-day availability', 'Upfront, honest pricing']

export function TradeProHero({
  tenantId,
  headline,
  subcopy,
  services,
  rating,
  reviewCount,
}: {
  tenantId: string
  headline: string
  subcopy?: string
  services: PublicService[]
  rating?: number
  reviewCount?: number
}) {
  return (
    <section className="tp-hero-grid relative overflow-hidden bg-[var(--tp-ink)] text-white">
      <div className="tp-diagonal-stripes absolute inset-x-0 top-0 h-1.5" aria-hidden />
      <div className="tp-container grid grid-cols-1 items-start gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="min-w-0">
          {typeof rating === 'number' && rating > 0 && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold">
              <span className="flex items-center gap-0.5 text-[var(--tp-accent)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className={i < Math.round(rating) ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 opacity-30'} />
                ))}
              </span>
              <span className="text-white/85">
                {rating.toFixed(1)} rating{reviewCount ? ` · ${reviewCount}+ reviews` : ''}
              </span>
            </div>
          )}

          <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            {headline}
          </h1>
          {subcopy && <p className="mt-5 max-w-xl text-pretty text-lg text-white/75 sm:text-xl">{subcopy}</p>}

          <ul className="mt-8 flex flex-col gap-3 text-sm font-medium text-white/85 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--tp-ink)]"
                  style={{ backgroundColor: 'var(--tp-accent)' }}
                  aria-hidden
                >
                  <CheckIcon className="h-3 w-3" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 lg:pt-2">
          <TradeProQuickQuoteForm tenantId={tenantId} services={services.slice(0, 12)} />
        </div>
      </div>
    </section>
  )
}
