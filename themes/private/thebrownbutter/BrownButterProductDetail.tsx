'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import { resolveGalleryUrlsForVariant, resolveProductGalleryUrls } from '@/lib/storefront-api'
import { containsHtml, stripHtml } from '@/lib/product-seo'
import {
  getDefaultVariant,
  getEffectiveOriginalPrice,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'
import {
  getEarliestDeliverySlot,
  getOrderingAvailabilityFromConfig,
  getOrderingHoursFromConfig,
  isStoreOpenNow,
} from '@/lib/orderingHours'
import type { ThemeTenant } from '@/themes/restaurant/types'
import { BrownButterFrame } from './BrownButterFrame'
import { formatDeliverySummary } from './BrownButterFooter'
import { BrownButterImage } from './BrownButterImage'
import { normalizeProseHtml } from './BrownButterPageParts'
import { useBrownButterCart } from './useBrownButterCart'

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

function prepLabel(minutes?: number): string | null {
  if (!minutes) return null
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} hr${minutes === 60 ? '' : 's'}`
  if (minutes > 60) return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
  return `${minutes} min`
}

function Icon({ kind }: { kind: 'oven' | 'truck' | 'leaf' | 'clock' }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (kind === 'truck')
    return (
      <svg {...common}>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </svg>
    )
  if (kind === 'leaf')
    return (
      <svg {...common}>
        <path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" />
        <path d="M5 19 13 11" />
      </svg>
    )
  if (kind === 'clock')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  return (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 10h18M8 15h8" />
    </svg>
  )
}

export function BrownButterProductDetail({
  tenant,
  config,
  product,
  navLinks,
  related = [],
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  product: PublicProduct
  navLinks?: StorefrontNavLink[]
  related?: PublicProduct[]
}) {
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product])
  const [variantId, setVariantId] = useState<string | undefined>(defaultVariant?.id)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { itemCount, subtotal, add, setQty, qtyFor, hydrated } = useBrownButterCart(tenant.id)

  useEffect(() => {
    setVariantId(defaultVariant?.id)
    setPhotoIndex(0)
  }, [product.id, defaultVariant?.id])

  useEffect(() => {
    setMounted(true)
  }, [])

  const photos = useMemo(
    () => resolveGalleryUrlsForVariant(product, variantId),
    [product, variantId],
  )
  const photo = photos[photoIndex] || photos[0]
  const price = getEffectivePrice(product, variantId)
  const compareAt = getEffectiveOriginalPrice(product, variantId)
  const inStock = isVariantInStock(product, variantId)
  const needsVariant = productHasVariants(product)
  const selectedVariant = needsVariant ? variantId : undefined
  const qty = qtyFor(product.id, selectedVariant)
  const canAdd = inStock && (!needsVariant || Boolean(variantId))

  const shortCopy = (product.shortDescription || '').trim()
  const longCopy = (product.description || '').trim()
  const lead = shortCopy || stripHtml(longCopy)
  // Full description only when it adds something beyond the lead line.
  const showLongCopy = Boolean(longCopy) && stripHtml(longCopy) !== stripHtml(shortCopy || '')

  const availability = useMemo(() => getOrderingAvailabilityFromConfig(config), [config])
  const prep = prepLabel(availability.leadTimeMinutes)
  const deliverySummary = formatDeliverySummary(config)

  // Time-dependent — computed after mount so server and client HTML match.
  const orderStatus = useMemo(() => {
    if (!mounted) return null
    const hours = getOrderingHoursFromConfig(config)
    const now = new Date()
    const open = isStoreOpenNow(hours, now, availability)
    const slot = getEarliestDeliverySlot(hours, availability, now)
    return { open, slot }
  }, [mounted, config, availability])

  return (
    <BrownButterFrame
      config={config}
      navLinks={navLinks}
      headerTitle={config?.branding?.siteName || tenant.name}
      contactPhone={config?.branding?.contactPhone}
      layout="wide"
    >
      <article className="bb-pdp" aria-labelledby="bb-pdp-title">
        <nav className="bb-crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">Menu</Link>
            </li>
            {product.categoryName ? <li>{product.categoryName}</li> : null}
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="bb-pdp-layout">
          <div className="bb-pdp-gallery">
            <div className="bb-pdp-photo">
              <BrownButterImage src={photo} alt={product.name} className="bb-pdp-img" />
              <span className="bb-pdp-veg" title="Vegetarian">
                <span className="veg-dot" aria-hidden />
                <span className="sr-only">Vegetarian</span>
              </span>
              {!inStock ? <span className="bb-pdp-sold">Sold out</span> : null}
            </div>
            {photos.length > 1 ? (
              <div className="bb-pdp-thumbs" aria-label="More photos">
                {photos.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    className={`bb-pdp-thumb${index === photoIndex ? ' is-active' : ''}`}
                    aria-label={`Photo ${index + 1} of ${product.name}`}
                    aria-pressed={index === photoIndex}
                    onClick={() => setPhotoIndex(index)}
                  >
                    <BrownButterImage src={src} alt="" className="bb-pdp-thumb-img" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="bb-pdp-info">
            {product.categoryName ? <p className="bb-kicker">{product.categoryName}</p> : null}
            <h1 className="bb-page-title" id="bb-pdp-title">
              {product.name}
            </h1>
            <p className="bb-pdp-price">
              <span>{formatInr(price)}</span>
              {compareAt && compareAt > price ? (
                <>
                  <s>{formatInr(compareAt)}</s>
                  <span className="bb-pdp-save">Save {formatInr(compareAt - price)}</span>
                </>
              ) : null}
            </p>
            {lead ? <p className="bb-lead">{lead}</p> : null}

            {needsVariant && product.variants?.length ? (
              <div className="bb-pdp-variants-block">
                <p className="bb-pdp-label" id="bb-pdp-size">
                  Choose size
                </p>
                <div className="bb-pdp-variants" role="radiogroup" aria-labelledby="bb-pdp-size">
                  {product.variants.map((variant) => {
                    const selected = variant.id === variantId
                    const soldOut = variant.inStock === false
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={soldOut}
                        className={`bb-pdp-variant${selected ? ' is-active' : ''}`}
                        onClick={() => {
                          setVariantId(variant.id)
                          setPhotoIndex(0)
                        }}
                      >
                        <span>{variant.name}</span>
                        <span>{soldOut ? 'Sold out' : formatInr(variant.price)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="bb-pdp-buy">
              {qty > 0 ? (
                <div className="bb-pdp-buy-row">
                  <div className="qty-stepper bb-pdp-stepper" aria-label="Quantity">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty(product, qty - 1, selectedVariant)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="qty-num" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty(product, qty + 1, selectedVariant)}
                      disabled={!canAdd}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <Link href="/?cart=open" className="btn bb-pdp-checkout">
                    <span>View order · {formatInr(subtotal)}</span>
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn"
                  disabled={!canAdd || !hydrated}
                  onClick={() => add(product, selectedVariant)}
                >
                  <span>{inStock ? `Add to order · ${formatInr(price)}` : 'Sold out'}</span>
                  <span aria-hidden>{inStock ? '→' : ''}</span>
                </button>
              )}
            </div>

            <div className="bb-pdp-status" aria-live="polite">
              {orderStatus ? (
                <>
                  <span className={`status-indicator${orderStatus.open ? '' : ' status-indicator--closed'}`} />
                  <span>
                    <strong>{orderStatus.open ? 'Taking orders now' : 'Ordering closed right now'}</strong>
                    {orderStatus.slot ? (
                      <>
                        {' '}
                        · earliest {orderStatus.slot.dayLabel.toLowerCase()}, {orderStatus.slot.slot.label}
                      </>
                    ) : null}
                  </span>
                </>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>

            <ul className="bb-pdp-highlights">
              <li>
                <Icon kind="oven" />
                <span>
                  <strong>Baked to order</strong>
                  {prep ? `${prep} prep — made fresh for you` : 'Small-batch, made fresh for you'}
                </span>
              </li>
              <li>
                <Icon kind="truck" />
                <span>
                  <strong>Pickup &amp; delivery</strong>
                  {deliverySummary}{' '}
                  <Link href="/shipping-policy" className="bb-pdp-inline-link">
                    Shipping policy
                  </Link>
                </span>
              </li>
              <li>
                <Icon kind="leaf" />
                <span>
                  <strong>100% vegetarian</strong>
                  Everything on our menu is pure veg.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {showLongCopy ? (
          <div className="bb-pdp-details">
              <section className="bb-pdp-section" aria-labelledby="bb-pdp-about">
                <h2 id="bb-pdp-about">About {product.name}</h2>
                {containsHtml(longCopy) ? (
                  <div className="bb-prose" dangerouslySetInnerHTML={{ __html: normalizeProseHtml(longCopy) }} />
                ) : (
                  <div className="bb-prose">
                    {longCopy.split(/\n{2,}/).map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </section>
          </div>
        ) : null}

        {related.length ? (
          <section className="bb-pdp-related" aria-labelledby="bb-pdp-related">
            <h2 id="bb-pdp-related" className="menu-section-label">
              {product.categoryName && related.some((p) => p.categorySlug === product.categorySlug)
                ? `More ${product.categoryName}`
                : 'You might also like'}
            </h2>
            <ul className="bb-related-grid">
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={`/products/${item.slug}`} className="bb-related-card">
                    <span className="bb-related-img">
                      <BrownButterImage src={resolveProductGalleryUrls(item)[0]} alt="" className="card-img" />
                    </span>
                    <span className="bb-related-body">
                      <span className="card-name">{item.name}</span>
                      <span className="card-price">{formatInr(item.price)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      {mounted && itemCount > 0
        ? createPortal(
            <Link href="/?cart=open" className="sticky-cart visible bb-pdp-sticky-cart">
              <span className="sticky-cart__left">
                <span className="sticky-cart__icon" aria-hidden>🛒</span>
                <span className="sticky-cart__count">{itemCount}</span>
                <span className="sticky-cart__label">View order</span>
              </span>
              <span className="sticky-cart__total">{formatInr(subtotal)}</span>
              <span className="sticky-cart__arrow" aria-hidden>→</span>
            </Link>,
            document.body,
          )
        : null}
    </BrownButterFrame>
  )
}
