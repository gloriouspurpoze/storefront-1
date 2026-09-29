'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import { fetchProducts, submitLead } from '@/lib/storefront-api'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import { validateShippingAddress } from '@/lib/storefrontShippingAddress'
import type { DeliveryDetailsValue } from '@/lib/templateSettings'
import {
  getOrderingAvailabilityFromConfig,
  getOrderingHoursFromConfig,
  isStoreOpenNow,
  ORDERING_DAY_KEYS,
  ORDERING_DAY_LABELS,
  formatDayOrderingHours,
} from '@/lib/orderingHours'
import { getShippingPolicyFromConfig } from '@/lib/shippingPolicy'
import type { ThemeTenant } from '@/themes/restaurant/types'
import { BB_IMG_FALLBACK } from './catalog'
import { layoutBrownButterProducts, type TinGroup } from './productLayout'
import { useBrownButterCart } from './useBrownButterCart'
import { AccountProfileLink } from '@/components/account/AccountProfileLink'
import { SignedInCheckoutNote } from '@/components/CheckoutContactNote'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { formatSavedAddressLine, resolveCheckoutContactForSubmit } from '@/lib/storefrontCustomerContact'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'
import { StorefrontHeaderBar, StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'
import {
  coerceDeliveryMode,
  getEnabledDeliveryModes,
  type StorefrontDeliveryMode,
} from '@/lib/storefrontDeliveryModes'
import {
  storefrontShippingAmountInr,
  toApiFulfillmentMode,
} from '@/lib/storefrontCheckoutPricing'
import './brown-butter.css'

type DeliveryMode = 'pickup' | 'local' | 'ship'

function toBrownButterMode(mode: StorefrontDeliveryMode): DeliveryMode {
  if (mode === 'delivery') return 'local'
  return mode
}

function getEnabledBrownButterModes(config: StorefrontConfig | null | undefined): DeliveryMode[] {
  return getEnabledDeliveryModes(config).map(toBrownButterMode)
}

function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`
}

function categoryEmoji(sectionId: string, label: string): string {
  const key = `${sectionId} ${label}`.toLowerCase()
  if (key.includes('tin')) return '🎁'
  if (key.includes('cake')) return '🎂'
  if (key.includes('brownie')) return '🍫'
  if (key.includes('cup')) return '🧁'
  return '🍪'
}

function summarizeStoreHours(config: StorefrontConfig | null): string {
  const hours = getOrderingHoursFromConfig(config)
  const openDays = ORDERING_DAY_KEYS.filter((d) => !hours[d].closed)
  if (openDays.length === 0) return 'Currently closed'

  const timeLabel = formatDayOrderingHours(hours[openDays[0]])
  const allSameHours = openDays.every(
    (d) =>
      formatDayOrderingHours(hours[d]) === timeLabel &&
      hours[d].openTime === hours[openDays[0]].openTime &&
      hours[d].closeTime === hours[openDays[0]].closeTime,
  )

  if (openDays.length === 7 && allSameHours) return `Daily · ${timeLabel}`
  if (
    openDays.length === 6 &&
    hours.sunday.closed &&
    !hours.monday.closed &&
    allSameHours
  ) {
    return `Mon – Sat · ${timeLabel}`
  }

  const first = ORDERING_DAY_LABELS[openDays[0]].slice(0, 3)
  const last = ORDERING_DAY_LABELS[openDays[openDays.length - 1]].slice(0, 3)
  return `${first} – ${last} · ${timeLabel}`
}

function formatDeliverySummary(config: StorefrontConfig | null): string {
  const policy = getShippingPolicyFromConfig(config)
  if (policy.summary) return policy.summary
  if (policy.zones?.length) {
    return policy.zones
      .map((z) => {
        const fee = z.fee?.trim()
        if (fee) return `${z.label} ${fee}`
        return z.details ? `${z.label} · ${z.details}` : z.label
      })
      .join(' · ')
  }
  return 'Mira Road free · Mumbai ₹70 · Outside 2–7 days'
}

function BbImage({
  src,
  alt,
  className,
  style,
}: {
  src?: string
  alt: string
  className?: string
  style?: React.CSSProperties
}) {
  const [url, setUrl] = useState(src || BB_IMG_FALLBACK)
  useEffect(() => {
    setUrl(src || BB_IMG_FALLBACK)
  }, [src])
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className ?? 'card-img'}
      src={url}
      alt={alt}
      width={400}
      height={400}
      decoding="async"
      style={style}
      onError={() => setUrl(BB_IMG_FALLBACK)}
    />
  )
}

function ProductCard({
  product,
  qty,
  onAdd,
  onSetQty,
}: {
  product: PublicProduct
  qty: number
  onAdd: () => void
  onSetQty: (qty: number) => void
}) {
  const selected = qty > 0
  const outOfStock = !product.inStock

  return (
    <div
      className={`product-card${selected ? ' selected' : ''}${selected ? ' show-stepper' : ''}`}
      data-id={product.slug}
      onClick={() => {
        if (!outOfStock && !selected) onAdd()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !outOfStock && !selected) onAdd()
      }}
      role={outOfStock ? undefined : 'button'}
      tabIndex={outOfStock ? undefined : 0}
    >
      <div className="card-img-wrap">
        <BbImage src={product.imageUrl} alt={product.name} />
        <div className="veg-dot" aria-label="Vegetarian" />
        <div className="check-badge">✓</div>
      </div>
      <div className="card-body">
        <div className="card-name">{product.name}</div>
        <div className="card-desc">{product.shortDescription ?? product.description ?? ''}</div>
        <div className="card-bottom">
          <div className="card-price">{formatInr(product.price)}</div>
          {outOfStock ? (
            <span className="sold-out-label">Sold out</span>
          ) : !selected ? (
            <button
              type="button"
              className="add-btn"
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
            >
              + Add
            </button>
          ) : (
            <div className="qty-stepper">
              <button
                type="button"
                className="qty-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onSetQty(qty - 1)
                }}
              >
                −
              </button>
              <span className="qty-num">{qty}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onSetQty(qty + 1)
                }}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TinGroupCard({
  group,
  qtyFor,
  onAdd,
  onSetQty,
}: {
  group: TinGroup
  qtyFor: (productId: string, variantId?: string) => number
  onAdd: (product: PublicProduct, variantId?: string) => void
  onSetQty: (product: PublicProduct, qty: number, variantId?: string) => void
}) {
  const groupSelected = group.variants.some((v) => qtyFor(v.id, v.variantId) > 0)

  return (
    <div className={`tin-card${groupSelected ? ' selected' : ''}`} data-id={group.id}>
      <div className="card-img-wrap">
        <BbImage src={group.img} alt={group.name} />
        <div className="check-badge">✓</div>
      </div>
      <div className="card-body card-body--compact">
        <div className="card-name">{group.name}</div>
        <div className="card-desc">{group.desc}</div>
      </div>
      <div className="variant-rows">
        {group.variants.map((v) => {
          const qty = qtyFor(v.id, v.variantId)
          const active = qty > 0
          const outOfStock = !v.inStock
          return (
            <div
              key={v.variantId ?? v.id}
              className={`variant-item${active ? ' active v-show-stepper' : ''}`}
            >
              <div className="variant-left">
                <span className="variant-size">{v.sizeLabel}</span>
                <span className="variant-price">{formatInr(v.price)}</span>
              </div>
              <div className="variant-right">
                {outOfStock ? (
                  <span className="sold-out-label">Sold out</span>
                ) : !active ? (
                  <button type="button" className="v-add-btn" onClick={() => onAdd(v, v.variantId)}>
                    + Add
                  </button>
                ) : (
                  <div className="v-qty-stepper">
                    <button type="button" className="v-qty-btn" onClick={() => onSetQty(v, qty - 1, v.variantId)}>
                      −
                    </button>
                    <span className="v-qty-num">{qty}</span>
                    <button type="button" className="v-qty-btn" onClick={() => onSetQty(v, qty + 1, v.variantId)}>
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StoreFooter({
  config,
  contactPhone,
}: {
  config: StorefrontConfig | null
  contactPhone?: string
}) {
  const pickup = config?.branding?.address || 'Near Tanwar Hospital, Mira Road'
  const whatsapp = config?.branding?.socials?.whatsapp || contactPhone
  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : undefined

  return (
    <div className="store-footer">
      <div className="footer-row">
        <div className="footer-icon">🕐</div>
        <div className="footer-text">
          <div className="footer-label">Store hours</div>
          <div className="footer-value">{summarizeStoreHours(config)}</div>
        </div>
      </div>
      <div className="footer-row">
        <div className="footer-icon">📍</div>
        <div className="footer-text">
          <div className="footer-label">Pickup location</div>
          <div className="footer-value">{pickup}</div>
        </div>
      </div>
      <div className="footer-row">
        <div className="footer-icon">🚚</div>
        <div className="footer-text">
          <div className="footer-label">Delivery</div>
          <div className="footer-value">{formatDeliverySummary(config)}</div>
        </div>
      </div>
      {contactPhone ? (
        <div className="footer-row">
          <div className="footer-icon">💬</div>
          <div className="footer-text">
            <div className="footer-label">Questions?</div>
            <div className="footer-value">{contactPhone}</div>
          </div>
          {waHref ? (
            <a className="footer-wa-btn" href={waHref} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function BrownButterPage({
  tenant,
  config,
  products: initialProducts = [],
  navLinks,
  footerLinks: _footerLinks,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  products?: PublicProduct[]
  navLinks?: { href: string; label: string }[]
  /** Accepted for layout-router parity; store footer is hours/location, not page links. */
  footerLinks?: { href: string; label: string }[]
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const headerTitle = config?.branding?.tagline || '📍 Delivering Across Mumbai'
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl || '/private/thebrownbutter/media/logo.jpeg'
  const contactPhone = config?.branding?.contactPhone || config?.branding?.socials?.whatsapp
  const heroLocation =
    config?.branding?.address?.split(',')[0]?.trim() || 'Mira Road, Mumbai'

  const orderingHours = useMemo(() => getOrderingHoursFromConfig(config), [config])
  const orderingAvailability = useMemo(() => getOrderingAvailabilityFromConfig(config), [config])
  const storeOpen = useMemo(() => isStoreOpenNow(orderingHours), [orderingHours])

  const { entries, itemCount, subtotal, add, setQty, qtyFor, clear } = useBrownButterCart()
  const { requireAuthForCart } = useCartAuthGate()
  const {
    email: prefillEmail,
    name: prefillName,
    phone: prefillPhone,
    deliveryDetails: prefillDelivery,
    lockedEmail,
    user,
    accessToken,
    isReady,
  } = useCheckoutCustomerPrefill()
  const [products, setProducts] = useState<PublicProduct[]>(initialProducts)
  const [productsLoading, setProductsLoading] = useState(initialProducts.length === 0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [view, setView] = useState<'menu' | 'success' | 'enquiry_success'>('menu')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [noItemWarn, setNoItemWarn] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  const [delivery, setDelivery] = useState<DeliveryMode>('pickup')
  const [pincode, setPincode] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [birthday, setBirthday] = useState('')
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const enabledDeliveryModes = useMemo(() => getEnabledBrownButterModes(config), [config])

  useEffect(() => {
    setDelivery((prev) => coerceDeliveryMode(prev, enabledDeliveryModes, 'pickup'))
  }, [enabledDeliveryModes])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    if (prefillEmail && !email) setEmail(prefillEmail)
    if (prefillName && !name) setName(prefillName)
    if (prefillPhone && !phone) setPhone(prefillPhone)
  }, [isReady, prefillEmail, prefillName, prefillPhone, email, name, phone])

  useEffect(() => {
    if (!isReady || address.trim()) return
    const line = formatSavedAddressLine(prefillDelivery)
    if (line) setAddress(line)
  }, [isReady, prefillDelivery, address])

  useEffect(() => {
    const onScroll = () => {
      document.querySelector('.sf-store-header')?.classList.toggle('scrolled', window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts)
      setProductsLoading(false)
      return
    }
    setProductsLoading(true)
    void fetchProducts(tenant.id, 80)
      .then((list) => setProducts(list))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false))
  }, [tenant.id, initialProducts])

  const sections = useMemo(() => layoutBrownButterProducts(products), [products])

  const categoryTabs = useMemo(() => {
    const tabs: Array<{ id: string; label: string; emoji: string }> = [
      { id: 'all', label: 'All', emoji: '🍪' },
    ]
    for (const section of sections) {
      if (section.items.length === 0) continue
      tabs.push({
        id: section.id,
        label: section.label,
        emoji: categoryEmoji(section.id, section.label),
      })
    }
    return tabs
  }, [sections])

  const visibleSections = useMemo(() => {
    if (activeCategory === 'all') return sections
    return sections.filter((s) => s.id === activeCategory)
  }, [sections, activeCategory])

  const showCartBar = itemCount > 0 && view === 'menu'

  useEffect(() => {
    document.body.classList.toggle('has-cart-bar', showCartBar)
    document.body.classList.toggle('sheet-open', sheetOpen)
    return () => {
      document.body.classList.remove('has-cart-bar', 'sheet-open')
    }
  }, [showCartBar, sheetOpen])

  const deliveryFee = useMemo(() => {
    // Mumbai / courier ship is enquiry-only for now — never charge in checkout UI.
    if (delivery === 'ship') return 0
    return storefrontShippingAmountInr(delivery, subtotal, config)
  }, [delivery, subtotal, config])

  const total = subtotal + deliveryFee
  const isShipEnquiry = delivery === 'ship'

  const openSheet = useCallback(() => {
    if (itemCount === 0) {
      setNoItemWarn(true)
      return
    }
    if (!requireAuthForCart()) return
    setNoItemWarn(false)
    setSheetOpen(true)
  }, [itemCount, requireAuthForCart])

  const onSubmit = async () => {
    if (!requireAuthForCart()) return
    if (itemCount === 0) {
      setNoItemWarn(true)
      return
    }

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
    if (delivery === 'ship' && !contact.phone?.trim()) {
      setCheckoutError('Phone number is required for shipping enquiries.')
      return
    }

    if (!deliveryDate.trim() || !deliveryTime.trim()) {
      setCheckoutError('Delivery date and time are required.')
      return
    }
    if ((delivery === 'local' || delivery === 'ship') && !address.trim()) {
      setCheckoutError('Delivery address is required.')
      return
    }
    if (delivery === 'ship' && !/^\d{6}$/.test(pincode.replace(/\D/g, ''))) {
      setCheckoutError('Please enter a valid 6-digit PIN code.')
      return
    }

    let deliveryDetailsForCheckout: DeliveryDetailsValue | undefined
    if (delivery !== 'pickup') {
      const trimmedAddress = address.trim()
      const addressParts = trimmedAddress.split(',').map((s) => s.trim()).filter(Boolean)
      const city =
        addressParts.length >= 2
          ? addressParts[addressParts.length - 1]
          : delivery === 'local'
            ? 'Mira Road'
            : 'Mumbai'
      const addressLine1 =
        addressParts.length >= 2 ? addressParts.slice(0, -1).join(', ') : trimmedAddress
      const normalizedPin =
        delivery === 'ship' ? pincode.replace(/\D/g, '').slice(0, 6) : '401107'

      deliveryDetailsForCheckout = {
        addressLine1,
        city,
        state: 'Maharashtra',
        pincode: normalizedPin,
      }

      const addressCheck = validateShippingAddress(deliveryDetailsForCheckout)
      if (!addressCheck.ok) {
        setCheckoutError(addressCheck.message)
        return
      }
    }

    const lines = entries.map((e) => ({
      productId: e.id,
      quantity: e.qty,
      variantId: e.variantId,
    }))

    const notes = [
      `Delivery: ${delivery}`,
      delivery === 'ship' && pincode ? `PIN: ${pincode}` : null,
      deliveryDate ? `Date: ${deliveryDate}` : null,
      deliveryTime ? `Time: ${deliveryTime}` : null,
      address ? `Address: ${address}` : null,
      birthday ? `Birthday: ${birthday}` : null,
      deliveryFee ? `Delivery fee: ${formatInr(deliveryFee)}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      // Ship anywhere in Mumbai → CRM lead / enquiry only (no Razorpay, no order).
      if (delivery === 'ship') {
        const nameParts = contact.name.trim().split(/\s+/).filter(Boolean)
        const firstName = nameParts[0] || 'Customer'
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined
        const pin = pincode.replace(/\D/g, '').slice(0, 6)
        const fullAddress = [
          address.trim(),
          pin ? `PIN ${pin}` : null,
          'Mumbai',
        ]
          .filter(Boolean)
          .join(', ')

        await submitLead({
          tenantId: tenant.id,
          firstName,
          lastName,
          email: contact.email,
          phone: contact.phone || '',
          address: fullAddress,
          preferredDate: deliveryDate.trim() || undefined,
          locality: 'Mumbai',
          source: 'brownbutter-ship-enquiry',
          accessToken,
          message: [
            'Shipping enquiry — All over Mumbai (not paid yet).',
            deliveryTime ? `Preferred time: ${deliveryTime}` : null,
            birthday ? `Birthday: ${birthday}` : null,
            notes,
          ]
            .filter(Boolean)
            .join('\n'),
          services: entries.map((e) => ({
            serviceId: e.id,
            name: e.name,
            quantity: e.qty,
            unitPrice: e.price,
            currency: 'INR',
          })),
        })

        setOrderNumber(null)
        setView('enquiry_success')
        setSheetOpen(false)
        clear()
        return
      }

      const result = await runStorefrontCheckout({
        tenantId: tenant.id,
        tenantName: siteName,
        brandColor: tenant.brand,
        lines,
        customer: {
          email: contact.email,
          name: contact.name,
          phone: contact.phone,
        },
        notes,
        deliveryDetails: deliveryDetailsForCheckout,
        fulfillmentMode: toApiFulfillmentMode(delivery),
        accessToken,
      })
      setOrderNumber(result.orderNumber)
      setView('success')
      setSheetOpen(false)
      clear()
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (view === 'enquiry_success') {
    return (
      <div className="bb-root bb-page">
        <div className="bb-success-card">
          <div className="success-screen" style={{ display: 'block' }}>
            <span className="big-emoji">📬</span>
            <h2>Enquiry sent!</h2>
            <p>
              Thanks — we&apos;ve received your Mumbai shipping request.
              <br />
              {contactPhone
                ? 'We will WhatsApp you shortly with delivery options.'
                : 'Our team will follow up to confirm shipping.'}
            </p>
            <p style={{ marginTop: 12, fontSize: 14, opacity: 0.85 }}>
              You can track this under <strong>Account → Enquiries</strong>.
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setView('menu')
              }}
            >
              <span>Back to menu</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'success') {
    return (
      <div className="bb-root bb-page">
        <div className="bb-success-card">
          <div className="success-screen" style={{ display: 'block' }}>
            <span className="big-emoji">🍪</span>
            <h2>Order received!</h2>
            <p>
              We&apos;ve got your order.
              <br />
              {contactPhone ? 'We will WhatsApp you shortly to confirm.' : 'Receipt sent to your email.'}
            </p>
            {orderNumber && <span className="order-badge">Order {orderNumber}</span>}
            <button type="button" className="btn" onClick={() => { setView('menu'); setOrderNumber(null) }}>
              <span>Order again</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasMenu = sections.some((s) => s.items.length > 0)

  const cartChrome =
    view === 'menu' ? (
      <div className="bb-chrome">
        <div
          className={`sheet-overlay${sheetOpen ? ' open' : ''}`}
          onClick={() => setSheetOpen(false)}
          aria-hidden={!sheetOpen}
        />
        <div
          className={`checkout-sheet${sheetOpen ? ' open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
          aria-hidden={!sheetOpen}
        >
          <div className="sheet-handle" aria-hidden />
          <div className="sheet-header">
            <h2 className="sheet-title" id="sheet-title">Your Order</h2>
            <button type="button" className="sheet-close" aria-label="Close checkout" onClick={() => setSheetOpen(false)}>×</button>
          </div>
          <div className="sheet-body">
            <div className="menu-section">
              <div className="section-label">Delivery</div>
              <div className="delivery-options">
                {([
                  ['pickup', 'Self Pickup · Mira Road', 'Pick up from Tanwar hospital.', 'Free'],
                  [
                    'local',
                    'Within Mira Road',
                    'Same-day delivery in Mira Road area.',
                    storefrontShippingAmountInr('local', subtotal, config) === 0
                      ? 'Free'
                      : formatInr(storefrontShippingAmountInr('local', subtotal, config)),
                  ],
                  [
                    'ship',
                    'All over Mumbai',
                    'Send an enquiry — we confirm shipping before payment.',
                    'Enquiry',
                  ],
                ] as const)
                  .filter(([mode]) => enabledDeliveryModes.includes(mode))
                  .map(([mode, title, desc, fee]) => (
                  <label
                    key={mode}
                    className={`delivery-card${delivery === mode ? ' selected' : ''}`}
                    onClick={() => setDelivery(mode)}
                  >
                    <input type="radio" name="delivery" value={mode} checked={delivery === mode} readOnly />
                    <span className="delivery-radio" />
                    <span className="delivery-body">
                      <span className="delivery-title">{title}</span>
                      <span className="delivery-desc">{desc}</span>
                    </span>
                    <span className="delivery-fee">{fee}</span>
                  </label>
                ))}
              </div>

              {delivery === 'ship' && (
                <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
                  <label htmlFor="bb-pincode">Delivery PIN Code</label>
                  <input id="bb-pincode" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit PIN code" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                </div>
              )}

              <div className="field-row" style={{ marginTop: 14, marginBottom: 0 }}>
                <div className="field">
                  <label htmlFor="bb-date">Delivery Date</label>
                  <input id="bb-date" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="bb-time">Preferred Time</label>
                  <input id="bb-time" type="time" min="11:00" max="23:59" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
                </div>
              </div>
              <div className="field-hint">Orders placed after 2:00 PM IST are scheduled for the next day.</div>
              <div className="field-hint">Delivery Slots start at 11:00 AM IST.</div>
            </div>

            <div className={`cart-summary${entries.length ? ' visible' : ''}`}>
              <div className="cart-title">🛒 Your Order</div>
              {entries.map((e) => (
                <div key={e.id} className="cart-row">
                  <span>{e.name} × {e.qty}</span>
                  <span>{formatInr(e.price * e.qty)}</span>
                </div>
              ))}
              {deliveryFee > 0 && (
                <div className="cart-row shipping">
                  <span>Delivery</span>
                  <span>{formatInr(deliveryFee)}</span>
                </div>
              )}
              {isShipEnquiry ? (
                <div className="cart-row shipping">
                  <span>Shipping</span>
                  <span>We&apos;ll confirm</span>
                </div>
              ) : null}
              <div className="cart-row cart-total">
                <span>{isShipEnquiry ? 'Items total' : 'Total'}</span>
                <span>{formatInr(total)}</span>
              </div>
              {isShipEnquiry ? (
                <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.8 }}>
                  No payment yet — this sends an enquiry to our team.
                </p>
              ) : null}
            </div>

            <div className="fields">
              <div className="section-label">Your Details</div>
              {lockedEmail && prefillEmail ? (
                <SignedInCheckoutNote email={prefillEmail} />
              ) : null}
              <div className="field">
                <label htmlFor="bb-name">Name</label>
                <input id="bb-name" type="text" autoComplete="name" placeholder="e.g. Aisha Khan" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              {!lockedEmail ? (
                <div className="field">
                  <label htmlFor="bb-email">Email</label>
                  <input
                    id="bb-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="field">
                <label htmlFor="bb-phone">Phone Number</label>
                <input id="bb-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              {delivery !== 'pickup' && (
                <div className="field">
                  <label htmlFor="bb-address">Delivery Address</label>
                  <input id="bb-address" type="text" autoComplete="street-address" placeholder="Flat / Street / Area, City" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              )}
              <div className="field">
                <label htmlFor="bb-birthday">Birthday 🎂</label>
                <input id="bb-birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              </div>
            </div>

            {noItemWarn && <p className="no-item-warn show">Please select at least one item 🍪</p>}
            {checkoutError && <p className="no-item-warn show">{checkoutError}</p>}

            <button type="button" className="btn" disabled={checkoutLoading} onClick={() => void onSubmit()}>
              <span>
                {checkoutLoading
                  ? isShipEnquiry
                    ? 'Sending enquiry…'
                    : 'Processing…'
                  : isShipEnquiry
                    ? 'Send enquiry'
                    : 'Place order & pay'}
              </span>
              <span>→</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          className={`sticky-cart${showCartBar ? ' visible' : ''}`}
          onClick={openSheet}
          aria-label="View cart and checkout"
        >
          <span className="sticky-cart__left">
            <span className="sticky-cart__icon" aria-hidden>🛒</span>
            <span className="sticky-cart__count">{itemCount}</span>
            <span className="sticky-cart__label">View Cart</span>
          </span>
          <span className="sticky-cart__total">{formatInr(subtotal)}</span>
          <span className="sticky-cart__arrow" aria-hidden>→</span>
        </button>
      </div>
    ) : null

  return (
    <div className="bb-root bb-page">
      <StorefrontMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        config={config}
        navLinks={navLinks}
      />
      <StorefrontHeaderBar
        title={headerTitle}
        onMenuOpen={() => setMenuOpen(true)}
        actions={
          <AccountProfileLink className="action-profile-btn" iconClassName="h-4 w-4" />
        }
      />

      <div className="bb-store-wrap">
        <section className="hero">
          <div className="status-card">
            <div className="status-left">
              <div className={`status-indicator${storeOpen ? '' : ' status-indicator--closed'}`} />
              <div className="status-details">
                <p>{storeOpen ? 'Accepting Orders Fresh Daily' : 'Currently Closed'}</p>
                <span>
                  {orderingAvailability.slotsNote || 'Delivery slots start at 11:00 AM IST'}
                </span>
              </div>
            </div>
            <div className={`status-badge${storeOpen ? '' : ' status-badge--closed'}`}>
              {storeOpen ? 'Open' : 'Closed'}
            </div>
          </div>

          <div className="hero-img-ring">
            <BbImage src={logoUrl} alt={`${siteName} logo`} className="hero-logo-img" />
          </div>
          <h1 className="hero-title">{siteName}</h1>
          <p className="hero-sub">
            Fresh baked · <strong>{heroLocation}</strong>
          </p>

          <div className="trust-badges">
            <span className="trust-badge">🧈 Small-batch</span>
            <span className="trust-badge">⭐ Baked fresh daily</span>
            <span className="trust-badge">🎁 Custom orders</span>
          </div>
        </section>

        {categoryTabs.length > 1 && (
          <div className="cat-nav-wrap">
            <div className="cat-nav" role="tablist" aria-label="Menu categories">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === tab.id}
                  className={`cat-tab${activeCategory === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveCategory(tab.id)}
                >
                  <span className="tab-emoji">{tab.emoji}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="menu-content">
          {productsLoading && (
            <p className="menu-empty-note">Loading menu…</p>
          )}

          {!productsLoading && !hasMenu && (
            <p className="menu-empty-note">
              No products available yet. Check back soon or contact us to order.
            </p>
          )}

          {visibleSections.map((section) => {
            if (section.items.length === 0) return null

            return (
              <div key={section.id} className="menu-section" data-cat={section.id}>
                <div className="menu-section-label">
                  {categoryEmoji(section.id, section.label)} {section.label}
                </div>
                <div className="menu-grid">
                  {section.items.map((item) =>
                    item.kind === 'tin' ? (
                      <TinGroupCard
                        key={item.group.id}
                        group={item.group}
                        qtyFor={qtyFor}
                        onAdd={(product, variantId) => add(product, variantId)}
                        onSetQty={(product, qty, variantId) => setQty(product, qty, variantId)}
                      />
                    ) : (
                      <ProductCard
                        key={item.product.id}
                        product={item.product}
                        qty={qtyFor(item.product.id)}
                        onAdd={() => add(item.product)}
                        onSetQty={(qty) => setQty(item.product, qty)}
                      />
                    ),
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <StoreFooter config={config} contactPhone={contactPhone} />
      </div>

      {mounted ? createPortal(cartChrome, document.body) : null}
    </div>
  )
}
