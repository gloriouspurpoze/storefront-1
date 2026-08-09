'use client'

import Link from 'next/link'
import type { PublicProduct } from '@/lib/storefront-api'
import { formatListPrice, isVariantInStock } from '@/lib/productVariants'
import { formatMoney } from '../cart'
import { LuxeEssenceAddControl } from './LuxeEssenceAddControl'
import { LuxeEssenceCatalogSectionShell } from './LuxeEssenceCatalogEmpty'

export function LuxeEssenceProductImage({
  product,
  imageUrl: imageUrlProp,
}: {
  product: PublicProduct
  /** Override for variant-specific photos (quick-add modal). */
  imageUrl?: string
}) {
  const imageUrl = (imageUrlProp ?? product.imageUrl)?.trim()

  return (
    <div className={`le-product-img${imageUrl ? '' : ' le-product-img--empty'}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" />
      ) : null}
    </div>
  )
}

function LuxeEssenceProductCard({
  product,
  authReady,
  variantQty,
  onAdd,
  onSelectOptions,
}: {
  product: PublicProduct
  authReady: boolean
  variantQty: number
  onAdd: (product: PublicProduct) => void
  onSelectOptions: (product: PublicProduct) => void
}) {
  const description = product.shortDescription?.trim() || product.description?.trim()
  const inStock = isVariantInStock(product)

  return (
    <article
      className={`le-product-card${!inStock ? ' le-product-card--unavail' : ''}${
        variantQty > 0 ? ' le-product-card--in-cart' : ''
      }`}
    >
      <Link href={`/products/${product.slug}`} className="le-product-card-link">
        <div className="le-product-media">
          <LuxeEssenceProductImage product={product} />
          {variantQty > 0 ? (
            <span className="le-product-qty-badge" aria-label={`${variantQty} in cart`}>
              {variantQty}
            </span>
          ) : null}
          {!inStock ? <span className="le-product-oos-badge">Sold out</span> : null}
        </div>
        <div className="le-product-info">
          <h3 className="le-product-title">{product.name}</h3>
          {description ? <p className="le-product-desc">{description}</p> : null}
          <p className="le-product-price">
            {formatListPrice(product, (amount) => formatMoney(amount, product.currency))}
          </p>
        </div>
      </Link>
      <LuxeEssenceAddControl
        product={product}
        authReady={authReady}
        variantQty={variantQty}
        onAdd={onAdd}
        onSelectOptions={onSelectOptions}
      />
    </article>
  )
}

export function LuxeEssenceProductGrid({
  products,
  authReady,
  totalQtyForProduct,
  onAdd,
  onSelectOptions,
  sectionLabel,
  sectionTitle,
}: {
  products: PublicProduct[]
  authReady: boolean
  totalQtyForProduct: (productId: string) => number
  onAdd: (product: PublicProduct) => void
  onSelectOptions: (product: PublicProduct) => void
  sectionLabel?: string
  sectionTitle?: string
}) {
  if (products.length === 0) return null

  return (
    <LuxeEssenceCatalogSectionShell label={sectionLabel} title={sectionTitle}>
      <ul className="le-product-grid">
        {products.map((product) => (
          <li key={product.id}>
            <LuxeEssenceProductCard
              product={product}
              authReady={authReady}
              variantQty={totalQtyForProduct(product.id)}
              onAdd={onAdd}
              onSelectOptions={onSelectOptions}
            />
          </li>
        ))}
      </ul>
    </LuxeEssenceCatalogSectionShell>
  )
}
