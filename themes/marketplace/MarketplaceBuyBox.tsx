'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PublicProduct } from '@/lib/storefront-api'
import {
  getDefaultVariant,
  getEffectiveOriginalPrice,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { openCartDrawer } from '@/components/commerce/cartDrawerBus'
import { ProductImageGallery } from '@/components/ProductImageGallery'
import { ProductVariantSelector } from '@/components/ProductVariantSelector'
import { WishlistHeartButton } from '@/components/wishlist/WishlistHeartButton'
import { IconCheck, Price, QuantityStepper } from '@/ui'
import { cartItemFromProduct, useCart } from './cart'

/**
 * PDP gallery + purchase column. The selected option drives the gallery image, price, stock and
 * the cart line; the split checkout re-prices that variant server-side. Server-rendered blocks
 * (title, sold-by, description) slot in via `header` / `footer`.
 */
export function MarketplaceProductMain({
  product,
  header,
  footer,
}: {
  product: PublicProduct
  header: ReactNode
  footer: ReactNode
}) {
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product])
  const [variantId, setVariantId] = useState<string | null>(defaultVariant?.id ?? null)
  useEffect(() => setVariantId(defaultVariant?.id ?? null), [product.id, defaultVariant?.id])

  return (
    <div className="sf-pdp-grid">
      <ProductImageGallery key={`${product.id}:${variantId ?? 'base'}`} product={product} variantId={variantId} />
      <div className="sf-pdp-info">
        {header}
        <MarketplaceBuyBox product={product} variantId={variantId} onVariantChange={setVariantId} />
        {footer}
      </div>
    </div>
  )
}

function MarketplaceBuyBox({
  product,
  variantId,
  onVariantChange,
}: {
  product: PublicProduct
  variantId: string | null
  onVariantChange: (id: string) => void
}) {
  const { addItem, lines } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const item = cartItemFromProduct(product)
  const hasVariants = productHasVariants(product)
  const needsChoice = hasVariants && !variantId
  const inStock = isVariantInStock(product, variantId)
  const price = getEffectivePrice(product, variantId)
  const compareAt = getEffectiveOriginalPrice(product, variantId)
  const inCart = item ? lines.some((l) => l.productId === item.id && (l.variantId ?? null) === (hasVariants ? variantId : null)) : false

  if (!item) {
    return (
      <div className="sf-pdp-purchase">
        <p className="mk-alert">This product isn&apos;t available to buy on the marketplace right now.</p>
      </div>
    )
  }

  const add = () => {
    if (!requireAuthForCart() || needsChoice || !inStock) return
    addItem(item, qty, hasVariants ? (variantId ?? undefined) : undefined)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
    openCartDrawer()
  }

  return (
    <div className="sf-pdp-purchase">
      <p className="sf-pdp-price-block">
        <Price amount={price} compareAt={compareAt ?? undefined} currency={item.currency} size="lg" />
      </p>
      <span className={`sf-pdp-stock ${inStock ? 'sf-pdp-stock--in' : 'sf-pdp-stock--out'}`}>
        {inStock ? 'In stock' : 'Out of stock'}
      </span>
      {hasVariants ? (
        <ProductVariantSelector variants={product.variants!} selectedId={variantId} onSelect={onVariantChange} />
      ) : null}
      <div className="mk-form" style={{ marginTop: '1rem' }}>
        {!inStock ? (
          <button type="button" disabled className="sf-btn sf-btn--secondary sf-btn--block">
            Out of stock
          </button>
        ) : needsChoice ? (
          <button type="button" disabled className="sf-btn sf-btn--secondary sf-btn--block">
            Choose an option
          </button>
        ) : inCart && !added ? (
          <Link href="/cart" className="sf-btn sf-btn--block sf-btn--lg">
            In your cart — view cart
          </Link>
        ) : (
          <>
            <QuantityStepper value={qty} onChange={setQty} />
            <button type="button" className="sf-btn sf-btn--block sf-btn--lg" onClick={add}>
              {added ? (
                <>
                  <IconCheck size={18} /> Added to cart
                </>
              ) : (
                'Add to cart'
              )}
            </button>
          </>
        )}
        <WishlistHeartButton productId={product.id} productName={product.name} variant="inline" className="sf-pdp-wishlist" />
      </div>
    </div>
  )
}
