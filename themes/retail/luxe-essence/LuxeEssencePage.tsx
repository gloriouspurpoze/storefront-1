'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
// import { SignedInCheckoutNote } from '@/components/CheckoutContactNote'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import { resolveCheckoutContactForSubmit } from '@/lib/storefrontCustomerContact'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'
import {
  formatDeliveryNotes,
  showPreferredDateOfDelivery,
  showPreferredTimeOfDelivery,
  validateDeliveryDetails,
  type DeliveryDetailsValue,
} from '@/lib/templateSettings'
import { getOrderingAvailabilityFromConfig, getOrderingHoursFromConfig } from '@/lib/orderingHours'
import { formatMoney, useCart } from '../cart'
import type { ThemeTenant } from '../types'
import { AccountNavLink } from '@/components/account/AccountNavLink'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'
import { ShippingPolicyModal } from '@/components/ShippingPolicyModal'
import './luxe-essence.css'

const FREE_SHIPPING_MIN = 1500
const SHIPPING_FEE = 120

const STRIP_ITEMS = [
  { icon: '✨', text: 'Curated niche collections' },
  { icon: '📦', text: `Free shipping over ₹${FREE_SHIPPING_MIN.toLocaleString('en-IN')}` },
  { icon: '🔒', text: 'Secure checkout' },
  { icon: '🚚', text: 'Track every order' },
]

function shippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE
}

function ProductImage({ product }: { product?: PublicProduct }) {
  if (product?.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={product.imageUrl} alt={product.name} />
    )
  }
  return <span style={{ fontSize: '2.5rem' }}>🛍️</span>
}

