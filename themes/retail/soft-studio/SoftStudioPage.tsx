'use client'
import { Fragment, type ReactNode } from 'react'

import { useEffect, useMemo, useState } from 'react'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
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
import { StandardStorefrontNav } from '@/components/StandardStorefrontNav'
import { StoreFooter } from '@/components/chrome/StoreFooter'
import { ProductCard } from '@/components/commerce/ProductCard'
import { useCartDrawerState } from '@/components/commerce/cartDrawerBus'
import { IconBag, IconCheck, IconClose, IconStar, IconTruck } from '@/ui'
import { ShippingPolicyModal } from '@/components/ShippingPolicyModal'
import { runPreCheckoutGuards } from '@/lib/checkoutGuard'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'
import { useRegisterWishlistAddon } from '@/components/wishlist/useWishlist'
import { homepageSectionOrder, THEME_SECTIONS } from '@/lib/storefrontSections'
import './soft-studio.css'

const SOFT_STUDIO_SECTIONS = THEME_SECTIONS['soft-studio']

const FREE_SHIPPING_MIN = 1500
const SHIPPING_FEE = 120

const STRIP_ITEMS = [
  { icon: <IconStar size={18} />, text: 'Thoughtfully made' },
  { icon: <IconCheck size={18} />, text: 'Handpicked quality' },
  { icon: <IconTruck size={18} />, text: `Free shipping over ₹${FREE_SHIPPING_MIN.toLocaleString('en-IN')}` },
  { icon: <IconBag size={18} />, text: 'Custom orders welcome' },
]

function shippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE
}


const DEFAULT_FOOTER_SHOP_LINKS: StorefrontNavLink[] = [
  { href: '#products', label: 'Featured' },
  { href: '/products', label: 'All products' },
]

