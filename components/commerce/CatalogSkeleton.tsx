import { ProductCardSkeleton } from './ProductCard'
import './commerce.css'

/** Route-level loading UI for catalog pages (`loading.tsx`). */
export function CatalogSkeleton({ count = 8 }: { count?: number }) {
  return (
    <main className="sf-container" aria-busy="true" aria-label="Loading products">
      <div className="sf-page-head">
        <span className="sf-skeleton" style={{ height: 14, width: 140 }} />
        <span className="sf-skeleton" style={{ height: 36, width: 260, marginTop: 14 }} />
      </div>
      <ul className="sf-product-grid" style={{ paddingBottom: 'var(--sf-section-y)' }}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    </main>
  )
}
