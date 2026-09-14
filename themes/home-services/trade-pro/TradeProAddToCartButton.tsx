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
  const { addService } = useEnquiryCart()
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        addService(service)
      }}
      className={className}
    >
      {label}
    </button>
  )
}
