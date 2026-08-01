'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PublicProduct } from '@/lib/storefront-api'
import { formatMoney } from '@/lib/format'
import {
  getDefaultVariant,
  getEffectiveOriginalPrice,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'
import { ProductVariantSelector } from '@/components/ProductVariantSelector'
import { LuxeEssenceProductImage } from './LuxeEssenceProductGrid'

export function LuxeEssenceProductModal({
  product,
  open,
  onClose,
  getQuantity,
  onAdd,
  actionsDisabled = false,
}: {
  product: PublicProduct | null
  open: boolean
  onClose: () => void
  getQuantity: (variantId?: string) => number
  onAdd: (variantId?: string) => void
  actionsDisabled?: boolean
}) {
  const hasVariants = product ? productHasVariants(product) : false
  const defaultVariant = useMemo(() => (product ? getDefaultVariant(product) : null), [product])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariant?.id ?? null)

  useEffect(() => {
    setSelectedVariantId(defaultVariant?.id ?? null)
  }, [product?.id, defaultVariant?.id])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  if (!open || !product || typeof document === 'undefined') return null

  const description = product.shortDescription?.trim() || product.description?.trim()
  const inStock = isVariantInStock(product, selectedVariantId)
  const needsSelection = hasVariants && !selectedVariantId
  const lineQty = getQuantity(selectedVariantId ?? undefined)
  const price = getEffectivePrice(product, selectedVariantId)
  const originalPrice = getEffectiveOriginalPrice(product, selectedVariantId)

  return createPortal(
    <div
      className="le-product-modal open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="le-product-modal-title"
      onClick={onOverlayClick}
    >
      <div className="le-product-modal__card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="le-product-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <LuxeEssenceProductImage product={product} />
        <div className="le-product-modal__body">
          <h2 id="le-product-modal-title" className="le-product-modal__title">
            {product.name}
          </h2>
          <p className="le-product-modal__price">
            {formatMoney(price, product.currency)}
            {originalPrice ? (
              <span className="le-product-modal__price-was">
                {formatMoney(originalPrice, product.currency)}
              </span>
            ) : null}
          </p>
          {description ? <p className="le-product-modal__desc">{description}</p> : null}
          {hasVariants ? (
            <ProductVariantSelector
              variants={product.variants!}
              selectedId={selectedVariantId}
              onSelect={setSelectedVariantId}
              label="Options"
              tone="luxe"
              quantityForVariant={(id) => getQuantity(id)}
            />
          ) : null}
          <div className="le-product-modal__actions">
            {!inStock ? (
              <span className="le-product-modal__oos">Out of stock</span>
            ) : needsSelection ? (
              <span className="le-product-modal__oos">Select an option</span>
            ) : lineQty === 0 ? (
              <button
                type="button"
                className="le-add-to-cart le-product-modal__add"
                disabled={actionsDisabled}
                onClick={() => onAdd(selectedVariantId ?? undefined)}
              >
                Add to cart
              </button>
            ) : (
              <div
                className="le-in-cart le-product-modal__in-cart"
                role="status"
                aria-label={`${lineQty} in cart. Change quantity in cart or checkout.`}
              >
                <span className="le-in-cart__count" aria-live="polite">
                  {lineQty}
                </span>
                <span className="le-in-cart__label">In cart</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
