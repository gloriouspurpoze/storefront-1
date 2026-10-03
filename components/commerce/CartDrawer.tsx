'use client'

import Link from 'next/link'
import { formatMoney } from '@/lib/format'
import { cartLineProductName, type CartLineBase } from '@/theme-kit/cart'
import { ButtonLink, Drawer, IconBag, IconTrash, IconTruck, QuantityStepper } from '@/ui'
import './commerce.css'

export type CartDrawerLine = CartLineBase & { slug?: string }

/**
 * Slide-out mini cart shared by every vertical. Cart-agnostic: the theme
 * header passes its own `useCart()` values in, so retail and restaurant carts
 * (different contexts / storage keys) both work.
 */
export function CartDrawer({
  open,
  onClose,
  lines,
  subtotal,
  setQuantity,
  removeLine,
  checkoutHref = '/checkout',
  cartHref,
  freeShippingThreshold,
  continueLabel = 'Continue shopping',
  continueHref = '/products',
  productHref,
  note,
}: {
  open: boolean
  onClose: () => void
  lines: CartDrawerLine[]
  subtotal: number
  setQuantity: (productId: string, quantity: number, variantId?: string) => void
  removeLine: (productId: string, variantId?: string) => void
  checkoutHref?: string
  /** Full cart page; omitted → no "View cart" link. */
  cartHref?: string
  freeShippingThreshold?: number | null
  continueLabel?: string
  continueHref?: string
  /** Build a link for a line (retail PDP); omitted → no link. */
  productHref?: (line: CartDrawerLine) => string | undefined
  note?: string
}) {
  const currency = lines[0]?.currency ?? 'INR'
  const count = lines.reduce((n, l) => n + l.quantity, 0)
  const threshold = freeShippingThreshold && freeShippingThreshold > 0 ? freeShippingThreshold : null
  const remaining = threshold ? Math.max(0, threshold - subtotal) : 0
  const progress = threshold ? Math.min(100, (subtotal / threshold) * 100) : 0

  const footer =
    lines.length > 0 ? (
      <div className="sf-cart-drawer__foot">
        <div className="sf-cart-drawer__subtotal">
          <span>Subtotal</span>
          <strong>{formatMoney(subtotal, currency)}</strong>
        </div>
        <p className="sf-cart-drawer__note">{note ?? 'Taxes and shipping calculated at checkout.'}</p>
        <ButtonLink href={checkoutHref} block size="lg" onClick={onClose}>
          Checkout
        </ButtonLink>
        {cartHref && (
          <ButtonLink href={cartHref} variant="link" block onClick={onClose} className="sf-cart-drawer__view">
            View cart
          </ButtonLink>
        )}
      </div>
    ) : null

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <>
          Your cart{count > 0 && <span className="sf-cart-drawer__count"> ({count})</span>}
        </>
      }
      footer={footer}
      className="sf-cart-drawer"
    >
      {lines.length === 0 ? (
        <div className="sf-mc-empty">
          <span className="sf-mc-empty__icon">
            <IconBag size={28} />
          </span>
          <p className="sf-mc-empty__title">Your cart is empty</p>
          <p className="sf-subtle">Looks like you haven’t added anything yet.</p>
          <ButtonLink href={continueHref} onClick={onClose}>
            {continueLabel}
          </ButtonLink>
        </div>
      ) : (
        <>
          {threshold && (
            <div className="sf-ship-progress">
              <p>
                <IconTruck size={18} />
                {remaining > 0 ? (
                  <span>
                    You’re <strong>{formatMoney(remaining, currency)}</strong> away from free shipping
                  </span>
                ) : (
                  <span>
                    <strong>You’ve unlocked free shipping!</strong>
                  </span>
                )}
              </p>
              <div className="sf-ship-progress__bar" aria-hidden>
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          <ul className="sf-mc-lines">
            {lines.map((line) => {
              const href = productHref?.(line)
              const title = cartLineProductName(line)
              return (
                <li key={`${line.productId}:${line.variantId ?? ''}`} className="sf-mc-line">
                  <div className="sf-mc-line__media">
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.imageUrl} alt="" loading="lazy" />
                    ) : (
                      <span aria-hidden>{title.charAt(0)}</span>
                    )}
                  </div>
                  <div className="sf-mc-line__info">
                    {href ? (
                      <Link href={href} className="sf-mc-line__title" onClick={onClose}>
                        {title}
                      </Link>
                    ) : (
                      <span className="sf-mc-line__title">{title}</span>
                    )}
                    {line.variantName && <span className="sf-mc-line__variant">{line.variantName}</span>}
                    <span className="sf-mc-line__unit">{formatMoney(line.price, line.currency)}</span>
                    <div className="sf-mc-line__actions">
                      <QuantityStepper
                        size="sm"
                        value={line.quantity}
                        min={1}
                        onChange={(q) => setQuantity(line.productId, q, line.variantId)}
                      />
                      <button
                        type="button"
                        className="sf-mc-line__remove"
                        aria-label={`Remove ${title}`}
                        onClick={() => removeLine(line.productId, line.variantId)}
                      >
                        <IconTrash size={18} />
                      </button>
                    </div>
                  </div>
                  <strong className="sf-mc-line__total">{formatMoney(line.price * line.quantity, line.currency)}</strong>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Drawer>
  )
}
