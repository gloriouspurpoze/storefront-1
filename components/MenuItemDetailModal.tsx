'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PublicMenuItem } from '@/lib/storefront-api'
import { isVegItem } from '@/themes/restaurant/menufast/useMenuCart'
import { formatMoney } from '@/lib/format'
import {
  getDefaultVariant,
  getEffectiveOriginalPrice,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'
import { ProductVariantSelector } from '@/components/ProductVariantSelector'
import './menu-item-detail-modal.css'

export function MenuItemDetailModal({
  item,
  open,
  onClose,
  quantity,
  getQuantity,
  onAdd,
  onRemove,
  tone = 'restaurant',
  actionsDisabled = false,
}: {
  item: PublicMenuItem | null
  open: boolean
  onClose: () => void
  /** Fixed quantity when variant selection is not used */
  quantity?: number
  /** Per-variant quantity (preferred for multi-variant items) */
  getQuantity?: (variantId?: string) => number
  onAdd: (variantId?: string) => void
  onRemove: (variantId?: string) => void
  tone?: 'restaurant' | 'saffron'
  actionsDisabled?: boolean
}) {
  const hasVariants = item ? productHasVariants(item) : false
  const defaultVariant = useMemo(() => (item ? getDefaultVariant(item) : null), [item])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariant?.id ?? null)

  useEffect(() => {
    setSelectedVariantId(defaultVariant?.id ?? null)
  }, [item?.id, defaultVariant?.id])

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

  if (!open || !item || typeof document === 'undefined') return null

  const inStock = isVariantInStock(item, selectedVariantId)
  const needsSelection = hasVariants && !selectedVariantId
  const lineQty = getQuantity
    ? getQuantity(selectedVariantId ?? undefined)
    : (quantity ?? 0)
  const price = getEffectivePrice(item, selectedVariantId)
  const originalPrice = getEffectiveOriginalPrice(item, selectedVariantId)
  const popular = (item.dietary ?? []).some((d) => d.toLowerCase() === 'popular')

  return createPortal(
    <div
      className="sf-menu-item-modal open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sf-menu-item-modal-title"
      onClick={onOverlayClick}
    >
      <div className="sf-menu-item-modal__card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sf-menu-item-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        {item.imageUrl ? (
          <div className="sf-menu-item-modal__image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.name} />
          </div>
        ) : null}
        <div className="sf-menu-item-modal__body">
          <div className="sf-menu-item-modal__title-row">
            {isVegItem(item) && <span className="sf-menu-item-modal__veg" aria-label="Vegetarian" />}
            <h2 id="sf-menu-item-modal-title" className="sf-menu-item-modal__title">
              {item.name}
            </h2>
            {popular && <span className="sf-menu-item-modal__badge">Popular</span>}
          </div>
          <p className="sf-menu-item-modal__price">
            {formatMoney(price, item.currency)}
            {originalPrice ? (
              <span className="sf-menu-item-modal__price-was">
                {formatMoney(originalPrice, item.currency)}
              </span>
            ) : null}
          </p>
          {item.description ? <p className="sf-menu-item-modal__desc">{item.description}</p> : null}
          {hasVariants ? (
            <ProductVariantSelector
              variants={item.variants!}
              selectedId={selectedVariantId}
              onSelect={setSelectedVariantId}
              label="Size"
              tone={tone}
              quantityForVariant={getQuantity ? (id) => getQuantity(id) : undefined}
            />
          ) : null}
          {(item.dietary ?? []).filter((d) => d.toLowerCase() !== 'popular').length > 0 ? (
            <div className="sf-menu-item-modal__tags">
              {item.dietary
                ?.filter((d) => d.toLowerCase() !== 'popular')
                .map((d) => (
                  <span key={d} className="sf-menu-item-modal__tag">
                    {d}
                  </span>
                ))}
            </div>
          ) : null}
          <div className="sf-menu-item-modal__actions">
            {!inStock ? (
              <span className="sf-menu-item-modal__oos">Out of stock</span>
            ) : needsSelection ? (
              <span className="sf-menu-item-modal__oos">Select an option</span>
            ) : lineQty === 0 ? (
              <button
                type="button"
                className="sf-menu-item-modal__add"
                disabled={actionsDisabled}
                onClick={() => onAdd(selectedVariantId ?? undefined)}
              >
                Add to cart
              </button>
            ) : (
              <div className="sf-menu-item-modal__qty">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => onRemove(selectedVariantId ?? undefined)}
                >
                  −
                </button>
                <span>{lineQty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={actionsDisabled}
                  onClick={() => onAdd(selectedVariantId ?? undefined)}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
