'use client'

import Link from 'next/link'
import type { PublicService } from '../types'
import { formatPrice } from '../ServiceCard'
import { useEnquiryCart } from '@/lib/enquiryCart'
import './trade-pro.css'

/** Hero / book-page multi-service picker — adds lines to the enquiry cart. */
export function TradeProServicePicker({
  services,
  title = 'Build your enquiry',
  subtitle = 'Add one or more services, then send from your cart.',
  moreHref,
  moreLabel = 'See all services',
}: {
  services: PublicService[]
  title?: string
  subtitle?: string
  moreHref?: string
  moreLabel?: string
}) {
  const { addService } = useEnquiryCart()

  if (services.length === 0) {
    return (
      <div className="tp-card">
        <p className="text-base font-semibold text-[var(--tp-ink)]">{title}</p>
        <p className="mt-2 text-sm text-[var(--tp-body)]">
          Services are being listed — call us or check back soon.
        </p>
      </div>
    )
  }

  return (
    <div className="tp-card">
      <p className="text-base font-semibold text-[var(--tp-ink)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--tp-body)]">{subtitle}</p>
      <ul className="tp-service-list">
        {services.map((s) => {
          const price = formatPrice(s.basePrice, s.currency)
          return (
            <li key={s.id} className="tp-service-row">
              <div className="tp-service-row__copy">
                <p className="tp-service-row__name">{s.name}</p>
                <p className="tp-service-row__price">{price ? `Est. ${price}` : 'Free estimate'}</p>
              </div>
              <button type="button" className="tp-service-row__add" onClick={() => addService(s)}>
                Add
              </button>
            </li>
          )
        })}
      </ul>
      {moreHref ? (
        <Link href={moreHref} className="tp-service-list__more">
          {moreLabel}
        </Link>
      ) : null}
    </div>
  )
}
