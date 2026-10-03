import type { PublicProduct } from '@/lib/storefront-api'
import { ProductCard } from '@/components/commerce/ProductCard'
import { cx } from '@/ui'

export function ProductGrid({
  products,
  wishlistEnabled,
  columns,
}: {
  products: PublicProduct[]
  /** Wishlist add-on; when omitted the hearts follow the page header's add-on registration. */
  wishlistEnabled?: boolean
  /** Max columns on wide screens (default 4; 3 when a filter sidebar is shown). */
  columns?: 3 | 4
}) {
  if (!products.length) {
    return <p className="sf-product-empty">Our catalog is being updated. Please check back soon.</p>
  }

  return (
    <ul className={cx('sf-product-grid', columns === 3 && 'sf-product-grid--3')}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} wishlistEnabled={wishlistEnabled} priority={i < 4} />
        </li>
      ))}
    </ul>
  )
}
