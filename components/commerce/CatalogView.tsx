'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { PublicProduct, StorefrontProductCategory } from '@/lib/storefront-api'
import { formatMoney } from '@/lib/format'
import { productHasVariants } from '@/lib/productVariants'
import { Button, Drawer, IconFilter, Select, cx } from '@/ui'
import { ProductCard } from './ProductCard'
import './commerce.css'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name' | 'discount'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'name', label: 'Alphabetical' },
]

function minPrice(p: PublicProduct): number {
  if (productHasVariants(p)) return Math.min(...p.variants!.map((v) => v.price))
  return p.price
}

function discount(p: PublicProduct): number {
  return p.originalPrice && p.originalPrice > p.price ? (p.originalPrice - p.price) / p.originalPrice : 0
}

/**
 * Collection page body: category links, price band + availability filters
 * (sidebar on desktop, drawer on mobile), sort and result count. Filtering is
 * client-side over the server-fetched list so it stays instant.
 */
export function CatalogView({
  products,
  categories,
  activeCategory,
  wishlistEnabled,
}: {
  products: PublicProduct[]
  categories?: StorefrontProductCategory[]
  /** Category slug of the current page; links instead of filters when set. */
  activeCategory?: string
  wishlistEnabled?: boolean
}) {
  const [sort, setSort] = useState<Sort>('featured')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [onSaleOnly, setOnSaleOnly] = useState(false)
  const [band, setBand] = useState<number | null>(null)
  const [drawer, setDrawer] = useState(false)
  const currency = products[0]?.currency ?? 'INR'

  const bands = useMemo(() => {
    if (products.length < 4) return []
    const prices = products.map(minPrice).sort((a, b) => a - b)
    const max = prices[prices.length - 1]
    if (!max) return []
    const step = Math.max(1, Math.ceil(max / 4 / 100) * 100)
    return [0, 1, 2, 3].map((i) => ({ from: i * step, to: i === 3 ? Infinity : (i + 1) * step }))
  }, [products])

  const visible = useMemo(() => {
    let list = products.filter((p) => {
      if (inStockOnly && !p.inStock) return false
      if (onSaleOnly && discount(p) <= 0) return false
      if (band != null && bands[band]) {
        const price = minPrice(p)
        if (price < bands[band].from || price >= bands[band].to) return false
      }
      return true
    })
    if (sort !== 'featured') {
      list = [...list].sort((a, b) => {
        if (sort === 'price-asc') return minPrice(a) - minPrice(b)
        if (sort === 'price-desc') return minPrice(b) - minPrice(a)
        if (sort === 'discount') return discount(b) - discount(a)
        return a.name.localeCompare(b.name)
      })
    }
    return list
  }, [products, inStockOnly, onSaleOnly, band, bands, sort])

  const activeCount = Number(inStockOnly) + Number(onSaleOnly) + Number(band != null)
  const hasSale = products.some((p) => discount(p) > 0)
  const cats = [...(categories ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const filters = (
    <div className="sf-filters">
      {cats.length > 0 && (
        <div className="sf-filters__group">
          <p className="sf-filters__title">Category</p>
          <ul className="sf-filters__links">
            <li>
              <Link href="/products" aria-current={!activeCategory ? 'page' : undefined}>
                All products
              </Link>
            </li>
            {cats.map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} aria-current={activeCategory === c.slug ? 'page' : undefined}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {bands.length > 0 && (
        <div className="sf-filters__group">
          <p className="sf-filters__title">Price</p>
          <div className="sf-filters__chips">
            {bands.map((b, i) => (
              <button
                key={i}
                type="button"
                className="sf-tab"
                aria-pressed={band === i}
                aria-current={band === i ? 'true' : undefined}
                onClick={() => setBand(band === i ? null : i)}
              >
                {b.to === Infinity ? `${formatMoney(b.from, currency)}+` : `${formatMoney(b.from, currency)} – ${formatMoney(b.to, currency)}`}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="sf-filters__group">
        <p className="sf-filters__title">Availability</p>
        <label className="sf-check">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
          <span>In stock only</span>
        </label>
        {hasSale && (
          <label className="sf-check">
            <input type="checkbox" checked={onSaleOnly} onChange={(e) => setOnSaleOnly(e.target.checked)} />
            <span>On sale</span>
          </label>
        )}
      </div>
      {activeCount > 0 && (
        <Button
          variant="link"
          onClick={() => {
            setInStockOnly(false)
            setOnSaleOnly(false)
            setBand(null)
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="sf-catalog">
      <aside className="sf-catalog__aside" aria-label="Filters">
        {filters}
      </aside>
      <div className="sf-catalog__main">
        <div className="sf-catalog__toolbar">
          <Button variant="secondary" size="sm" className="sf-catalog__filter-btn" iconLeft={<IconFilter size={16} />} onClick={() => setDrawer(true)}>
            Filter{activeCount ? ` (${activeCount})` : ''}
          </Button>
          <p className="sf-catalog__count" aria-live="polite">
            {visible.length} {visible.length === 1 ? 'product' : 'products'}
          </p>
          <label className="sf-catalog__sort">
            <span className="sf-visually-hidden">Sort by</span>
            <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {visible.length ? (
          <ul className={cx('sf-product-grid', 'sf-product-grid--3')}>
            {visible.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} wishlistEnabled={wishlistEnabled} priority={i < 3} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="sf-product-empty">
            <p>No products match these filters.</p>
          </div>
        )}
      </div>
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        side="left"
        title="Filters"
        footer={
          <Button block onClick={() => setDrawer(false)}>
            Show {visible.length} results
          </Button>
        }
      >
        {filters}
      </Drawer>
    </div>
  )
}
