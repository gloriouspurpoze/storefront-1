'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { PublicMenuCategory, PublicMenuItem, StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { SaffronHeader } from './SaffronHeader'
import { SaffronHero } from './SaffronHero'
import { SaffronFooter } from './SaffronFooter'

// ─── Types ────────────────────────────────────────────────────────────────────

type CartMap = Record<string, number>
type DeliveryMode = 'delivery' | 'pickup'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency = 'INR'): string {
  return currency === 'INR' ? `₹${price.toLocaleString('en-IN')}` : `${currency} ${price}`
}

interface BadgeStyle {
  bg: string
  color: string
  label: string
}

const DIETARY_BADGES: Record<string, BadgeStyle> = {
  veg: { bg: '#E8F5E9', color: '#2E7D32', label: 'Veg' },
  vegan: { bg: '#E8F5E9', color: '#1B5E20', label: 'Vegan' },
  spicy: { bg: '#FFF3E0', color: '#E65100', label: '🌶 Spicy' },
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
  onAdd,
  onRemove,
}: {
  item: PublicMenuItem
  qty: number
  onAdd: () => void
  onRemove: () => void
}) {
  const currency = item.currency ?? 'INR'
  const badges = item.dietary ?? []

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 100px',
        gap: '1rem',
        padding: '1.25rem 0',
        alignItems: 'start',
      }}
    >
      {/* Info */}
      <div>
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
            {badges.map((tag) => {
              const bs = getBadgeStyle(tag)
              return (
                <span
                  key={tag}
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: '3px',
                    background: bs.bg,
                    color: bs.color,
                  }}
                >
                  {bs.label}
                </span>
              )
            })}
          </div>
        )}
        <div
          style={{
            fontWeight: 500,
            fontSize: '15px',
            marginBottom: '4px',
            color: 'var(--ink, #1A1714)',
          }}
        >
          {item.name}
        </div>
        {item.description && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--ink-muted, #8A847C)',
              lineHeight: 1.5,
              marginBottom: '8px',
            }}
          >
            {item.description}
          </div>
        )}
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink, #1A1714)' }}>
          {formatPrice(item.price, currency)}
        </div>
      </div>

      {/* Image + add/qty control */}
      <div style={{ position: 'relative' }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{
              width: '100px',
              height: '80px',
              objectFit: 'cover',
              borderRadius: 'var(--saf-radius-sm, 6px)',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100px',
              height: '80px',
              borderRadius: 'var(--saf-radius-sm, 6px)',
              background: 'var(--cream-dark, #F0EDE4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            🍽️
          </div>
        )}

        {qty === 0 ? (
          <button
            onClick={onAdd}
            title="Add to cart"
            style={{
              position: 'absolute',
              bottom: '-10px',
              right: '-10px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'var(--ink, #1A1714)',
              color: 'var(--cream, #FAF8F3)',
              border: '2px solid var(--cream, #FAF8F3)',
              fontSize: '18px',
              lineHeight: '1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              transition: 'background 0.15s, transform 0.1s',
            }}
          >
            +
          </button>
        ) : (
          <div
            style={{
              position: 'absolute',
              bottom: '-12px',
              right: '-12px',
              background: 'var(--ink, #1A1714)',
              borderRadius: '100px',
              padding: '2px',
              border: '2px solid var(--cream, #FAF8F3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <button
              onClick={onRemove}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'transparent',
                color: 'var(--cream, #FAF8F3)',
                border: 'none',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
              }}
            >
              −
            </button>
            <span
              style={{
                color: 'var(--cream, #FAF8F3)',
                fontSize: '13px',
                fontWeight: 500,
                minWidth: '16px',
                textAlign: 'center',
              }}
            >
              {qty}
            </span>
            <button
              onClick={onAdd}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'transparent',
                color: 'var(--cream, #FAF8F3)',
                border: 'none',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
              }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Cart Content ─────────────────────────────────────────────────────────────

interface CartContentProps {
  cartEntries: { item: PublicMenuItem; quantity: number }[]
  subtotal: number
  deliveryFee: number
  tax: number
  discount: number
  total: number
  deliveryMode: DeliveryMode
  promoCode: string
  promoApplied: boolean
  instructions: string
  onAdd: (item: PublicMenuItem) => void
  onRemove: (itemId: string) => void
  onClear: () => void
  onPromoChange: (val: string) => void
  onApplyPromo: () => void
  onDeliveryModeChange: (mode: DeliveryMode) => void
  onInstructionsChange: (val: string) => void
  onCheckout: () => void
}

function CartContent({
  cartEntries,
  subtotal,
  deliveryFee,
  tax,
  discount,
  total,
  deliveryMode,
  promoCode,
  promoApplied,
  instructions,
  onAdd,
  onRemove,
  onClear,
  onPromoChange,
  onApplyPromo,
  onDeliveryModeChange,
  onInstructionsChange,
  onCheckout,
}: CartContentProps) {
  const isEmpty = cartEntries.length === 0
  const itemCount = cartEntries.reduce((s, e) => s + e.quantity, 0)
  const currency = cartEntries[0]?.item.currency ?? 'INR'

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid var(--saf-border-strong, rgba(26,23,20,0.2))',
    borderRadius: 'var(--saf-radius-sm, 6px)',
    fontSize: '13px',
    fontFamily: 'inherit',
    color: 'var(--ink, #1A1714)',
    outline: 'none',
    background: 'var(--cream, #FAF8F3)',
    transition: 'border-color 0.15s',
  }

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
              : `${itemCount} item${itemCount !== 1 ? 's' : ''} · ${formatPrice(subtotal, currency)}`}
          </div>
        </div>
        {!isEmpty && (
          <button
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            background: 'var(--cream-dark, #F0EDE4)',
            borderRadius: 'var(--saf-radius-sm, 6px)',
            padding: '4px',
            marginBottom: '1.25rem',
          }}
        >
          {(['delivery', 'pickup'] as DeliveryMode[]).map((mode) => (
            <button
              key={mode}
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
              {mode === 'delivery' ? '🛵 Delivery' : '🏃 Pickup'}
            </button>
          ))}
        </div>

        {/* Address box (delivery only) */}
        {deliveryMode === 'delivery' && (
          <div
            style={{
              background: 'white',
              border: '1px solid var(--saf-border, rgba(26,23,20,0.1))',
              borderRadius: 'var(--saf-radius, 12px)',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-muted, #8A847C)',
                marginBottom: '8px',
              }}
            >
              Delivery address
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input type="text" placeholder="Flat / House no." style={{ ...inputStyle, flex: 1 }} />
              <input type="text" placeholder="Building" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '0' }}>
              <input type="text" placeholder="City" style={{ ...inputStyle, flex: 1 }} />
              <input
                type="text"
                placeholder="PIN"
                maxLength={6}
                style={{ ...inputStyle, flex: '0 0 80px' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--ink-soft, #4A4540)',
                marginTop: '10px',
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Est. delivery:
              <span
                style={{
                  background: 'var(--cream-dark, #F0EDE4)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontWeight: 500,
                  color: 'var(--ink, #1A1714)',
                }}
              >
                35–45 min
              </span>
            </div>
          </div>
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
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🍽️</div>
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
              {cartEntries.map(({ item, quantity }) => (
                <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
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
                      '🍽️'
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}
                    >
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => onRemove(item.id)}
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
                        −
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
                        onClick={() => onAdd(item)}
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
                        +
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
                    {formatPrice(item.price * quantity, currency)}
                  </div>
                </div>
              ))}
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
        {/* Promo code */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => onPromoChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApplyPromo()}
            placeholder="Promo code"
            style={{
              flex: 1,
              padding: '8px 10px',
              border: '1px solid var(--saf-border-strong, rgba(26,23,20,0.2))',
              borderRadius: 'var(--saf-radius-sm, 6px)',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--ink, #1A1714)',
              outline: 'none',
              background: 'white',
              transition: 'border-color 0.15s',
            }}
          />
          <button
            onClick={onApplyPromo}
            style={{
              padding: '8px 14px',
              border: '1px solid var(--saf-border-strong, rgba(26,23,20,0.2))',
              borderRadius: 'var(--saf-radius-sm, 6px)',
              fontSize: '13px',
              fontWeight: 500,
              background: 'transparent',
              color: 'var(--ink, #1A1714)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            Apply
          </button>
        </div>

        {/* Bill summary */}
        {!isEmpty && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}
          >
            <BillRow label="Item total" value={formatPrice(subtotal, currency)} />
            <BillRow
              label="Delivery fee"
              value={deliveryFee === 0 ? '🎉 Free' : formatPrice(deliveryFee, currency)}
            />
            <BillRow label="Taxes & charges" value={formatPrice(tax, currency)} />
            {promoApplied && (
              <BillRow
                label="Promo discount"
                value={`-${formatPrice(discount, currency)}`}
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
              <span>{formatPrice(total, currency)}</span>
            </div>
          </div>
        )}

        {/* Checkout button */}
        <button
          onClick={isEmpty ? undefined : onCheckout}
          disabled={isEmpty}
          style={{
            width: '100%',
            padding: '14px',
            background: isEmpty ? 'var(--cream-dark, #F0EDE4)' : 'var(--terracotta, #C4633A)',
            color: isEmpty ? 'var(--ink-muted, #8A847C)' : 'white',
            border: 'none',
            borderRadius: 'var(--saf-radius, 12px)',
            fontSize: '15px',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: isEmpty ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s, transform 0.1s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isEmpty ? (
            'Add items to checkout'
          ) : (
            <>
              Place Order · {formatPrice(total, currency)}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
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
}: {
  initialCategories: PublicMenuCategory[]
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  const [cart, setCart] = useState<CartMap>({})
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('delivery')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [instructions, setInstructions] = useState('')

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

  const addToCart = useCallback(
    (item: PublicMenuItem) => {
      setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))
      showToast(`${item.name} added to cart`)
    },
    [showToast],
  )

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => {
      const qty = prev[itemId] ?? 0
      if (qty <= 1) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return { ...prev, [itemId]: qty - 1 }
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart({})
    setPromoApplied(false)
    setPromoCode('')
  }, [])

  const applyPromo = useCallback(() => {
    const val = promoCode.trim().toUpperCase()
    if (['FIRST50', 'SAVE10'].includes(val)) {
      setPromoApplied(true)
      showToast('✅ Promo applied! 10% off')
    } else if (!val) {
      showToast('Enter a promo code')
    } else {
      showToast('❌ Invalid promo code')
    }
  }, [promoCode, showToast])

  // Flatten all items for cart lookup
  const allItems = useMemo(
    () => initialCategories.flatMap((cat) => cat.items),
    [initialCategories],
  )

  // Cart entries (with item objects)
  const cartEntries = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, quantity]) => {
          const item = allItems.find((i) => i.id === id)
          if (!item) return null
          return { item, quantity }
        })
        .filter((e): e is { item: PublicMenuItem; quantity: number } => e !== null),
    [cart, allItems],
  )

  const totalCartCount = useMemo(
    () => cartEntries.reduce((s, e) => s + e.quantity, 0),
    [cartEntries],
  )

  const subtotal = useMemo(
    () => cartEntries.reduce((s, e) => s + e.item.price * e.quantity, 0),
    [cartEntries],
  )

  const currency = cartEntries[0]?.item.currency ?? 'INR'
  const deliveryFee = deliveryMode === 'pickup' ? 0 : subtotal >= 499 ? 0 : 40
  const tax = Math.round(subtotal * 0.05)
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0
  const total = subtotal + deliveryFee + tax - discount

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
    promoCode,
    promoApplied,
    instructions,
    onAdd: addToCart,
    onRemove: removeFromCart,
    onClear: clearCart,
    onPromoChange: setPromoCode,
    onApplyPromo: applyPromo,
    onDeliveryModeChange: setDeliveryMode,
    onInstructionsChange: setInstructions,
    onCheckout: () => setOrderPlaced(true),
  }

  const offers =
    config?.content?.heroHeadline
      ? ['🎉 50% off first order', 'Free delivery over ₹499']
      : ['🎉 50% off first order', 'Free delivery over ₹499']

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
      {/* Sticky header with live cart count */}
      <SaffronHeader
        tenant={tenant}
        cartCount={totalCartCount}
        onCartClick={() => setMobileCartOpen(true)}
      />

      {/* Dark hero banner */}
      <SaffronHero tenant={tenant} config={config} offers={offers} />

      {/* Two-column layout: menu + cart */}
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
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
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
                <div style={{ padding: '0 2rem' }}>
                  {cat.items.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        borderBottom:
                          idx < cat.items.length - 1
                            ? '1px solid var(--saf-border, rgba(26,23,20,0.1))'
                            : 'none',
                      }}
                    >
                      <MenuItemCard
                        item={item}
                        qty={cart[item.id] ?? 0}
                        onAdd={() => addToCart(item)}
                        onRemove={() => removeFromCart(item.id)}
                      />
                    </div>
                  ))}
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

      {/* ── Mobile floating cart button ── */}
      <div className="saffron-mobile-fab">
        <button
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
              {formatPrice(total, currency)}
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
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <CartContent {...cartProps} />
            </div>
          </div>
        </div>
      )}

      <SaffronFooter tenant={tenant} config={config} />

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
              clearCart()
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
            <div style={{ fontSize: '52px', marginBottom: '1rem' }}>🎉</div>
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
              Your food is being prepared. Estimated delivery in{' '}
              <strong>35–45 min</strong>. You&apos;ll get updates on your phone.
            </p>
            <button
              onClick={() => {
                setOrderPlaced(false)
                clearCart()
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
