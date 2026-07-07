import type { ReactNode } from 'react'

export type PromoBlockProps<T> = {
  items: T[]
  className?: string
  listClassName?: string
  itemClassName?: string
  ariaLabel?: string
  getItemKey?: (item: T, index: number) => string | number
  renderItem: (item: T, index: number) => ReactNode
}

/** Stacked inline promo layout — theme renders each promo card. */
export function PromoBlock<T>({
  items,
  className,
  listClassName,
  itemClassName,
  ariaLabel = 'Promotions',
  getItemKey,
  renderItem,
}: PromoBlockProps<T>) {
  if (!items.length) return null

  return (
    <section className={className} aria-label={ariaLabel}>
      <div className={listClassName}>
        {items.map((item, index) => (
          <div key={getItemKey ? getItemKey(item, index) : index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </section>
  )
}
