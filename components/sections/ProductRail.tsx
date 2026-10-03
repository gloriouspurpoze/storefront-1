import Link from 'next/link'
import type { PublicProduct } from '@/lib/storefront-api'
import { ProductCard } from '@/components/commerce/ProductCard'
import { Carousel } from '@/ui'
import './sections.css'

/** Section heading + horizontally scrolling product cards. */
export function ProductRail({
  title,
  eyebrow,
  products,
  viewAllHref = '/products',
  wishlistEnabled,
}: {
  title: string
  eyebrow?: string
  products: PublicProduct[]
  viewAllHref?: string
  wishlistEnabled?: boolean
}) {
  if (!products.length) return null
  return (
    <section className="sf-section sf-container">
      <div className="sf-section-head">
        <div>
          {eyebrow && <p className="sf-eyebrow">{eyebrow}</p>}
          <h2 className="sf-heading">{title}</h2>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="sf-btn sf-btn--link">
            View all
          </Link>
        )}
      </div>
      <Carousel label={title} itemWidth={['46%', '31%', 'calc((100% - 3rem) / 4)']} style={{ ['--sf-carousel-nav-top' as string]: '38%' }}>
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} wishlistEnabled={wishlistEnabled} priority={i < 2} />
        ))}
      </Carousel>
    </section>
  )
}
