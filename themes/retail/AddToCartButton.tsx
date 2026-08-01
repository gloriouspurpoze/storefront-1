'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import type { PublicProduct } from '@/lib/storefront-api'
import { formatMoney } from '@/lib/format'
import {
  cartLineKey,
  getDefaultVariant,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'
import { ProductVariantSelector, type VariantSelectorTone } from '@/components/ProductVariantSelector'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { useCart } from './cart'
import '@/themes/retail/soft-studio/soft-studio.css'
import '@/themes/retail/luxe-essence/luxe-essence.css'
import '@/themes/retail/retail-pdp.css'
import '@/themes/retail/retail-cart.css'

const MAX_QTY = 99

function clampQty(value: number): number {
  return Math.min(MAX_QTY, Math.max(1, Math.floor(value) || 1))
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6h15l-1.5 9h-12L6 6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="9.5" cy="19" r="1.25" fill="currentColor" />
      <circle cx="16.5" cy="19" r="1.25" fill="currentColor" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function QuantityStepper({
  value,
  onChange,
  max = MAX_QTY,
  size = 'md',
  label = 'Quantity',
}: {
  value: number
  onChange: (qty: number) => void
  max?: number
  size?: 'md' | 'lg'
  label?: string
}) {
  const inputId = useId()
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commitDraft = useCallback(() => {
    const parsed = parseInt(draft, 10)
    const next = clampQty(Number.isFinite(parsed) ? parsed : value)
    onChange(Math.min(next, max))
    setDraft(String(Math.min(next, max)))
  }, [draft, max, onChange, value])

  const stepperClass = size === 'lg' ? 'sf-qty-stepper sf-qty-stepper--lg' : 'sf-qty-stepper'

  return (
    <div className="sf-qty-field">
      <label className="sf-qty-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className={stepperClass} role="group" aria-label={label}>
        <button
          type="button"
          className="sf-qty-btn"
          aria-label="Decrease quantity"
          onClick={() => onChange(clampQty(value - 1))}
          disabled={value <= 1}
        >
          <span aria-hidden>−</span>
        </button>
        <input
          id={inputId}
          type="number"
          className="sf-qty-input"
          min={1}
          max={max}
          inputMode="numeric"
          value={draft}
          aria-label={`${label}, current value ${value}`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitDraft()
            }
          }}
        />
        <button
          type="button"
          className="sf-qty-btn"
          aria-label="Increase quantity"
          onClick={() => onChange(clampQty(Math.min(max, value + 1)))}
          disabled={value >= max}
        >
          <span aria-hidden>+</span>
        </button>
      </div>
    </div>
  )
}

