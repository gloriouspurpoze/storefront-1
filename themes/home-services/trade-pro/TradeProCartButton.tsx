'use client'

import { useEnquiryCart } from '@/lib/enquiryCart'

/** Sticky header cart control — opens the enquiry drawer. */
export function TradeProCartButton() {
  const { itemCount, openCart } = useEnquiryCart()

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--tp-hairline)] text-[var(--tp-ink)] transition hover:bg-[var(--tp-canvas-soft)]"
      aria-label={itemCount > 0 ? `Enquiry cart, ${itemCount} items` : 'Enquiry cart'}
    >
      <CartIcon className="h-5 w-5" />
      {itemCount > 0 ? (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{
            backgroundColor: 'var(--tp-accent)',
            color: 'var(--tp-accent-contrast)',
          }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      ) : null}
    </button>
  )
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h2l1.5 11h11L20 8H7" />
      <circle cx="9.5" cy="19" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="19" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
