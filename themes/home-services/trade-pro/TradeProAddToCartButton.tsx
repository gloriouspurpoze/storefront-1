'use client'

import type { PublicService } from '../types'
import { useEnquiryCart } from '@/lib/enquiryCart'

export function TradeProAddToCartButton({
  service,
  className,
  label = 'Add to cart',
}: {
  service: PublicService
  className?: string
  label?: string
}) {
  const { addService, openCart, lines } = useEnquiryCart()
  const inCart = lines.some((l) => l.serviceId === service.id)
  const resolvedClassName = [className, inCart ? 'tp-add--in-cart' : null].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      aria-pressed={inCart}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (inCart) {
          openCart()
          return
        }
        addService(service)
      }}
      className={resolvedClassName || undefined}
    >
      {inCart ? 'Added to cart' : label}
    </button>
  )
}
