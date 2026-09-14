'use client'

import { useEnquiryCart } from '@/lib/enquiryCart'
import './trade-pro.css'

/** Bottom-right checkout — opens the enquiry cart without auto-opening on Add. */
export function TradeProCheckoutSticky() {
  const { itemCount, isOpen, openCart } = useEnquiryCart()
  if (itemCount < 1 || isOpen) return null

  return (
    <button
      type="button"
      onClick={openCart}
      className="tp-checkout-sticky"
      aria-label={`Checkout enquiry, ${itemCount} ${itemCount === 1 ? 'service' : 'services'}`}
    >
      Checkout
      <span className="tp-checkout-sticky__count">{itemCount > 99 ? '99+' : itemCount}</span>
    </button>
  )
}