export function LuxeEssencePage({
  products,
  tenant,
  config,
}: {
  products: PublicProduct[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline || tenant.tagline
  const heroHeadline = config?.content?.heroHeadline
  const heroSubcopy = config?.content?.heroSubcopy || tagline
  const contactEmail = config?.branding?.contactEmail
  const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey ?? 'luxe-essence')
  const showPreferredTime = showPreferredTimeOfDelivery(config, config?.themeKey ?? 'luxe-essence')
  const orderingHours = useMemo(() => getOrderingHoursFromConfig(config), [config])
  const orderingAvailability = useMemo(() => getOrderingAvailabilityFromConfig(config), [config])

  const { lines, itemCount, subtotal, addProduct, setQuantity, removeLine, clear } = useCart()

  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [shippingPolicyOpen, setShippingPolicyOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})
  const {
    email: prefillEmail,
    name: prefillName,
    phone: prefillPhone,
    lockedEmail,
    user,
    isReady,
  } = useCheckoutCustomerPrefill()

  useEffect(() => {
    if (!isReady) return
    if (prefillEmail && !email) setEmail(prefillEmail)
    if (prefillName && !name) setName(prefillName)
    if (prefillPhone && !phone) setPhone(prefillPhone)
  }, [isReady, prefillEmail, prefillName, prefillPhone, email, name, phone])

  const ship = useMemo(() => shippingCost(subtotal), [subtotal])
  const total = subtotal + ship
  const heroProducts = products.slice(0, 2)
  const brandParts = siteName.includes('|')
    ? siteName.split('|').map((s) => s.trim())
    : [siteName.split(' ')[0] ?? siteName, 'STUDIO']

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }, [])

  const handleAdd = useCallback(
    (product: PublicProduct) => {
      if (!product.inStock) return
      addProduct(product)
      showToast(`${product.name} added to cart`)
    },
    [addProduct, showToast],
  )

  const openCheckout = () => {
    setCartOpen(false)
    setCheckoutOpen(true)
    setShippingPolicyOpen(true)
    setCheckoutError(null)
    setOrderNumber(null)
  }

  const closeAll = () => {
    setCheckoutOpen(false)
    setCartOpen(false)
    setOrderNumber(null)
    setCheckoutError(null)
  }

  const onPlaceOrder = async () => {
    if (!lines.length || checkoutLoading) return
    const contact = resolveCheckoutContactForSubmit({
      formEmail: email,
      formName: name,
      formPhone: phone,
      authUser: user,
    })
    if (!contact.ok) {
      setCheckoutError(contact.message)
      return
    }
    if (showPreferredDate || showPreferredTime) {
      const slotCheck = validateDeliveryDetails(deliveryDetails, orderingHours, {
        requireDate: showPreferredDate,
        requireTime: showPreferredTime,
        availability: orderingAvailability,
      })
      if (!slotCheck.ok) {
        setCheckoutError(slotCheck.message)
        return
      }
    }
    const { email: trimmedEmail, name: trimmedName, phone: trimmedPhone } = contact

    setCheckoutError(null)
    setCheckoutLoading(true)
    try {
      const result = await runStorefrontCheckout({
        tenantId: tenant.id,
        tenantName: tenant.name,
        brandColor: tenant.brand,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customer: { email: trimmedEmail, name: trimmedName, phone: trimmedPhone },
        notes: formatDeliveryNotes(deliveryDetails),
      })
      clear()
      setOrderNumber(result.orderNumber)
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout failed. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  useEffect(() => {
    if (!cartOpen && !checkoutOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cartOpen, checkoutOpen])

  const modalOpen = cartOpen || checkoutOpen

  return (
    <div className="le-root">
      <StorefrontMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} config={config} />
      <ShippingPolicyModal
        open={shippingPolicyOpen}
        onClose={() => setShippingPolicyOpen(false)}
        config={config}
      />
      <header className="le-header">
        <div className="le-logo">
          <h1>
            {brandParts[0]}{' '}
            <span>| {brandParts[1] || 'STUDIO'}</span>
          </h1>
          <p className="le-tagline">{tagline}</p>
        </div>

        <ul className="le-nav-desktop">
          <li>
            <a href="#products">Shop</a>
          </li>
          <li>
            <a href="/products">All products</a>
          </li>
          <li>
            <a href="/orders/track">Track order</a>
          </li>
          <li>
            <a href="/shipping-policy">Shipping</a>
          </li>
          <li>
            <AccountNavLink />
          </li>
        </ul>

        <div className="le-actions">
          <button
            type="button"
            className="le-menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-label="Open menu"
          >
            ☰
          </button>
          <AccountProfileLink className="le-icon-btn" iconClassName="h-5 w-5" />
          <Link href="/orders/track" className="le-icon-btn" aria-label="Track order" title="Track order">
            🚚
          </Link>
          <button
            type="button"
            className="le-icon-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
          >
            🛍️
            {itemCount > 0 && <span className="le-cart-count">{itemCount}</span>}
          </button>
        </div>
      </header>

      <section className="le-hero">
        <div>
          <p className="le-hero-eyebrow">New season</p>
          <h2 className="le-hero-title">
            {heroHeadline ? (
              heroHeadline
            ) : (
              <>
                Signature scents
                <br />
                &amp; modern objects
              </>
            )}
          </h2>
          <p className="le-hero-sub">{heroSubcopy}</p>
          <div className="le-hero-actions">
            <a href="#products" className="le-btn-primary">
              Shop collection
            </a>
            <Link href="/shipping-policy" className="le-btn-ghost">
              Shipping info
            </Link>
          </div>
        </div>
        <div className="le-hero-visual">
          {(heroProducts.length > 0 ? heroProducts : []).map((p) => (
            <div key={p.id} className="le-hero-card">
              <div className="le-hero-card-img">
                <ProductImage product={p} />
              </div>
              <div className="le-hero-card-label">{p.name}</div>
            </div>
          ))}
          {heroProducts.length === 0 && (
            <>
              <div className="le-hero-card">
                <div className="le-hero-card-img">
                  <span style={{ fontSize: '2.5rem' }}>✨</span>
                </div>
                <div className="le-hero-card-label">Featured</div>
              </div>
              <div className="le-hero-card">
                <div className="le-hero-card-img">
                  <span style={{ fontSize: '2.5rem' }}>🌸</span>
                </div>
                <div className="le-hero-card-label">New arrival</div>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="le-strip">
        {STRIP_ITEMS.map((item) => (
          <div key={item.text} className="le-strip-item">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <section id="products" className="le-section">
        <p className="le-section-label">Shop</p>
        <h2 className="le-section-title">Featured products</h2>
        {products.length === 0 ? (
          <p className="le-empty-products">
            Products coming soon — add items in your admin dashboard under Store / Products.
          </p>
        ) : (
          <div className="le-product-grid">
            {products.map((product) => (
              <article key={product.id} className="le-product-card">
                <div className="le-product-img">
                  <ProductImage product={product} />
                </div>
                <div className="le-product-info">
                  <div className="le-product-title">{product.name}</div>
                  {(product.shortDescription || product.description) && (
                    <div className="le-product-desc">
                      {product.shortDescription || product.description}
                    </div>
                  )}
                  <div className="le-product-price">
                    {formatMoney(product.price, product.currency)}
                  </div>
                  <button
                    type="button"
                    className="le-add-to-cart"
                    disabled={!product.inStock}
                    onClick={() => handleAdd(product)}
                  >
                    {product.inStock ? 'Add to cart' : 'Out of stock'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="le-footer">
        <div className="le-footer-brand">
          <h3>{siteName}</h3>
          <p className="le-footer-tagline">{tagline}</p>
        </div>
        <div>
          <div className="le-footer-col-title">Shop</div>
          <ul className="le-footer-links">
            <li>
              <a href="#products">Featured</a>
            </li>
            <li>
              <a href="/products">All products</a>
            </li>
          </ul>
        </div>
        <div>
          <div className="le-footer-col-title">Account</div>
          <ul className="le-footer-links">
            <li>
              <Link href="/account">My orders</Link>
            </li>
            <li>
              <Link href="/orders/track">Track order</Link>
            </li>
            <li>
              <Link href="/account/login">Sign in</Link>
            </li>
            <li>
              <Link href="/account/login?signup=1">Sign up with Google</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="le-footer-col-title">Help</div>
          <ul className="le-footer-links">
            <li>
              <Link href="/shipping-policy">Shipping policy</Link>
            </li>
            {contactEmail && (
              <li>
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </li>
            )}
            {config?.branding?.socials?.instagram && (
              <li>
                <a href={config.branding.socials.instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </footer>
      <div className="le-footer-bottom">
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>

      {/* Cart modal */}
      <div
        className={`le-overlay ${modalOpen ? 'open' : ''}`}
        onClick={closeAll}
        role="presentation"
      />
      <div className={`le-modal ${cartOpen && !checkoutOpen ? 'open' : ''}`} role="dialog" aria-label="Shopping cart">
        <h2>🛒 Your cart {itemCount > 0 ? `(${itemCount})` : ''}</h2>
        {lines.length === 0 ? (
          <>
            <div className="le-cart-empty">
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>🛍️</div>
              <div>Your cart is empty</div>
            </div>
            <button type="button" className="le-close-btn" onClick={() => setCartOpen(false)}>
              Continue shopping
            </button>
          </>
        ) : (
          <>
            {lines.map((line) => (
              <div key={line.productId} className="le-cart-item">
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
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      className="le-qty-btn"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="le-remove-btn"
                      onClick={() => removeLine(line.productId)}
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="le-cart-item-price">
                  {formatMoney(line.price * line.quantity, line.currency)}
                </div>
              </div>
            ))}
            <div className="le-total-row">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, lines[0]?.currency ?? 'INR')}</span>
            </div>
            <div className="le-total-row" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
              <span>Shipping</span>
              <span>{ship === 0 ? 'Free' : formatMoney(ship, lines[0]?.currency ?? 'INR')}</span>
            </div>
            <div className="le-total-row">
              <span>Total</span>
              <span>{formatMoney(total, lines[0]?.currency ?? 'INR')}</span>
            </div>
            <button type="button" className="le-checkout-btn" onClick={openCheckout}>
              Proceed to checkout
            </button>
            <button type="button" className="le-close-btn" onClick={() => setCartOpen(false)}>
              Continue shopping
            </button>
          </>
        )}
      </div>

      {/* Checkout modal */}
      <div
        className={`le-modal ${checkoutOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
      >
        {!orderNumber ? (
          <>
            <h2>Checkout</h2>
            <p style={{ color: 'var(--le-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
              Almost there — fill in your details below.
            </p>

            <div className="le-order-summary">
              <div className="le-form-section-title" style={{ marginTop: 0 }}>
                Order summary
              </div>
              {lines.map((line) => (
                <div key={line.productId} className="le-order-line">
                  <span>
                    {line.name} ×{line.quantity}
                  </span>
                  <span>{formatMoney(line.price * line.quantity, line.currency)}</span>
                </div>
              ))}
              <div className="le-order-line">
                <span>Shipping</span>
                <span>{ship === 0 ? 'Free' : formatMoney(ship, lines[0]?.currency ?? 'INR')}</span>
              </div>
              <div className="le-order-line total">
                <span>Total</span>
                <span>{formatMoney(total, lines[0]?.currency ?? 'INR')}</span>
              </div>
            </div>

            <div className="le-form-section-title">Contact</div>
            {/* {lockedEmail && prefillEmail ? <SignedInCheckoutNote email={prefillEmail} /> : null} */}
            <div className="le-form-group">
              <label htmlFor="le-name">Full name</label>
              <input
                id="le-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            {!lockedEmail ? (
              <div className="le-form-group">
                <label htmlFor="le-email">Email</label>
                <input
                  id="le-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />
              </div>
            ) : null}
            <div className="le-form-group">
              <label htmlFor="le-phone">Phone *</label>
              <input
                id="le-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="le-form-section-title">Delivery</div>
            <DeliveryDetailsSection
              value={deliveryDetails}
              onChange={setDeliveryDetails}
              showPreferredDate={showPreferredDate}
              showPreferredTime={showPreferredTime}
              orderingHours={orderingHours}
              orderingAvailability={orderingAvailability}
              variant="plain"
            />

            {checkoutError && <p className="le-checkout-error">{checkoutError}</p>}

            <button
              type="button"
              className="le-checkout-btn"
              disabled={checkoutLoading || !lines.length}
              onClick={() => void onPlaceOrder()}
            >
              {checkoutLoading ? 'Processing…' : 'Pay & place order'}
            </button>
            <button
              type="button"
              className="le-close-btn"
              onClick={() => {
                setCheckoutOpen(false)
                setCartOpen(true)
              }}
            >
              ← Back to cart
            </button>
          </>
        ) : (
          <div className="le-success-screen">
            <span className="le-success-icon">🎉</span>
            <h2 className="le-success-title">Order placed!</h2>
            <p className="le-success-sub">
              Thank you for your order. We will email you confirmation shortly.
            </p>
            <div className="le-order-summary">
              <div style={{ fontSize: '0.78rem', color: 'var(--le-muted)', marginBottom: 8 }}>
                Order {orderNumber}
              </div>
              <Link href={`/orders/track?orderNumber=${encodeURIComponent(orderNumber)}`}>
                Track this order →
              </Link>
            </div>
            <button type="button" className="le-checkout-btn" onClick={closeAll}>
              Continue shopping
            </button>
          </div>
        )}
      </div>

      <div className={`le-toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
