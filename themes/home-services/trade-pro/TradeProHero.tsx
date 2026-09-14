import type { PublicService } from '../types'
import { TradeProServicePicker } from './TradeProServicePicker'
import { CheckIcon, PhoneIcon, StarIcon } from './icons'
import './trade-pro.css'

const TRUST_POINTS = ['Licensed & insured pros', 'Same-day availability', 'Upfront, honest pricing']

export function TradeProHero({
  headline,
  subcopy,
  services,
  rating,
  reviewCount,
  ctaLabel,
  phone,
}: {
  headline: string
  subcopy?: string
  services: PublicService[]
  rating?: number
  reviewCount?: number
  ctaLabel?: string
  phone?: string
}) {
  const showRating =
    typeof rating === 'number' && rating > 0 && typeof reviewCount === 'number' && reviewCount > 0
  const primaryLabel = ctaLabel?.trim() || 'Build your enquiry'
  const filledStars = Math.min(5, Math.max(0, Math.round(rating ?? 0)))

  return (
    <section className="tp-soft-band">
      <div className="tp-container tp-section grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="min-w-0">
          {showRating ? (
            <div className="tp-badge mb-6">
              <span className="tp-rating-star flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={i < filledStars ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 opacity-30'}
                  />
                ))}
              </span>
              <span>
                {rating!.toFixed(1)} · {reviewCount}+ reviews
              </span>
            </div>
          ) : null}

          <h1 className="tp-display text-balance">{headline}</h1>
          {subcopy ? (
            <p className="mt-6 max-w-[65ch] text-pretty text-base leading-relaxed text-[var(--tp-body)] sm:text-lg sm:leading-8">
              {subcopy}
            </p>
          ) : null}

          <ul className="tp-chip-row mt-8">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="tp-badge">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: 'var(--tp-accent)',
                    color: 'var(--tp-accent-contrast)',
                  }}
                  aria-hidden
                >
                  <CheckIcon className="h-3 w-3" />
                </span>
                {point}
              </li>
            ))}
          </ul>

          {phone ? (
            <div className="mt-8">
              <a
                href={`tel:${phone}`}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--tp-ink)] transition hover:opacity-80"
              >
                <PhoneIcon className="h-4 w-4" />
                Call {phone}
              </a>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 w-full">
          <TradeProServicePicker
            services={services.slice(0, 4)}
            title={primaryLabel}
            subtitle="Add services to your cart, then send one enquiry."
            moreHref={services.length > 4 ? '/services' : undefined}
          />
        </div>
      </div>
    </section>
  )
}
