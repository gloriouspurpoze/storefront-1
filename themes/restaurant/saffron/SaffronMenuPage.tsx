'use client'

import type { ReactNode } from 'react'
import { Fragment, useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { PublicMenuCategory, PublicMenuItem, StorefrontConfig } from '@/lib/storefront-api'
import { isMenuItemInStock } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { SaffronHeader } from './SaffronHeader'
import { SaffronHero } from './SaffronHero'
import { SaffronFooter } from './SaffronFooter'
import { homepageSectionOrder, THEME_SECTIONS } from '@/lib/storefrontSections'
import { StorefrontMenuDrawer } from '@/components/StorefrontMenuDrawer'
import { MenuOrderCheckoutBlock } from '../MenuOrderCheckoutBlock'
import { DeliveryDetailsSection } from '@/components/DeliveryDetailsSection'
import { ProductVariantSelector } from '@/components/ProductVariantSelector'
import { MenuItemDetailModal } from '@/components/MenuItemDetailModal'
import {
  formatDeliveryNotes,
  showPreferredDateOfDelivery,
  type DeliveryDetailsValue,
} from '@/lib/templateSettings'
import {
  cartLineKey,
  formatListPrice,
  getDefaultVariant,
  getEffectivePrice,
  productHasVariants,
} from '@/lib/productVariants'
import {
  formatMenuPrice,
  menuCartLineLabel,
  useMenuCart,
  type CartEntry,
} from '../menufast/useMenuCart'
import {
  coerceDeliveryMode,
  getEnabledRestaurantDeliveryModes,
} from '@/lib/storefrontDeliveryModes'
import { storefrontCheckoutTotals } from '@/lib/storefrontCheckoutPricing'
import { IconBag, IconCheck, IconClose, IconMinus, IconPlus, IconSearch, QuantityStepper } from '@/ui'
import '@/components/commerce/menu-board.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryMode = 'delivery' | 'pickup'

interface BadgeStyle {
  bg: string
  color: string
  label: string
}

const SAFFRON_SECTIONS = THEME_SECTIONS.saffron

const DIETARY_BADGES: Record<string, BadgeStyle> = {
  veg: { bg: '#E8F5E9', color: '#2E7D32', label: 'Veg' },
  vegan: { bg: '#E8F5E9', color: '#1B5E20', label: 'Vegan' },
  spicy: { bg: '#FFF3E0', color: '#E65100', label: 'Spicy' },
  popular: { bg: '#F0DDD4', color: '#9B4A27', label: 'Popular' },
  new: { bg: '#EDE7F6', color: '#4527A0', label: 'New' },
  'gluten-free': { bg: '#F3E5F5', color: '#6A1B9A', label: 'GF' },
  halal: { bg: '#E3F2FD', color: '#1565C0', label: 'Halal' },
}

function getBadgeStyle(tag: string): BadgeStyle {
  return DIETARY_BADGES[tag.toLowerCase()] ?? { bg: '#F5F5F5', color: '#424242', label: tag }
}

// ─── Menu Item Card ───────────────────────────────────────────────────────────

function MenuItemCard({
  item,
  qty,
  selectedVariantId,
  onVariantSelect,
  onAdd,
  onRemove,
  onOpenDetail,
}: {
  item: PublicMenuItem
  qty: number
  selectedVariantId?: string
  onVariantSelect: (variantId: string) => void
  onAdd: () => void
  onRemove: () => void
  onOpenDetail?: () => void
}) {
  const currency = item.currency ?? 'INR'
  const badges = item.dietary ?? []
  const hasVariants = productHasVariants(item)
  const inStock = isMenuItemInStock(item)
  const priceLabel = hasVariants
    ? selectedVariantId
      ? formatMenuPrice(getEffectivePrice(item, selectedVariantId), currency)
      : formatListPrice(item, (amount) => formatMenuPrice(amount, currency))
    : formatMenuPrice(item.price, currency)

  // Shared dish-card styles (components/commerce/menu-board.css), skinned by Saffron tokens.
  return (
    <div className="sf-dish saffron-dish" data-soldout={!inStock || undefined}>
      {onOpenDetail ? (
        <button type="button" className="sf-dish__open" onClick={onOpenDetail}>
          <span className="sf-visually-hidden">View {item.name}</span>
        </button>
      ) : null}
      <div className="sf-dish__body">
        {badges.length > 0 && (
          <div className="sf-dish__tags">
            {badges.map((tag) => {
              const bs = getBadgeStyle(tag)
              return (
                <span key={tag} className="saffron-diet-tag" style={{ background: bs.bg, color: bs.color }}>
                  {bs.label}
                </span>
              )
            })}
          </div>
        )}
        <div className="sf-dish__title-row">
          <h3 className="sf-dish__name">{item.name}</h3>
          {!inStock && <span className="saffron-oos-tag">Out of stock</span>}
        </div>
        <p className="sf-dish__price">{priceLabel}</p>
        {item.description && <p className="sf-dish__desc">{item.description}</p>}
        {hasVariants && item.variants && (
          <div className="saffron-dish__variants">
            <ProductVariantSelector
              variants={item.variants}
              selectedId={selectedVariantId}
              onSelect={onVariantSelect}
              label="Size"
              tone="saffron"
            />
          </div>
        )}
      </div>

      <div className="sf-dish__media">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
        ) : null}
        <div className="sf-dish__cta">
          {!inStock ? (
            <span className="sf-dish__soldout">Sold out</span>
          ) : hasVariants && !selectedVariantId ? (
            <button type="button" className="sf-dish__add" onClick={onOpenDetail}>
              Options <IconPlus size={14} />
            </button>
          ) : qty === 0 ? (
            <button type="button" className="sf-dish__add" onClick={onAdd}>
              Add <IconPlus size={14} />
            </button>
          ) : (
            <QuantityStepper
              size="sm"
              min={0}
              value={qty}
              label={`Quantity of ${item.name}`}
              className="sf-dish__qty"
              onChange={(next) => (next > qty ? onAdd() : onRemove())}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Cart Content ─────────────────────────────────────────────────────────────

interface CartContentProps {
  cartEntries: CartEntry[]
  subtotal: number
  deliveryFee: number
  tax: number
  discount: number
  total: number
  deliveryMode: DeliveryMode
  enabledDeliveryModes: DeliveryMode[]
  promoCode: string
  promoApplied: boolean
  instructions: string
  showPreferredDate: boolean
  deliveryDetails: DeliveryDetailsValue
  onDeliveryDetailsChange: (val: DeliveryDetailsValue) => void
  onAdd: (item: PublicMenuItem, variantId?: string) => void
  onRemove: (itemId: string, variantId?: string) => void
  onClear: () => void
  onPromoChange: (val: string) => void
  onApplyPromo: () => void
  onDeliveryModeChange: (mode: DeliveryMode) => void
  onInstructionsChange: (val: string) => void
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  onOrderSuccess: (orderNumber: string) => void
}

function CartContent({
  cartEntries,
  subtotal,
  deliveryFee,
  tax,
  discount,
  total,
  deliveryMode,
  enabledDeliveryModes,
  promoCode,
  promoApplied,
  instructions,
  showPreferredDate,
  deliveryDetails,
  onDeliveryDetailsChange,
  onAdd,
  onRemove,
  onClear,
  onPromoChange,
  onApplyPromo,
  onDeliveryModeChange,
  onInstructionsChange,
  tenant,
  config,
  onOrderSuccess,
}: CartContentProps) {
  const isEmpty = cartEntries.length === 0
  const itemCount = cartEntries.reduce((s, e) => s + e.quantity, 0)
  const currency = cartEntries[0]?.item.currency ?? 'INR'

  return (
    <>
      {/* Cart header */}
      <div
        style={{
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
              fontSize: '18px',
              fontWeight: 500,
            }}
          >
            Your Order
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted, #8A847C)', marginTop: '2px' }}>
            {isEmpty
              ? 'Nothing added yet'
              : `${itemCount} item${itemCount !== 1 ? 's' : ''} · ${formatMenuPrice(subtotal, currency)}`}
          </div>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={onClear}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              color: 'var(--ink-muted, #8A847C)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Cart body (scrolls) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
        {/* Delivery / pickup toggle */}
        {enabledDeliveryModes.length > 1 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${enabledDeliveryModes.length}, 1fr)`,
            gap: '4px',
            background: 'var(--cream-dark, #F0EDE4)',
            borderRadius: 'var(--saf-radius-sm, 6px)',
            padding: '4px',
            marginBottom: '1.25rem',
          }}
        >
          {enabledDeliveryModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onDeliveryModeChange(mode)}
              style={{
                padding: '8px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                background: deliveryMode === mode ? 'white' : 'transparent',
                color:
                  deliveryMode === mode
                    ? 'var(--ink, #1A1714)'
                    : 'var(--ink-muted, #8A847C)',
                boxShadow: deliveryMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {mode === 'delivery' ? 'Delivery' : 'Pickup'}
            </button>
          ))}
        </div>
        ) : (
          <div
            style={{
              marginBottom: '1.25rem',
              fontSize: '13px',
              color: 'var(--ink-muted, #8A847C)',
            }}
          >
            {deliveryMode === 'delivery' ? 'Delivery' : 'Pickup'}
          </div>
        )}

        {/* Delivery details */}
        {(deliveryMode === 'delivery' || showPreferredDate) && (
          <DeliveryDetailsSection
            showPreferredDate={showPreferredDate}
            showAddressFields={deliveryMode === 'delivery'}
            value={deliveryDetails}
            onChange={onDeliveryDetailsChange}
            variant="card"
          />
        )}

        {/* Empty state */}
        {isEmpty ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'var(--ink-muted, #8A847C)',
            }}
          >
            <div style={{ marginBottom: '12px', color: 'var(--ink-muted, #8A847C)' }}><IconBag size={40} /></div>
            <p style={{ fontSize: '14px' }}>
              Your cart is empty.
              <br />
              Add items from the menu!
            </p>
          </div>
        ) : (
          <>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1rem' }}
            >
              {cartEntries.map(({ item, quantity, variantId }) => {
                const lineName = menuCartLineLabel(item, variantId)
                const unitPrice = getEffectivePrice(item, variantId)
                return (
                <div
                  key={cartLineKey(item.id, variantId)}
                  style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--saf-radius-sm, 6px)',
                      background: 'var(--cream-dark, #F0EDE4)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      overflow: 'hidden',
                    }}
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <IconBag size={20} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}
                    >
                      {lineName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        aria-label={`Decrease ${menuCartLineLabel(item, variantId)}`}
                        onClick={() => onRemove(item.id, variantId)}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: '1px solid var(--saf-border-strong, rgba(26,23,20,0.2))',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--ink, #1A1714)',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}
                      >
                        <IconMinus size={14} />
                      </button>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          minWidth: '16px',
                          textAlign: 'center',
                        }}
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${menuCartLineLabel(item, variantId)}`}
                        onClick={() => onAdd(item, variantId)}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: '1px solid var(--saf-border-strong, rgba(26,23,20,0.2))',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--ink, #1A1714)',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}
                      >
                        <IconPlus size={14} />
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--ink, #1A1714)',
                      flexShrink: 0,
                    }}
                  >
                    {formatMenuPrice(unitPrice * quantity, currency)}
                  </div>
                </div>
                )
              })}
            </div>

            {/* Cooking instructions */}
            <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--ink-muted, #8A847C)',
                  marginBottom: '6px',
                }}
              >
                Cooking instructions{' '}
                <span style={{ fontWeight: 400 }}>(optional)</span>
              </div>
              <textarea
                value={instructions}
                onChange={(e) => onInstructionsChange(e.target.value)}
                placeholder="e.g. Less spicy, no onions, extra sauce..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
                  borderRadius: 'var(--saf-radius-sm, 6px)',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  color: 'var(--ink, #1A1714)',
                  background: 'var(--cream, #FAF8F3)',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Cart footer */}
      <div
        style={{
          borderTop: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
          padding: '1.25rem 1.5rem',
          background: 'var(--cream, #FAF8F3)',
          flexShrink: 0,
        }}
      >
        {/* Bill summary */}
        {!isEmpty && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}
          >
            <BillRow label="Item total" value={formatMenuPrice(subtotal, currency)} />
            <BillRow
              label="Delivery fee"
              value={deliveryFee === 0 ? 'Free' : formatMenuPrice(deliveryFee, currency)}
            />
            {tax > 0 ? <BillRow label="Taxes" value={formatMenuPrice(tax, currency)} /> : null}
            {promoApplied && (
              <BillRow
                label="Promo discount"
                value={`-${formatMenuPrice(discount, currency)}`}
                accent
              />
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--ink, #1A1714)',
                paddingTop: '8px',
                borderTop: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
                marginTop: '4px',
              }}
            >
              <span>Total</span>
              <span>{formatMenuPrice(total, currency)}</span>
            </div>
          </div>
        )}

        {/* Checkout */}
        {!isEmpty && (
          <MenuOrderCheckoutBlock
            tenant={tenant}
            config={config}
            lines={cartEntries.map((e) => ({
              productId: e.item.id,
              quantity: e.quantity,
              variantId: e.variantId,
            }))}
            notes={formatDeliveryNotes(deliveryDetails, instructions.trim() || undefined)}
            showPreferredDate={false}
            showDeliveryDetails={false}
            deliveryDetails={deliveryMode === 'delivery' ? deliveryDetails : undefined}
            onDeliveryDetailsChange={onDeliveryDetailsChange}
            fulfillmentMode={deliveryMode}
            onClear={onClear}
            onSuccess={onOrderSuccess}
            primaryLabel={`Pay & place order · ${formatMenuPrice(total, currency)}`}
          />
        )}
      </div>
    </>
  )
}

