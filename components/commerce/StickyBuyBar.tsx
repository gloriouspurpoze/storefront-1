'use client'

import { useEffect, useState } from 'react'
import type { PublicProduct } from '@/lib/storefront-api'
import { getEffectiveOriginalPrice, getEffectivePrice, isVariantInStock } from '@/lib/productVariants'
import { Price } from '@/ui'
import './commerce.css'

/**
 * Mobile-only bar that appears once the PDP purchase block scrolls out of
 * view; its button scrolls back to (and focuses) the real add-to-cart.
 */
export function StickyBuyBar({
  product,
  variantId,
  targetSelector = '.sf-pdp-purchase',
}: {
  product: PublicProduct
  variantId: string | null
  targetSelector?: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = document.querySelector(targetSelector)
    if (!target || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    io.observe(target)
    return () => io.disconnect()
  }, [targetSelector])

  const inStock = isVariantInStock(product, variantId)
  const price = getEffectivePrice(product, variantId)
  const was = getEffectiveOriginalPrice(product, variantId)

  return (
    <div className="sf-sticky-buy" data-storefront-bottom-bar="" data-visible={visible || undefined} aria-hidden={!visible}>
      <div className="sf-sticky-buy__info">
        <span className="sf-sticky-buy__name">{product.name}</span>
        <Price amount={price} compareAt={was} currency={product.currency} showOff={false} />
      </div>
      <button
        type="button"
        className="sf-btn"
        tabIndex={visible ? 0 : -1}
        disabled={!inStock}
        onClick={() => {
          const el = document.querySelector<HTMLElement>(targetSelector)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          window.setTimeout(() => el?.querySelector<HTMLElement>('.sf-pdp-btn--cart')?.focus(), 400)
        }}
      >
        {inStock ? 'Add to cart' : 'Sold out'}
      </button>
    </div>
  )
}
