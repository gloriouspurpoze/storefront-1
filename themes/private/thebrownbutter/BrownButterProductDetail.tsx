'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { PublicProduct, StorefrontConfig } from '@/lib/storefront-api'
import { resolveGalleryUrlsForVariant } from '@/lib/storefront-api'
import { containsHtml } from '@/lib/product-seo'
import {
  getDefaultVariant,
  getEffectiveOriginalPrice,
  getEffectivePrice,
  isVariantInStock,
  productHasVariants,
} from '@/lib/productVariants'
import type { ThemeTenant } from '@/themes/restaurant/types'
import { BrownButterFrame } from './BrownButterFrame'
import { BrownButterImage } from './BrownButterImage'
import { useBrownButterCart } from './useBrownButterCart'

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function BrownButterProductDetail({
  tenant,
  config,
  product,
  navLinks,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  product: PublicProduct
  navLinks?: StorefrontNavLink[]
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
  const description = (product.description || product.shortDescription || '').trim()
  const shortCopy =
    product.shortDescription && product.shortDescription !== product.description
      ? product.shortDescription.trim()
      : ''

  const canAdd = inStock && (!needsVariant || Boolean(variantId))

  return (
    <BrownButterFrame
      config={config}
      navLinks={navLinks}
      headerTitle={config?.branding?.siteName || tenant.name}
      contactPhone={config?.branding?.contactPhone}
    >
      <article className="bb-pdp">
        <Link href="/" className="bb-back">
          ← Menu
        </Link>

        <div className="bb-pdp-gallery">
          <div className="bb-pdp-photo">
            <BrownButterImage src={photo} alt={product.name} className="bb-pdp-img" />
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

        {product.categoryName ? <p className="bb-kicker">{product.categoryName}</p> : null}
        <h1 className="bb-page-title">{product.name}</h1>
        <p className="bb-pdp-price">
          <span>{formatInr(price)}</span>
          {compareAt && compareAt > price ? <s>{formatInr(compareAt)}</s> : null}
        </p>
        {shortCopy ? <p className="bb-lead">{shortCopy}</p> : null}

        {needsVariant && product.variants?.length ? (
          <div className="bb-pdp-variants" role="radiogroup" aria-label="Size">
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
        ) : null}

        <div className="bb-pdp-buy">
          {qty > 0 ? (
            <div className="qty-stepper bb-pdp-stepper" aria-label="Quantity">
              <button type="button" className="qty-btn" onClick={() => setQty(product, qty - 1, selectedVariant)} aria-label="Decrease quantity">
                −
              </button>
              <span className="qty-num">{qty}</span>
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
          ) : (
            <button
              type="button"
              className="btn"
              disabled={!canAdd || !hydrated}
              onClick={() => add(product, selectedVariant)}
            >
              <span>{inStock ? 'Add to order' : 'Sold out'}</span>
              <span aria-hidden>{inStock ? '→' : ''}</span>
            </button>
          )}
        </div>

        {description ? (
          containsHtml(description) ? (
            <div className="bb-prose bb-pdp-copy" dangerouslySetInnerHTML={{ __html: description }} />
          ) : (
            <div className="bb-prose bb-pdp-copy">
              {description.split(/\n{2,}/).map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          )
        ) : null}
      </article>

      {mounted && itemCount > 0
        ? createPortal(
            <Link href="/?cart=open" className="sticky-cart visible">
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