function BillRow({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px',
        color: accent ? 'var(--sage, #6B7B5E)' : 'var(--ink-muted, #8A847C)',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SaffronMenuPage({
  initialCategories,
  tenant,
  config,
  navLinks,
  footerLinks,
  addonsSlot,
}: {
  initialCategories: PublicMenuCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: { href: string; label: string }[]
  footerLinks?: { href: string; label: string }[]
  /** Paid add-on homepage blocks, rendered above the footer. */
  addonsSlot?: ReactNode
}) {
  const { entries, itemCount, subtotal, addItem, removeItem, clearCart, qtyFor } =
    useMenuCart(initialCategories)
  const [variantSelection, setVariantSelection] = useState<Record<string, string>>({})
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [modalVariantId, setModalVariantId] = useState<string | undefined>()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('delivery')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [placedOrderNumber, setPlacedOrderNumber] = useState('')
  const [instructions, setInstructions] = useState('')
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue>({})

  const enabledDeliveryModes = useMemo(
    () => getEnabledRestaurantDeliveryModes(config),
    [config],
  )

  useEffect(() => {
    setDeliveryMode((prev) => coerceDeliveryMode(prev, enabledDeliveryModes, 'pickup'))
  }, [enabledDeliveryModes])

  const showPreferredDate = showPreferredDateOfDelivery(config, config?.themeKey ?? 'saffron')

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  const allItems = useMemo(
    () => initialCategories.flatMap((cat) => cat.items),
    [initialCategories],
  )

  const selectedItem =
    selectedItemId != null ? allItems.find((i) => i.id === selectedItemId) ?? null : null

  const getSelectedVariantId = useCallback(
    (item: PublicMenuItem) =>
      variantSelection[item.id] ?? getDefaultVariant(item)?.id ?? undefined,
    [variantSelection],
  )

  const setItemVariant = useCallback((itemId: string, variantId: string) => {
    setVariantSelection((prev) => ({ ...prev, [itemId]: variantId }))
  }, [])

  const addToCart = useCallback(
    (item: PublicMenuItem, variantId?: string) => {
      const resolvedVariantId = productHasVariants(item)
        ? variantId ?? getSelectedVariantId(item)
        : undefined
      if (!isMenuItemInStock(item)) return
      addItem(item, resolvedVariantId)
      const variant = item.variants?.find((v) => v.id === resolvedVariantId)
      const label = variant ? `${item.name} — ${variant.name}` : item.name
      showToast(`${label} added to cart`)
    },
    [addItem, getSelectedVariantId, showToast],
  )

  const removeFromCart = useCallback(
    (itemId: string, variantId?: string) => {
      removeItem(itemId, variantId)
    },
    [removeItem],
  )

  const handleClearCart = useCallback(() => {
    clearCart()
    setPromoApplied(false)
    setPromoCode('')
  }, [clearCart])

  const applyPromo = useCallback(() => {
    const val = promoCode.trim().toUpperCase()
    if (['FIRST50', 'SAVE10'].includes(val)) {
      setPromoApplied(true)
      showToast('Promo applied! 10% off')
    } else if (!val) {
      showToast('Enter a promo code')
    } else {
      showToast('Invalid promo code')
    }
  }, [promoCode, showToast])

  const cartEntries = entries

  const totalCartCount = itemCount

  const currency = cartEntries[0]?.item.currency ?? 'INR'
  // Same math as the server charge (tenant fees + tax settings). No client-only discounts:
  // there is no coupon API, so a UI discount would show less than Razorpay / COD collects.
  const {
    shippingInr: deliveryFee,
    taxInr: tax,
    totalInr: total,
  } = storefrontCheckoutTotals(deliveryMode, subtotal, config)
  const discount = 0

  // Filtered categories for display
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return initialCategories
      .map((cat) => {
        let items = cat.items
        if (activeCategory !== 'all' && cat.id !== activeCategory) return null
        if (q) {
          items = items.filter(
            (item) =>
              item.name.toLowerCase().includes(q) ||
              (item.description ?? '').toLowerCase().includes(q),
          )
        }
        if (items.length === 0) return null
        return { ...cat, items }
      })
      .filter((c): c is PublicMenuCategory => c !== null)
  }, [initialCategories, activeCategory, searchQuery])

  const cartProps: CartContentProps = {
    cartEntries,
    subtotal,
    deliveryFee,
    tax,
    discount,
    total,
    deliveryMode,
    enabledDeliveryModes,
    promoCode,
    promoApplied,
    instructions,
    showPreferredDate,
    deliveryDetails,
    onDeliveryDetailsChange: setDeliveryDetails,
    onAdd: addToCart,
    onRemove: removeFromCart,
    onClear: handleClearCart,
    onPromoChange: setPromoCode,
    onApplyPromo: applyPromo,
    onDeliveryModeChange: setDeliveryMode,
    onInstructionsChange: setInstructions,
    tenant,
    config,
    onOrderSuccess: (orderNumber) => {
      setPlacedOrderNumber(orderNumber)
      setOrderPlaced(true)
      handleClearCart()
    },
  }

  // No hardcoded promos: offers shown here must be ones checkout actually honours.
  const offers: string[] = []

  const blocks: Record<(typeof SAFFRON_SECTIONS)[number], ReactNode> = {
    // Dark hero banner (offers strip is embedded in the hero)
    hero: <SaffronHero tenant={tenant} config={config} offers={offers} />,
    // Two-column layout: menu + cart — one unit (category tabs, search, item grid, desktop cart)
    menu: (
      <div
        className="saffron-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 380px',
          alignItems: 'start',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* ── Menu Panel (left, independently scrollable) ── */}
        <div
          style={{
            borderRight: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 64px)',
            position: 'sticky',
            top: '64px',
            paddingBottom: '4rem',
          }}
        >
          {/* Category tabs */}
          <div
            style={{
              padding: '1.25rem 2rem',
              borderBottom: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              position: 'sticky',
              top: 0,
              background: 'var(--cream, #FAF8F3)',
              zIndex: 10,
            }}
          >
            {[
              { id: 'all', name: 'All' },
              ...initialCategories.map((cat) => ({ id: cat.id, name: cat.name })),
            ].map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setSearchQuery('')
                }}
                style={{
                  padding: '7px 18px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: `1px solid ${
                    activeCategory === cat.id
                      ? 'var(--ink, #1A1714)'
                      : 'var(--saf-border-strong, rgba(26,23,20,0.2))'
                  }`,
                  background:
                    activeCategory === cat.id ? 'var(--ink, #1A1714)' : 'transparent',
                  color:
                    activeCategory === cat.id
                      ? 'var(--cream, #FAF8F3)'
                      : 'var(--ink-soft, #4A4540)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div
            style={{
              padding: '1rem 2rem',
              borderBottom: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
            }}
          >
            <div style={{ position: 'relative' }}>
              <svg
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-muted, #8A847C)',
                  pointerEvents: 'none',
                }}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  border: '1px solid var(--saf-border-strong, rgba(26,23,20,0.2))',
                  borderRadius: 'var(--saf-radius-sm, 6px)',
                  background: 'white',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  color: 'var(--ink, #1A1714)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
          </div>

          {/* Menu sections */}
          {filteredCategories.length === 0 ? (
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--ink-muted, #8A847C)',
              }}
            >
              <div style={{ marginBottom: '12px' }}><IconSearch size={32} /></div>
              <p>No dishes found. Try a different search.</p>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.id} id={`section-${cat.id}`}>
                {/* Section heading with rule */}
                <div
                  style={{
                    padding: '1.5rem 2rem 0.75rem',
                    fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
                    fontSize: '20px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {cat.name}
                  <span
                    aria-hidden
                    style={{
                      flex: 1,
                      height: '1px',
                      background: 'var(--saf-border, rgba(26,23,20,0.1))',
                    }}
                  />
                </div>

                {/* Items */}
                <div className="saffron-dish-list">
                  {cat.items.map((item) => {
                    const selectedVariantId = getSelectedVariantId(item)
                    return (
                    <div key={item.id}>
                      <MenuItemCard
                        item={item}
                        selectedVariantId={selectedVariantId}
                        onVariantSelect={(variantId) => setItemVariant(item.id, variantId)}
                        qty={qtyFor(item.id, selectedVariantId)}
                        onAdd={() => addToCart(item, selectedVariantId)}
                        onRemove={() => removeFromCart(item.id, selectedVariantId)}
                        onOpenDetail={
                          productHasVariants(item)
                            ? () => {
                                setSelectedItemId(item.id)
                                setModalVariantId(getSelectedVariantId(item))
                              }
                            : undefined
                        }
                      />
                    </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Cart Panel (right, desktop only) ── */}
        <div
          className="saffron-cart-desktop"
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 64px)',
            position: 'sticky',
            top: '64px',
            overflowY: 'hidden',
          }}
        >
          <CartContent {...cartProps} />
        </div>
      </div>
    ),
  }

  return (
    <div
      style={{
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
        background: 'var(--cream, #FAF8F3)',
        color: 'var(--ink, #1A1714)',
        minHeight: '100vh',
        fontSize: '15px',
        lineHeight: '1.6',
      }}
    >
      <StorefrontMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        config={config}
        showShippingPolicy={false}
        navLinks={navLinks}
      />
      <MenuItemDetailModal
        item={selectedItem}
        open={selectedItem != null}
        tone="saffron"
        onClose={() => {
          setSelectedItemId(null)
          setModalVariantId(undefined)
        }}
        quantity={selectedItem ? qtyFor(selectedItem.id, modalVariantId) : 0}
        onAdd={(variantId) => {
          if (selectedItem) {
            setModalVariantId(variantId)
            if (variantId) setItemVariant(selectedItem.id, variantId)
            addToCart(selectedItem, variantId)
          }
        }}
        onRemove={(variantId) => {
          if (selectedItem) {
            setModalVariantId(variantId)
            removeFromCart(selectedItem.id, variantId)
          }
        }}
      />
      {/* Sticky header with live cart count */}
      <SaffronHeader
        tenant={tenant}
        config={config}
        cartCount={totalCartCount}
        onCartClick={() => setMobileCartOpen(true)}
        onMenuOpen={() => setMenuOpen(true)}
      />

      {homepageSectionOrder(config, SAFFRON_SECTIONS).map((type) => (
        <Fragment key={type}>{blocks[type as keyof typeof blocks]}</Fragment>
      ))}

      {/* ── Mobile floating cart button ── */}
      <div className="saffron-mobile-fab">
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          style={{
            width: '100%',
            padding: '16px',
            background: 'var(--terracotta, #C4633A)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--saf-radius, 12px)',
            fontSize: '15px',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(196,99,58,0.35)',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {totalCartCount === 0
            ? 'View Cart'
            : `View Cart · ${totalCartCount} item${totalCartCount !== 1 ? 's' : ''}`}
          {totalCartCount > 0 && (
            <span
              style={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '100px',
                padding: '2px 8px',
                fontSize: '13px',
              }}
            >
              {formatMenuPrice(total, currency)}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile cart bottom sheet ── */}
      {mobileCartOpen && (
        <div
          className="saffron-mobile-drawer"
          role="dialog"
          aria-modal
          aria-label="Your cart"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(26,23,20,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileCartOpen(false)
          }}
        >
          <div
            style={{
              background: 'var(--cream, #FAF8F3)',
              width: '100%',
              maxHeight: '90vh',
              borderRadius: '20px 20px 0 0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Drawer drag handle + close */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
                  fontSize: '18px',
                  fontWeight: 500,
                }}
              >
                Your Cart
              </span>
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                aria-label="Close cart"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--ink-muted, #8A847C)',
                  padding: '4px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconClose size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <CartContent {...cartProps} />
            </div>
          </div>
        </div>
      )}

      {addonsSlot}

      <SaffronFooter tenant={tenant} config={config} footerLinks={footerLinks} />

      {/* ── Toast notification ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--ink, #1A1714)',
            color: 'var(--cream, #FAF8F3)',
            padding: '12px 20px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
            fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(26,23,20,0.25)',
          }}
        >
          {toast}
        </div>
      )}

      {/* ── Order placed success overlay ── */}
      {orderPlaced && (
        <div
          role="alertdialog"
          aria-modal
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26,23,20,0.6)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOrderPlaced(false)
              handleClearCart()
              setMobileCartOpen(false)
            }
          }}
        >
          <div
            style={{
              background: 'var(--cream, #FAF8F3)',
              borderRadius: '20px',
              padding: '2.5rem',
              textAlign: 'center',
              maxWidth: '340px',
              width: '90%',
              animation: 'saffron-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <div style={{ marginBottom: '1rem', color: 'var(--sage, #6B7B5E)' }}><IconCheck size={52} /></div>
            <div
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
                fontSize: '24px',
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              Order Placed!
            </div>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--ink-muted, #8A847C)',
                marginBottom: '1.5rem',
              }}
            >
              {placedOrderNumber
                ? `Order ${placedOrderNumber} is confirmed. We emailed your receipt.`
                : 'Your order is confirmed. We emailed your receipt.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setOrderPlaced(false)
                handleClearCart()
                setMobileCartOpen(false)
              }}
              style={{
                padding: '12px 28px',
                background: 'var(--ink, #1A1714)',
                color: 'var(--cream, #FAF8F3)',
                border: 'none',
                borderRadius: '100px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Responsive + animation styles scoped to saffron */}
      <style>{`
        @keyframes saffron-pop {
          from { transform: scale(0.8); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @media (max-width: 900px) {
          .saffron-layout {
            grid-template-columns: 1fr !important;
          }
          .saffron-cart-desktop {
            display: none !important;
          }
          .saffron-mobile-fab {
            display: block;
            position: fixed;
            bottom: 1rem;
            left: 1rem;
            right: 1rem;
            z-index: 50;
          }
          .saffron-hero {
            grid-template-columns: 1fr !important;
          }
          .saffron-hero-offers {
            align-items: flex-start !important;
            flex-direction: row !important;
          }
        }
        @media (min-width: 901px) {
          .saffron-mobile-fab {
            display: none !important;
          }
          .saffron-mobile-drawer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