/** Market-standard PDP block: quantity stepper + add to cart CTA + feedback. */
export function ProductPurchaseBlock({
  product,
  variantTone = 'default',
}: {
  product: PublicProduct
  variantTone?: VariantSelectorTone
}) {
  const { addProduct, lines } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const hasVariants = productHasVariants(product)
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariant?.id ?? null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setSelectedVariantId(defaultVariant?.id ?? null)
    setQuantity(1)
    setAdded(false)
  }, [product.id, defaultVariant?.id])

  // Reset first-add qty when switching options so a new variant starts clean.
  useEffect(() => {
    setQuantity(1)
    setAdded(false)
  }, [selectedVariantId])

  const activeVariantId = hasVariants ? selectedVariantId ?? undefined : undefined
  const cartLine = lines.find(
    (l) => cartLineKey(l.productId, l.variantId) === cartLineKey(product.id, activeVariantId),
  )
  const alreadyInCart = Boolean(cartLine)
  const inStock = isVariantInStock(product, selectedVariantId)
  const needsSelection = hasVariants && !selectedVariantId
  const unitPrice = getEffectivePrice(product, selectedVariantId)
  const lineTotal = unitPrice * quantity

  const handleAdd = useCallback(() => {
    if (!inStock || adding || needsSelection || alreadyInCart) return
    if (!requireAuthForCart()) return
    const qty = clampQty(quantity)
    setAdding(true)
    addProduct(product, qty, activeVariantId)
    setAdded(true)
    window.setTimeout(() => setAdding(false), 400)
    window.setTimeout(() => setAdded(false), 3200)
  }, [
    activeVariantId,
    addProduct,
    adding,
    alreadyInCart,
    inStock,
    needsSelection,
    product,
    quantity,
    requireAuthForCart,
  ])

  if (!inStock && !hasVariants) {
    return (
      <div className="sf-pdp-purchase">
        <button type="button" disabled className="sf-pdp-btn sf-pdp-btn--disabled sf-pdp-btn--cart">
          Out of stock
        </button>
        <p className="sf-pdp-purchase-note sf-pdp-purchase-note--muted">
          This item is currently unavailable. Check back soon.
        </p>
      </div>
    )
  }

  return (
    <div className="sf-pdp-purchase">
      {hasVariants ? (
        <ProductVariantSelector
          variants={product.variants!}
          selectedId={selectedVariantId}
          onSelect={setSelectedVariantId}
          label="Options"
          tone={variantTone}
          quantityForVariant={(id) =>
            lines.find((l) => cartLineKey(l.productId, l.variantId) === cartLineKey(product.id, id))
              ?.quantity ?? 0
          }
        />
      ) : null}

      {alreadyInCart && cartLine ? (
        <div className="sf-pdp-in-cart-locked" role="status">
          <p className="sf-pdp-in-cart">
            <span className="sf-pdp-in-cart__badge">{cartLine.quantity}</span>
            {cartLine.quantity === 1 ? 'item' : 'items'} in your cart
            <Link href="/cart" className="sf-pdp-in-cart__link">
              View cart
            </Link>
          </p>
          <p className="sf-pdp-purchase-note sf-pdp-purchase-note--muted">
            {hasVariants
              ? 'This option is already in your cart. Change quantity in cart or checkout, or select another option to add.'
              : 'Already in your cart. Change quantity in cart or checkout.'}
          </p>
        </div>
      ) : (
        <>
          <div className="sf-pdp-purchase-row">
            <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
            <button
              type="button"
              className={`sf-pdp-btn sf-pdp-btn--cart${added ? ' sf-pdp-btn--success' : ' sf-pdp-btn--primary'}`}
              onClick={handleAdd}
              disabled={adding || !inStock || needsSelection}
              aria-live="polite"
            >
              {added ? (
                <>
                  <CheckIcon />
                  Added to cart
                </>
              ) : !inStock ? (
                'Out of stock'
              ) : needsSelection ? (
                'Select an option'
              ) : (
                <>
                  <CartIcon />
                  Add to cart
                </>
              )}
            </button>
          </div>

          <p className="sf-pdp-purchase-total">
            <span className="sf-pdp-purchase-total__label">Subtotal</span>
            <span className="sf-pdp-purchase-total__value">
              {formatMoney(lineTotal, product.currency)}
              <span className="sf-pdp-purchase-total__qty">
                {' '}
                · {quantity} {quantity === 1 ? 'item' : 'items'}
              </span>
            </span>
          </p>
        </>
      )}

      {added && !alreadyInCart ? (
        <div className="sf-pdp-added-banner" role="status" aria-live="polite">
          <CheckIcon />
          <span>
            Added to cart —{' '}
            <Link href="/cart" className="sf-pdp-added-banner__link">
              View cart
            </Link>
          </span>
        </div>
      ) : null}
    </div>
  )
}

/** @deprecated Use ProductPurchaseBlock on PDP. Kept for any legacy imports. */
export function AddToCartButton({
  product,
  quantity = 1,
  className,
  onAdded,
}: {
  product: PublicProduct
  quantity?: number
  className?: string
  onAdded?: () => void
}) {
  const { addProduct } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const [added, setAdded] = useState(false)

  if (!product.inStock) {
    return (
      <button type="button" disabled className={className ?? 'sf-pdp-btn sf-pdp-btn--disabled'}>
        Out of stock
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!requireAuthForCart()) return
        addProduct(product, clampQty(quantity))
        setAdded(true)
        onAdded?.()
        window.setTimeout(() => setAdded(false), 2500)
      }}
      className={className ?? `sf-pdp-btn sf-pdp-btn--primary sf-pdp-btn--cart${added ? ' sf-pdp-btn--success' : ''}`}
    >
      {added ? 'Added to cart' : 'Add to cart'}
    </button>
  )
}

/** @deprecated Use QuantityStepper inside ProductPurchaseBlock. */
export function ProductQuantitySelector({
  value,
  onChange,
  max = MAX_QTY,
}: {
  value: number
  onChange: (qty: number) => void
  max?: number
}) {
  return <QuantityStepper value={value} onChange={onChange} max={max} size="lg" />
}

export function ProductPriceBlock({ product }: { product: PublicProduct }) {
  const savings =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : null

  return (
    <div className="sf-pdp-price-block">
      <span className="sf-pdp-price">{formatMoney(product.price, product.currency)}</span>
      {product.originalPrice && product.originalPrice > product.price ? (
        <>
          <span className="sf-pdp-price-was">{formatMoney(product.originalPrice, product.currency)}</span>
          {savings ? (
            <span className="sf-pdp-price-save">Save {formatMoney(savings, product.currency)}</span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
