'use client'
import type { ReactNode } from 'react'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import { fetchProducts, submitLead } from '@/lib/storefront-api'
import { runStorefrontCheckout } from '@/lib/runStorefrontCheckout'
import { validateShippingAddress } from '@/lib/storefrontShippingAddress'
import type { DeliveryDetailsValue } from '@/lib/templateSettings'
import {
  getDeliveryDateOptions,
  getDeliveryTimeSlots,
  getEarliestDeliverySlot,
  getOrderingAvailabilityFromConfig,
  getOrderingHoursFromConfig,
  isStoreOpenNow,
  parseOrderingTime12h,
} from '@/lib/orderingHours'
import { runPreCheckoutGuards } from '@/lib/checkoutGuard'
import type { ThemeTenant } from '@/themes/restaurant/types'
import { BB_IMG_FALLBACK } from './catalog'
import { layoutBrownButterProducts, type TinGroup } from './productLayout'
import { useBrownButterCart } from './useBrownButterCart'
import { SignedInCheckoutNote } from '@/components/CheckoutContactNote'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { formatSavedAddressLine, resolveCheckoutContactForSubmit } from '@/lib/storefrontCustomerContact'
import { useCheckoutCustomerPrefill } from '@/lib/useCheckoutCustomerPrefill'
import { BrownButterFrame } from './BrownButterFrame'
import {
  coerceDeliveryMode,
  getEnabledDeliveryModes,
  type StorefrontDeliveryMode,
} from '@/lib/storefrontDeliveryModes'
import {
  storefrontShippingAmountInr,
  storefrontTaxAmountInr,
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

/** Small line icons for the delivery-slot card (inherit currentColor). */
function BbSlotIcon({ kind }: { kind: 'clock' | 'check' | 'prep' | 'cutoff' | 'note' }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (kind === 'check') return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>
  if (kind === 'prep')
    return (
      <svg {...common}>
        <path d="M6 2h12M6 22h12M7 2v4a5 5 0 0 0 10 0V2M7 22v-4a5 5 0 0 1 10 0v4" />
      </svg>
    )
  if (kind === 'note')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    )
  // clock / cutoff
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" />
      <path d={kind === 'cutoff' ? 'M12 6v6l-4 2' : 'M12 6v6l4 2'} />
    </svg>
  )
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

  const detailHref = `/products/${product.slug}`

  return (
    <div
      className={`product-card${selected ? ' selected' : ''}${selected ? ' show-stepper' : ''}`}
      data-id={product.slug}
    >
      <Link href={detailHref} className="card-media-link" aria-label={`View ${product.name}`}>
        <div className="card-img-wrap">
          <BbImage src={product.imageUrl} alt="" />
          <div className="veg-dot" aria-label="Vegetarian" />
          <div className="check-badge">✓</div>
        </div>
      </Link>
      <div className="card-body">
        <Link href={detailHref} className="card-name-link">
          <div className="card-name">{product.name}</div>
        </Link>
        <div className="card-desc">{product.shortDescription ?? product.description ?? ''}</div>
        <div className="card-bottom">
          <div className="card-price">{formatInr(product.price)}</div>
          {outOfStock ? (
            <span className="sold-out-label">Sold out</span>
          ) : !selected ? (
            <button
              type="button"
              className="add-btn"
              onClick={onAdd}
            >
              + Add
            </button>
          ) : (
            <div className="qty-stepper">
              <button type="button" className="qty-btn" onClick={() => onSetQty(qty - 1)}>
                −
              </button>
              <span className="qty-num">{qty}</span>
              <button type="button" className="qty-btn" onClick={() => onSetQty(qty + 1)}>
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
  const detailHref = group.variants[0]?.slug ? `/products/${group.variants[0].slug}` : null

  return (
    <div className={`tin-card${groupSelected ? ' selected' : ''}`} data-id={group.id}>
      {detailHref ? (
        <Link href={detailHref} className="card-media-link" aria-label={`View ${group.name}`}>
          <div className="card-img-wrap">
            <BbImage src={group.img} alt="" />
            <div className="check-badge">✓</div>
          </div>
        </Link>
      ) : (
        <div className="card-img-wrap">
          <BbImage src={group.img} alt={group.name} />
          <div className="check-badge">✓</div>
        </div>
      )}
      <div className="card-body card-body--compact">
        {detailHref ? (
          <Link href={detailHref} className="card-name-link">
            <div className="card-name">{group.name}</div>
          </Link>
        ) : (
          <div className="card-name">{group.name}</div>
        )}
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
                {v.slug ? (
                  <Link href={`/products/${v.slug}`} className="variant-size-link">
                    {v.sizeLabel}
                  </Link>
                ) : (
                  <span className="variant-size">{v.sizeLabel}</span>
                )}
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


function OpenCartFromQuery({
  hydrated,
  itemCount,
  onOpen,
}: {
  hydrated: boolean
  itemCount: number
  onOpen: () => void
}) {
  const params = useSearchParams()
  useEffect(() => {
    if (!hydrated || params.get('cart') !== 'open') return
    if (itemCount > 0) onOpen()
    const url = new URL(window.location.href)
    url.searchParams.delete('cart')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [hydrated, itemCount, onOpen, params])
  return null
}

export function BrownButterPage({
  tenant,
  config,
  products: initialProducts = [],
  navLinks,
  footerLinks: _footerLinks,
  addonsSlot,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  products?: PublicProduct[]
  navLinks?: { href: string; label: string }[]
  /** Accepted for layout-router parity; store footer is hours/location, not page links. */
  footerLinks?: { href: string; label: string }[]
  /** Paid add-on homepage blocks, rendered above the footer. */
  addonsSlot?: ReactNode
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl || '/private/thebrownbutter/media/logo.jpeg'
  const contactPhone = config?.branding?.contactPhone || config?.branding?.socials?.whatsapp
  const heroLocation =
    config?.branding?.address?.split(',')[0]?.trim() || 'Mira Road, Mumbai'

  const orderingHours = useMemo(() => getOrderingHoursFromConfig(config), [config])
  const orderingAvailability = useMemo(() => getOrderingAvailabilityFromConfig(config), [config])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  // Re-evaluated every minute so prep time / same-day cutoff stay current while the sheet is open.
  const [nowTick, setNowTick] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  const storeOpen = useMemo(
    () => isStoreOpenNow(orderingHours, new Date(nowTick), orderingAvailability),
    [orderingHours, orderingAvailability, nowTick],
  )
  const earliestSlot = useMemo(
    () => getEarliestDeliverySlot(orderingHours, orderingAvailability, new Date(nowTick)),
    [orderingHours, orderingAvailability, nowTick],
  )
  // Every upcoming day is listed; closed / holiday / past-cutoff / full days are disabled.
  const deliveryDateOptions = useMemo(
    () => getDeliveryDateOptions(orderingHours, orderingAvailability, new Date(nowTick), { days: 14 }),
    [orderingHours, orderingAvailability, nowTick],
  )
  const deliveryTimeSlots = useMemo(
    () => getDeliveryTimeSlots(orderingHours, deliveryDate, new Date(nowTick), orderingAvailability),
    [orderingHours, orderingAvailability, deliveryDate, nowTick],
  )
  // Drop a pick that stopped being bookable (e.g. the clock passed the cutoff while the sheet was open).
  useEffect(() => {
    if (deliveryDate && !deliveryDateOptions.some((d) => d.dateStr === deliveryDate && d.available)) {
      setDeliveryDate('')
      setDeliveryTime('')
    } else if (deliveryTime && !deliveryTimeSlots.some((s) => s.value === deliveryTime && s.available)) {
      setDeliveryTime('')
    }
  }, [deliveryDate, deliveryTime, deliveryDateOptions, deliveryTimeSlots])
  // Start on the earliest bookable day (customers can still change it).
  useEffect(() => {
    if (!deliveryDate && earliestSlot) setDeliveryDate(earliestSlot.dateStr)
  }, [deliveryDate, earliestSlot])
  const schedulingRules = useMemo(() => {
    const rules: Array<{ key: string; icon: 'prep' | 'cutoff' | 'note'; title: string; text: string }> = []
    if (orderingAvailability.leadTimeMinutes) {
      const m = orderingAvailability.leadTimeMinutes
      const label =
        m >= 60 && m % 60 === 0 ? `${m / 60} hr${m === 60 ? '' : 's'}` : m > 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`
      rules.push({ key: 'prep', icon: 'prep', title: `${label} prep`, text: 'Every order is made fresh for you' })
    }
    const cutoff = orderingAvailability.sameDayCutoffTime
    if (cutoff && parseOrderingTime12h(cutoff) !== null) {
      rules.push({ key: 'cutoff', icon: 'cutoff', title: `Same-day till ${cutoff}`, text: 'Later orders go to the next day' })
    }
    if (orderingAvailability.slotsNote) {
      rules.push({ key: 'note', icon: 'note', title: 'Note', text: orderingAvailability.slotsNote })
    }
    return rules
  }, [orderingAvailability])
  const earliestSelected =
    Boolean(earliestSlot) && deliveryDate === earliestSlot?.dateStr && deliveryTime === earliestSlot?.slot.value
  const pickEarliestSlot = () => {
    if (!earliestSlot) return
    setDeliveryDate(earliestSlot.dateStr)
    setDeliveryTime(earliestSlot.slot.value)
  }

  const { entries, itemCount, subtotal, add, setQty, qtyFor, clear, hydrated } = useBrownButterCart(tenant.id)
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
  const [confirmClear, setConfirmClear] = useState(false)

  // Never reopen the drawer with a half-finished "Clear cart?" prompt.
  useEffect(() => {
    if (!sheetOpen) setConfirmClear(false)
  }, [sheetOpen])

  const [delivery, setDelivery] = useState<DeliveryMode>('pickup')
  const [pincode, setPincode] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [birthday, setBirthday] = useState('')
  const [mounted, setMounted] = useState(false)

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

  // Tax only when the store charges it on top (prices exclude tax) — matches the server charge.
  const taxInr = storefrontTaxAmountInr(subtotal, config)
  const total = subtotal + deliveryFee + taxInr
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
    // Pause, closed days, ordering hours, preparation time and same-day cutoff (IST).
    const slotGuard = runPreCheckoutGuards(
      config,
      { preferredDate: deliveryDate.trim(), preferredTime: deliveryTime.trim() },
      { requireDate: true, requireTime: true, requireAddress: false },
    )
    if (!slotGuard.ok) {
      setCheckoutError(slotGuard.message)
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
            <div className="sheet-header__actions">
              {entries.length > 0 ? (
                confirmClear ? (
                  <span className="sheet-clear-confirm" role="group" aria-label="Confirm clear cart">
                    <button
                      type="button"
                      className="sheet-clear sheet-clear--danger"
                      onClick={() => {
                        clear()
                        setConfirmClear(false)
                        setSheetOpen(false)
                      }}
                    >
                      Clear cart?
                    </button>
                    <button type="button" className="sheet-clear" onClick={() => setConfirmClear(false)}>
                      Keep
                    </button>
                  </span>
                ) : (
                  <button type="button" className="sheet-clear" onClick={() => setConfirmClear(true)}>
                    Clear
                  </button>
                )
              ) : null}
              <button type="button" className="sheet-close" aria-label="Close checkout" onClick={() => setSheetOpen(false)}>×</button>
            </div>
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
                  <select
                    id="bb-date"
                    className="bb-slot-select"
                    value={deliveryDate}
                    onChange={(e) => {
                      setDeliveryDate(e.target.value)
                      setDeliveryTime('')
                    }}
                  >
                    <option value="" disabled>
                      Select date
                    </option>
                    {deliveryDateOptions.map((d) => (
                      <option key={d.dateStr} value={d.dateStr} disabled={!d.available}>
                        {d.available ? d.label : `${d.label} · ${d.note}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="bb-time">Preferred Time</label>
                  <select
                    id="bb-time"
                    className="bb-slot-select"
                    disabled={!deliveryDate || !deliveryTimeSlots.some((s) => s.available)}
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  >
                    <option value="" disabled>
                      {deliveryDate ? 'Select time' : 'Pick a date first'}
                    </option>
                    {deliveryTimeSlots.map((s) => (
                      <option key={s.value} value={s.value} disabled={!s.available}>
                        {s.available ? s.label : `${s.label} · ${s.tag}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {deliveryDate && !deliveryTimeSlots.some((s) => s.available) ? (
                <p className="bb-slot-warn" role="status">
                  No slots left on this day — please pick another date.
                </p>
              ) : null}

              <div className={`bb-slot-card${earliestSelected ? ' is-selected' : ''}`} aria-live="polite">
                {earliestSlot ? (
                  <div className="bb-slot-card__main">
                    <span className="bb-slot-card__icon" aria-hidden>
                      <BbSlotIcon kind="clock" />
                    </span>
                    <div className="bb-slot-card__text">
                      <span className="bb-slot-card__eyebrow">Earliest available</span>
                      <span className="bb-slot-card__value">
                        <strong>{earliestSlot.dayLabel}</strong> · {earliestSlot.slot.label}
                      </span>
                    </div>
                    {earliestSelected ? (
                      <span className="bb-slot-card__done">
                        <BbSlotIcon kind="check" /> Selected
                      </span>
                    ) : (
                      <button type="button" className="bb-slot-card__cta" onClick={pickEarliestSlot}>
                        Use this slot
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bb-slot-card__main">
                    <span className="bb-slot-card__icon bb-slot-card__icon--muted" aria-hidden>
                      <BbSlotIcon kind="clock" />
                    </span>
                    <div className="bb-slot-card__text">
                      <span className="bb-slot-card__eyebrow">No slots right now</span>
                      <span className="bb-slot-card__value">Please check back a little later.</span>
                    </div>
                  </div>
                )}
                {schedulingRules.length > 0 ? (
                  <ul className="bb-slot-card__rules">
                    {schedulingRules.map((r) => (
                      <li key={r.key}>
                        <BbSlotIcon kind={r.icon} />
                        <span>
                          <strong>{r.title}</strong> — {r.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
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
              {taxInr > 0 && (
                <div className="cart-row shipping">
                  <span>Taxes</span>
                  <span>{formatInr(taxInr)}</span>
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
    <>
      <Suspense fallback={null}>
        <OpenCartFromQuery hydrated={hydrated} itemCount={itemCount} onOpen={openSheet} />
      </Suspense>
      <BrownButterFrame
        config={config}
        navLinks={navLinks}
        headerTitle={siteName}
        contactPhone={contactPhone}
        layout="wide"
      >
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

        {addonsSlot}
      </BrownButterFrame>

      {mounted ? createPortal(cartChrome, document.body) : null}
    </>
  )
}
