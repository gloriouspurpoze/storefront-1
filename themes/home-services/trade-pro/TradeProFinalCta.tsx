'use client'

import Link from 'next/link'
import { useEnquiryCart } from '@/lib/enquiryCart'
import { PhoneIcon } from './icons'
import './trade-pro.css'

export function TradeProFinalCta({ phone }: { phone?: string }) {
  const { openCart, itemCount } = useEnquiryCart()
  return (
    <section className="tp-ink-band">
      <div className="tp-container tp-section text-center">
        <h2 className="tp-h2 text-[var(--tp-cta-contrast)]">Need something fixed today?</h2>
        <p className="tp-center mt-4 text-pretty text-base leading-7 text-[var(--tp-cta-contrast)]/75">
          Add services to your cart and send one enquiry. No account required.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={openCart}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition hover:brightness-95"
            style={{
              backgroundColor: 'var(--tp-accent)',
              color: 'var(--tp-accent-contrast)',
            }}
          >
            {itemCount > 0 ? `Send enquiry (${itemCount})` : 'Open enquiry cart'}
          </button>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="tp-btn-outline border-white/30 bg-transparent text-[var(--tp-cta-contrast)] hover:bg-white/10"
            >
              <PhoneIcon className="h-4 w-4" /> Call {phone}
            </a>
          ) : (
            <Link
              href="/services"
              className="tp-btn-outline border-white/30 bg-transparent text-[var(--tp-cta-contrast)] hover:bg-white/10"
            >
              Browse services
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
