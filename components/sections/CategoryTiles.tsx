import Link from 'next/link'
import type { PublicProduct, StorefrontProductCategory } from '@/lib/storefront-api'
import { IconArrowRight } from '@/ui'
import './sections.css'

/**
 * Category tiles. Categories carry no imagery, so each tile borrows the first
 * product image in that category; tiles without one get a brand-tinted card.
 */
export function CategoryTiles({
  categories,
  products,
  title = 'Shop by category',
  limit = 8,
}: {
  categories: StorefrontProductCategory[]
  products: PublicProduct[]
  title?: string
  limit?: number
}) {
  const items = [...categories]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, limit)
    .map((c) => ({
      ...c,
      image: products.find((p) => p.categorySlug === c.slug && p.imageUrl)?.imageUrl,
    }))
  if (items.length < 2) return null

  return (
    <section className="sf-section sf-container">
      <div className="sf-section-head">
        <h2 className="sf-heading">{title}</h2>
        <Link href="/products" className="sf-btn sf-btn--link">
          View all
        </Link>
      </div>
      <ul className="sf-cat-tiles">
        {items.map((c) => (
          <li key={c.slug}>
            <Link href={`/categories/${c.slug}`} className="sf-cat-tile">
              <span className="sf-cat-tile__media">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" loading="lazy" />
                ) : (
                  <span className="sf-cat-tile__mono" aria-hidden>
                    {c.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="sf-cat-tile__label">
                {c.name}
                <IconArrowRight size={16} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
