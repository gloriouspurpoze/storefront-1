'use client'

import { useMemo } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { cartLineKey } from '@/lib/productVariants'
import { getCartShippingDisplayLabel } from '@/lib/shippingPolicy'
import { formatMoney, type CartLine } from '../cart'

function CartEmptyIcon() {
  return (
    <svg
      className="le-cart-empty-icon"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
      <path d="M6 6 5 3H2" strokeLinecap="round" />
      <circle cx="9.5" cy="19" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="19" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LuxeEssenceCartModal({
  open,
  onClose,
  onCheckout,
  onViewShippingPolicy,
  config,
  lines,
  itemCount,
  subtotal,
  setQuantity,
  removeLine,
}: {
  open: boolean
  onClose: () => void
  onCheckout: () => void
  onViewShippingPolicy?: () => void
  config: StorefrontConfig | null
  lines: CartLine[]
  itemCount: number
  subtotal: number
  setQuantity: (productId: string, quantity: number, variantId?: string) => void
  removeLine: (productId: string, variantId?: string) => void
}) {
  const currency = lines[0]?.currency ?? 'INR'
  const shippingLabel = useMemo(() => getCartShippingDisplayLabel(config), [config])
  const showShippingPolicyLink =
    shippingLabel === 'Calculated at checkout' && Boolean(onViewShippingPolicy)

  return (
    <div
      className={`le-modal le-cart-modal${open ? ' open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
      aria-hidden={!open}
    >
      <div className="le-cart-modal__head">
        <h2 className="le-cart-modal__title">
          Your cart{itemCount > 0 ? ` (${itemCount})` : ''}
        </h2>
        <button type="button" className="le-cart-modal__close" aria-label="Close cart" onClick={onClose}>
          ×
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="le-cart-empty">
          <CartEmptyIcon />
          <p className="le-cart-empty__title">Your cart is empty</p>
          <p className="le-cart-empty__copy">Add items from the collection to get started.</p>
          <button type="button" className="le-close-btn" onClick={onClose}>
            Continue shopping
          </button>
        </div>
      ) : (
        <>
          <ul className="le-cart-lines">
            {lines.map((line) => (
              <li key={cartLineKey(line.productId, line.variantId)} className="le-cart-item">
                <div className="le-cart-item-info">
                  <div className="le-cart-item-name">{line.name}</div>
                  <div className="le-cart-item-price">
                    {formatMoney(line.price, line.currency)} each
                  </div>
                  <div className="le-qty-control">
                    <button
                      type="button"
                      className="le-qty-btn"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(line.productId, line.quantity - 1, line.variantId)}
                    >
                      −
                    </button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button
                      type="button"
                      className="le-qty-btn"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(line.productId, line.quantity + 1, line.variantId)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="le-remove-btn"
                      onClick={() => removeLine(line.productId, line.variantId)}
                      aria-label={`Remove ${line.name}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="le-cart-item-total">
                  {formatMoney(line.price * line.quantity, line.currency)}
                </div>
              </li>
            ))}
          </ul>

          <div className="le-cart-summary">
            <div className="le-total-row">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, currency)}</span>
            </div>
            <div className="le-total-row le-total-row--shipping">
              <span>Shipping</span>
              <span className="le-cart-shipping-label">{shippingLabel}</span>
            </div>
            {showShippingPolicyLink ? (
              <button type="button" className="le-cart-shipping-link" onClick={onViewShippingPolicy}>
                View shipping policy
              </button>
            ) : null}
          </div>

          <button type="button" className="le-checkout-btn" onClick={onCheckout}>
            Proceed to checkout · {formatMoney(subtotal, currency)}
          </button>
          <button type="button" className="le-close-btn" onClick={onClose}>
            Continue shopping
          </button>
        </>
      )}
    </div>
  )
}