export function SoftStudioPage({
  products,
  tenant,
  config,
  navLinks,
  footerLinks,
  addonsSlot,
}: {
  products: PublicProduct[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
  /** Paid add-on homepage blocks, rendered above the footer. */
  addonsSlot?: ReactNode
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const wishlistOn = useRegisterWishlistAddon(config)
  const tagline = config?.branding?.tagline || tenant.tagline
  const heroHeadline = config?.content?.heroHeadline
  const heroSubcopy = config?.content?.heroSubcopy || tagline
  const contactEmail = config?.branding?.contactEmail
  const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey ?? 'soft-studio')
  const showPreferredTime = showPreferredTimeOfDelivery(config, config?.themeKey ?? 'soft-studio')
  const orderingHours = useMemo(() => getOrderingHoursFromConfig(config), [config])
  const orderingAvailability = useMemo(() => getOrderingAvailabilityFromConfig(config), [config])

  const { lines, itemCount, subtotal, setQuantity, removeLine, clear } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const { accessToken } = useCheckoutCustomerPrefill()

  // Shared drawer bus: product-card quick add opens this theme's own cart sidebar.
  const [cartOpen, setCartOpen] = useCartDrawerState()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [shippingPolicyOpen, setShippingPolicyOpen] = useState(false)
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})

  const ship = useMemo(() => shippingCost(subtotal), [subtotal])
  const total = subtotal + ship
  const heroProducts = products.slice(0, 4)

  const openCheckout = () => {
    if (!requireAuthForCart()) return
    setCartOpen(false)
    setCheckoutOpen(true)
    setCheckoutError(null)
    setOrderNumber(null)
    if (!policyAcknowledged) {
      setShippingPolicyOpen(true)
    }
  }

  const onShippingPolicyClose = () => {
    setShippingPolicyOpen(false)
    setPolicyAcknowledged(true)
  }

  const closeCheckout = () => {
    setCheckoutOpen(false)
    setCartOpen(true)
  }

  const closeAll = () => {
    setCheckoutOpen(false)
    setCartOpen(false)
    setOrderNumber(null)
    setCheckoutError(null)
  }

  const onPlaceOrder = async () => {
    if (!lines.length || checkoutLoading) return
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setCheckoutError('Please enter a valid email.')
      return
    }
    if (!trimmedName) {
      setCheckoutError('Please enter your name.')
      return
    }

    const guard = runPreCheckoutGuards(config, deliveryDetails, {
      requireDate: showPreferredDate,
      requireTime: showPreferredTime,
    })
    if (!guard.ok) {
      setCheckoutError(guard.message)
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

    setCheckoutError(null)
    setCheckoutLoading(true)
    try {
      const result = await runStorefrontCheckout({
        tenantId: tenant.id,
        tenantName: tenant.name,
        brandColor: tenant.brand,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customer: { email: trimmedEmail, name: trimmedName, phone: phone.trim() || undefined },
        notes: formatDeliveryNotes(deliveryDetails),
        deliveryDetails,
        accessToken,
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

  const blocks: Record<(typeof SOFT_STUDIO_SECTIONS)[number], ReactNode> = {
    hero: (
      <div className="ss-hero">
        <div className="ss-hero-text">
          <p className="ss-hero-eyebrow">Curated for you</p>
          <h1 className="ss-hero-h1">
            {heroHeadline ? (
              heroHeadline
            ) : (
              <>
                Every piece
                <br />
                tells a <em>story</em>
              </>
            )}
          </h1>
          <p className="ss-hero-sub">{heroSubcopy}</p>
          <div className="ss-hero-actions">
            <a href="#products" className="ss-btn-primary">
              Shop Now
            </a>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="ss-btn-ghost">
                Contact us
              </a>
            )}
          </div>
        </div>
        <div className="ss-hero-image">
          <div className="ss-hero-image-inner">
            <div className="ss-yarn-blob" />
            <div className="ss-yarn-blob" />
            <div className="ss-yarn-blob" />
            <div className="ss-hero-product-mockup">
              {(heroProducts.length > 0
                ? heroProducts
                : (Array.from({ length: 4 }, (_, i) => ({
                    id: `placeholder-${i}`,
                    name: 'Coming soon',
                    price: 0,
                    currency: 'INR',
                    slug: '',
                    inStock: false,
                  })) as PublicProduct[])
              ).map((p) => (
                <div key={p.id} className="ss-mock-card">
                  <div className="ss-mock-thumb">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} />
                    ) : (
                      <IconBag size={28} />
                    )}
                  </div>
                  <div className="ss-mock-name">{p.name}</div>
                  {p.price > 0 && (
                    <div className="ss-mock-price">{formatMoney(p.price, p.currency ?? 'INR')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    highlights: (
      <div className="ss-strip">
        {STRIP_ITEMS.map((item) => (
          <div key={item.text} className="ss-strip-item">
            <span className="ss-strip-icon">{item.icon}</span>
            <span className="ss-strip-text">{item.text}</span>
          </div>
        ))}
      </div>
    ),
    products: (
      <section id="products" className="ss-section">
        <p className="ss-section-label">New Arrivals</p>
        <h2 className="ss-section-title">Made for slow living</h2>
        {products.length === 0 ? (
          <p className="ss-empty-products">
            Products coming soon — add items in your admin dashboard under Store / Products.
          </p>
        ) : (
          <ul className="sf-product-grid">
            {products.map((product, index) => (
              <li key={product.id}>
                <ProductCard product={product} wishlistEnabled={wishlistOn} priority={index < 4} />
              </li>
            ))}
          </ul>
        )}
      </section>
    ),
  }

  return (
    <div className="ss-root">
      <ShippingPolicyModal open={shippingPolicyOpen} onClose={onShippingPolicyClose} config={config} />
      <StandardStorefrontNav
        tenant={{ name: siteName, logoUrl: config?.branding?.logoUrl ?? tenant.logoUrl }}
        config={config}
        itemCount={itemCount}
        variant="retail"
        navLinks={navLinks}
        onCartClick={() => {
          if (requireAuthForCart()) setCartOpen(true)
        }}
      />

      {homepageSectionOrder(config, SOFT_STUDIO_SECTIONS).map((type) => (
        <Fragment key={type}>{blocks[type as keyof typeof blocks]}</Fragment>
      ))}

      {addonsSlot}

      <StoreFooter
        name={siteName}
        tagline={tagline}
        logoUrl={config?.branding?.logoUrl}
        config={config}
        columns={[
          { title: 'Shop', links: footerLinks?.length ? footerLinks : DEFAULT_FOOTER_SHOP_LINKS },
          { title: 'Help', links: [{ href: '/orders/track', label: 'Track order' }, { href: '/shipping-policy', label: 'Shipping policy' }, { href: '/account', label: 'My account' }] },
        ]}
      />

      <div
        className={`ss-overlay ${cartOpen ? 'open' : ''}`}
        onClick={() => setCartOpen(false)}
        role="presentation"
      />
      <aside className={`ss-cart-sidebar ${cartOpen ? 'open' : ''}`} aria-label="Shopping cart">
        <div className="ss-cart-header">
          <span className="ss-cart-title">Your Cart</span>
          <button type="button" className="ss-close-btn" onClick={() => setCartOpen(false)} aria-label="Close cart">
            <IconClose size={18} />
          </button>
        </div>
        <div className="ss-cart-items">
          {lines.length === 0 ? (
            <div className="ss-cart-empty">
              <span className="ss-cart-empty-icon"><IconBag size={32} /></span>
              <div>Your cart is empty</div>
              <div style={{ fontSize: '0.78rem', marginTop: '8px', color: 'var(--ss-muted)' }}>
                Add some lovely pieces from the shop!
              </div>
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.productId} className="ss-cart-item">
                <div className="ss-cart-item-thumb">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt={line.name} />
                  ) : (
                    <IconBag size={22} />
                  )}
                </div>
                <div className="ss-cart-item-details">
                  <div className="ss-cart-item-name">{line.name}</div>
                  <div className="ss-qty-control">
                    <button
                      type="button"
                      className="ss-qty-btn"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="ss-qty-val">{line.quantity}</span>
                    <button
                      type="button"
                      className="ss-qty-btn"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ss-remove-item"
                    onClick={() => removeLine(line.productId)}
                  >
                    Remove
                  </button>
                </div>
                <div className="ss-cart-item-price">
                  {formatMoney(line.price * line.quantity, line.currency)}
                </div>
              </div>
            ))
          )}
        </div>
        {lines.length > 0 && (
          <div className="ss-cart-footer">
            <div className="ss-cart-summary">
              <div className="ss-summary-row">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal, lines[0]?.currency ?? 'INR')}</span>
              </div>
              <div className="ss-summary-row">
                <span>Shipping</span>
                <span>{ship === 0 ? 'Free' : formatMoney(ship, lines[0]?.currency ?? 'INR')}</span>
              </div>
              <div className="ss-summary-row total">
                <span>Total</span>
                <span>{formatMoney(total, lines[0]?.currency ?? 'INR')}</span>
              </div>
            </div>
            <button type="button" className="ss-checkout-btn" onClick={openCheckout}>
              Proceed to Checkout →
            </button>
            <button type="button" className="ss-continue-btn" onClick={() => setCartOpen(false)}>
              Continue Shopping
            </button>
          </div>
        )}
      </aside>

      <div className={`ss-checkout-modal ${checkoutOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="ss-checkout-box">
          {!orderNumber ? (
            <div className="ss-checkout-form">
              <h2 className="ss-checkout-title">Checkout</h2>
              <p className="ss-checkout-subtitle">Almost there! Fill in your details below.</p>

              <div className="ss-order-summary-box">
                <div className="ss-order-summary-title">Order Summary</div>
                {lines.map((line) => (
                  <div key={line.productId} className="ss-order-line">
                    <span>
                      {line.name} ×{line.quantity}
                    </span>
                    <span>{formatMoney(line.price * line.quantity, line.currency)}</span>
                  </div>
                ))}
                <div className="ss-order-line">
                  <span>Shipping</span>
                  <span>{ship === 0 ? 'Free' : formatMoney(ship, lines[0]?.currency ?? 'INR')}</span>
                </div>
                <div className="ss-order-line total">
                  <span>Total</span>
                  <span>{formatMoney(total, lines[0]?.currency ?? 'INR')}</span>
                </div>
              </div>

              <div className="ss-form-section">
                <div className="ss-form-section-title">Contact</div>
                <div className="ss-form-row full">
                  <div className="ss-form-group">
                    <label htmlFor="ss-name">Full Name</label>
                    <input
                      id="ss-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </div>
                </div>
                <div className="ss-form-row">
                  <div className="ss-form-group">
                    <label htmlFor="ss-email">Email</label>
                    <input
                      id="ss-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                  <div className="ss-form-group">
                    <label htmlFor="ss-phone">Phone</label>
                    <input
                      id="ss-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="ss-form-section">
                <div className="ss-form-section-title">Delivery</div>
                <DeliveryDetailsSection
                  value={deliveryDetails}
                  onChange={setDeliveryDetails}
                  showPreferredDate={showPreferredDate}
                  showPreferredTime={showPreferredTime}
                  orderingHours={orderingHours}
                  orderingAvailability={orderingAvailability}
                  variant="plain"
                />
              </div>

              {checkoutError && <p className="ss-checkout-error">{checkoutError}</p>}

              <button
                type="button"
                className="ss-place-order-btn"
                disabled={checkoutLoading || !lines.length}
                onClick={() => void onPlaceOrder()}
              >
                {checkoutLoading ? 'Processing…' : 'Pay & place order'}
              </button>
              <button type="button" className="ss-back-to-cart" onClick={closeCheckout}>
                ← Back to Cart
              </button>
            </div>
          ) : (
            <div className="ss-success-screen show">
              <span className="ss-success-icon"><IconCheck size={40} /></span>
              <h2 className="ss-success-title">Order Placed!</h2>
              <p className="ss-success-sub">Thank you for your order. We will email you confirmation shortly.</p>
              <div className="ss-success-order">
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--ss-muted)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Order {orderNumber}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ss-muted)' }}>
                  A confirmation will be sent to your email.
                </div>
              </div>
              <button type="button" className="ss-place-order-btn" onClick={closeAll}>
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
